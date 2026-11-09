import { create } from 'zustand'
import { auditEvent, createCase, CURRENT_USER, newId, processingProgress } from '../domain/case/factory'
import { STEP_LABEL } from '../domain/labels'
import { buildReport } from '../domain/report/buildReport'
import { canStartInterpretation, missingRequiredFields } from '../domain/metadata/requiredFields'
import {
  PROCESSING_STEPS,
  type AuditEvent,
  type Case,
  type CaseMetadata,
  type MetadataOrigin,
  type ProcessingStepId,
  type ReportSectionId,
  type StepState,
  type VcfSource,
} from '../domain/types'
import { seedCases } from '../mocks/seedCases'
import { services } from '../services'
import type { LimsOrder } from '../services/lims'

type MetadataPatch = Partial<Omit<CaseMetadata, 'origin'>>

interface CaseStore {
  cases: Case[]
  /** Starts background jobs for seeded cases that are mid-processing. Idempotent. */
  init: () => void
  createCase: (source: VcfSource) => string
  retry: (caseId: string) => void
  updateMetadata: (
    caseId: string,
    patch: MetadataPatch,
    origin?: MetadataOrigin,
    auditMessage?: string,
  ) => void
  applyLimsOrder: (caseId: string, order: LimsOrder) => void
  toggleVariant: (caseId: string, variantId: string) => void
  setSelection: (caseId: string, variantIds: string[]) => void
  editDescription: (caseId: string, variantId: string, field: 'gene' | 'variant', text: string) => void
  leaveFeedback: (caseId: string, variantId: string, text: string) => void
  setReportSection: (caseId: string, section: ReportSectionId, text: string, actor?: string) => void
  clearHighlight: (caseId: string) => void
  sendChat: (caseId: string, prompt: string) => Promise<void>
  signReport: (caseId: string) => void
}

/** Cancel functions of running background jobs, keyed by case id. */
const jobs = new Map<string, () => void>()
let initialised = false

export const useCaseStore = create<CaseStore>((set, get) => {
  const getCase = (id: string) => get().cases.find((c) => c.id === id)

  const patchCase = (id: string, fn: (c: Case) => Case) =>
    set((s) => ({ cases: s.cases.map((c) => (c.id === id ? fn(c) : c)) }))

  const log = (id: string, event: AuditEvent) => patchCase(id, (c) => ({ ...c, audit: [...c.audit, event] }))

  const setStep = (id: string, step: ProcessingStepId, state: StepState) =>
    patchCase(id, (c) => {
      const steps = { ...c.processing.steps, [step]: state }
      return { ...c, processing: { ...c.processing, steps, progress: processingProgress(steps) } }
    })

  const fail = (id: string, step: ProcessingStepId, message: string) => {
    jobs.delete(id)
    patchCase(id, (c) => ({
      ...c,
      status: 'failed',
      processing: { ...c.processing, error: { step, message } },
    }))
    log(id, auditEvent('processing.failed', `${STEP_LABEL[step]} failed: ${message}`, 'System'))
  }

  /** Starts interpretation if annotation is done and required metadata is present; otherwise waits. */
  const maybeInterpret = (id: string) => {
    const c = getCase(id)
    if (!c || c.status === 'failed') return
    const { steps } = c.processing
    if (steps.filtering !== 'done' || steps.interpretation === 'running' || steps.interpretation === 'done')
      return
    if (!canStartInterpretation(c.metadata)) {
      if (steps.interpretation !== 'waiting') setStep(id, 'interpretation', 'waiting')
      return
    }
    const cancel = services.processing.runInterpretation(id, {
      onStep: (step, state) => setStep(id, step, state),
      onError: (step, message) => fail(id, step, message),
      onDone: () => {
        jobs.delete(id)
        const done = getCase(id)
        patchCase(id, (x) => ({
          ...x,
          status: 'ready',
          processing: { ...x.processing, progress: 100, finishedAt: new Date().toISOString() },
        }))
        log(
          id,
          auditEvent(
            'processing.step',
            `AI interpretation drafted for ${done?.variants.length ?? 0} variants`,
            'System',
          ),
        )
      },
    })
    jobs.set(id, cancel)
  }

  const runPipeline = (id: string, fromStep?: ProcessingStepId) => {
    const c = getCase(id)
    if (!c) return
    jobs.get(id)?.()
    const cancel = services.processing.runPipeline(
      id,
      c.source,
      {
        onStep: (step, state) => setStep(id, step, state),
        onError: (step, message) => fail(id, step, message),
        onDone: ({ variants, funnel }) => {
          jobs.delete(id)
          patchCase(id, (x) => ({ ...x, variants, funnel, selected: variants.map((v) => v.id) }))
          log(
            id,
            auditEvent(
              'processing.step',
              `Annotation, filtering & ranking completed: ${funnel.total.toLocaleString('en')} → ${funnel.reportable} reportable variants`,
              'System',
            ),
          )
          maybeInterpret(id)
        },
      },
      fromStep,
    )
    jobs.set(id, cancel)
  }

  /** Marks a ready case as "in review" on the first reviewer action. */
  const touchReview = (c: Case): Case => (c.status === 'ready' ? { ...c, status: 'review' } : c)

  return {
    cases: seedCases(),

    init() {
      if (initialised) return
      initialised = true
      for (const c of get().cases) {
        if (c.status !== 'processing') continue
        const running = PROCESSING_STEPS.find((s) => c.processing.steps[s] === 'running')
        if (running === 'interpretation') maybeInterpret(c.id)
        else runPipeline(c.id, running)
      }
    },

    createCase(source) {
      const c = createCase(source)
      set((s) => ({ cases: [c, ...s.cases] }))
      runPipeline(c.id)
      return c.id
    },

    retry(caseId) {
      const c = getCase(caseId)
      if (!c?.processing.error) return
      const step = c.processing.error.step
      const from = PROCESSING_STEPS.indexOf(step)
      patchCase(caseId, (x) => {
        const steps = { ...x.processing.steps }
        PROCESSING_STEPS.slice(from).forEach((s) => (steps[s] = 'pending'))
        return {
          ...x,
          status: 'processing',
          processing: { ...x.processing, steps, error: undefined, progress: processingProgress(steps) },
        }
      })
      log(caseId, auditEvent('processing.retry', `Retried from step "${STEP_LABEL[step]}"`))
      if (step === 'interpretation') maybeInterpret(caseId)
      else runPipeline(caseId, step)
    },

    updateMetadata(caseId, patch, origin = 'user', auditMessage) {
      const c = getCase(caseId)
      if (!c) return
      const originPatch = Object.fromEntries(Object.keys(patch).map((k) => [k, origin]))
      patchCase(caseId, (x) => ({
        ...x,
        metadata: { ...x.metadata, ...patch, origin: { ...x.metadata.origin, ...originPatch } },
      }))
      if (auditMessage) log(caseId, auditEvent('metadata.updated', auditMessage))
      const after = getCase(caseId)
      if (after && missingRequiredFields(after.metadata).length === 0) maybeInterpret(caseId)
    },

    applyLimsOrder(caseId, order) {
      const c = getCase(caseId)
      if (!c) return
      // LIMS never overwrites values the user typed.
      const patch = Object.fromEntries(
        Object.entries(order).filter(
          ([k, v]) => v !== undefined && c.metadata.origin[k as keyof MetadataPatch] !== 'user',
        ),
      ) as MetadataPatch
      get().updateMetadata(caseId, patch, 'lims', `Order fetched from LIMS for ${c.metadata.sampleId}`)
    },

    toggleVariant(caseId, variantId) {
      const c = getCase(caseId)
      if (!c || c.report.status === 'signed') return
      const included = c.selected.includes(variantId)
      const v = c.variants.find((x) => x.id === variantId)
      patchCase(caseId, (x) =>
        touchReview({
          ...x,
          selected: included ? x.selected.filter((id) => id !== variantId) : [...x.selected, variantId],
        }),
      )
      log(
        caseId,
        auditEvent(
          'variant.selection',
          `${v?.gene} ${v?.notation} ${included ? 'excluded from' : 'included in'} report`,
        ),
      )
    },

    setSelection(caseId, variantIds) {
      const c = getCase(caseId)
      if (!c || c.report.status === 'signed') return
      patchCase(caseId, (x) => touchReview({ ...x, selected: variantIds }))
      log(
        caseId,
        auditEvent(
          'variant.selection',
          variantIds.length
            ? `All ${variantIds.length} variants included in report`
            : 'All variants excluded from report',
        ),
      )
    },

    editDescription(caseId, variantId, field, text) {
      const c = getCase(caseId)
      const v = c?.variants.find((x) => x.id === variantId)
      patchCase(caseId, (x) => touchReview({ ...x, edits: { ...x.edits, [`${variantId}:${field}`]: text } }))
      log(
        caseId,
        auditEvent(
          'variant.edited',
          `${field === 'gene' ? 'Gene' : 'Variant'} description edited for ${v?.gene} ${v?.notation}`,
        ),
      )
    },

    leaveFeedback(caseId, variantId, text) {
      const v = getCase(caseId)?.variants.find((x) => x.id === variantId)
      log(caseId, auditEvent('variant.feedback', `Feedback on ${v?.gene} ${v?.notation}: “${text}”`))
    },

    setReportSection(caseId, section, text, actor = CURRENT_USER) {
      patchCase(caseId, (x) =>
        touchReview({
          ...x,
          report: {
            ...x.report,
            overrides: { ...x.report.overrides, [section]: text },
            highlighted: section,
          },
        }),
      )
      log(caseId, auditEvent('report.edited', `Report section "${section}" updated`, actor))
    },

    clearHighlight(caseId) {
      patchCase(caseId, (x) => ({ ...x, report: { ...x.report, highlighted: undefined } }))
    },

    async sendChat(caseId, prompt) {
      const now = () => new Date().toISOString()
      patchCase(caseId, (x) => ({
        ...x,
        chat: [...x.chat, { id: newId(), role: 'user', text: prompt, at: now() }],
      }))
      const reply = await services.interpretation.chat(caseId, prompt)
      patchCase(caseId, (x) => ({
        ...x,
        chat: [...x.chat, { id: newId(), role: 'assistant', text: reply.text, at: now() }],
      }))
      if (reply.section && reply.apply) {
        const c = getCase(caseId)
        if (!c || c.report.status === 'signed') return
        const current = buildReport(c).sections[reply.section]
        get().setReportSection(caseId, reply.section, reply.apply(current), 'Assistant')
      }
    },

    signReport(caseId) {
      patchCase(caseId, (x) => ({
        ...x,
        status: 'signed',
        report: {
          ...x.report,
          status: 'signed',
          version: '1.0',
          highlighted: undefined,
          signedBy: CURRENT_USER,
          signedAt: new Date().toISOString(),
        },
      }))
      log(caseId, auditEvent('report.signed', 'Report v1.0 signed and released'))
    },
  }
})

export const useCase = (caseId: string | undefined) =>
  useCaseStore((s) => (caseId ? s.cases.find((c) => c.id === caseId) : undefined))
