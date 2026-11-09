import { create } from 'zustand'
import {
  auditEvent,
  createCase,
  CURRENT_USER,
  isStepComplete,
  newId,
  processingProgress,
  sourceFormat,
} from '../domain/case/factory'
import { STEP_LABEL } from '../domain/labels'
import { describeInputChanges, isInterpretationStale } from '../domain/case/interpretation'
import { buildReport } from '../domain/report/buildReport'
import { canStartInterpretation, REQUIRED_FIELD_LABELS } from '../domain/metadata/requiredFields'
import { resolveTumorType } from '../domain/metadata/tumorTypeMapping'
import {
  PROCESSING_STEPS,
  type AuditEvent,
  type Case,
  type CaseMetadata,
  type ChatQuote,
  type InterpretationField,
  type MetadataOrigin,
  type ProcessingStepId,
  type ReportSectionId,
  type StepState,
  type VcfSource,
} from '../domain/types'
import { ONCOTREE } from '../mocks/oncotree'
import { seedCases } from '../mocks/seedCases'
import { services } from '../services'
import type { LimsOrder } from '../services/lims'
import type { PlatformCaseContext } from '../services/processing'

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
  /** Fetches the test order from the LIMS and applies it. Runs automatically when a case is created. */
  fetchLims: (caseId: string) => Promise<'applied' | 'not-found'>
  /**
   * Re-runs AI interpretation after its inputs changed. Reviewer edits to descriptions and report text are
   * discarded (they were written for the old draft); variant selection is kept.
   */
  rerunInterpretation: (caseId: string) => void
  /** Keeps the current draft although its inputs changed (the reviewer judged the change irrelevant). */
  keepInterpretation: (caseId: string) => void
  /** Confirms a pre-filled value that came from an ambiguous source. */
  confirmField: (caseId: string, field: InterpretationField) => void
  toggleVariant: (caseId: string, variantId: string) => void
  setSelection: (caseId: string, variantIds: string[]) => void
  editDescription: (caseId: string, variantId: string, field: 'gene' | 'variant', text: string) => void
  leaveFeedback: (caseId: string, variantId: string, text: string) => void
  setReportSection: (caseId: string, section: ReportSectionId, text: string, actor?: string) => void
  clearHighlight: (caseId: string) => void
  /** Sends a message to the report assistant, optionally about a quoted passage of the report. */
  sendChat: (caseId: string, prompt: string, quote?: ChatQuote) => Promise<void>
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
    if (
      !isStepComplete(steps.filtering) ||
      steps.interpretation === 'running' ||
      steps.interpretation === 'done'
    )
      return
    if (!canStartInterpretation(c.metadata)) {
      if (steps.interpretation !== 'waiting') setStep(id, 'interpretation', 'waiting')
      return
    }
    // The draft is valid for the inputs it started with; later changes make it stale.
    const context = { tumorType: c.metadata.tumorType, tumorContent: c.metadata.tumorContent }
    const cancel = services.processing.runInterpretation(id, {
      onStep: (step, state) => setStep(id, step, state),
      onError: (step, message) => fail(id, step, message),
      onDone: () => {
        jobs.delete(id)
        const done = getCase(id)
        patchCase(id, (x) => ({
          ...x,
          status: 'ready',
          interpretationContext: context,
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
        onDone: ({ variants, funnel, imported }) => {
          jobs.delete(id)
          patchCase(id, (x) => ({ ...x, variants, funnel, selected: variants.map((v) => v.id) }))
          if (!imported) {
            log(
              id,
              auditEvent(
                'processing.step',
                `Annotation, filtering & ranking completed: ${funnel.total.toLocaleString('en')} → ${funnel.reportable} reportable variants`,
                'System',
              ),
            )
          } else {
            log(
              id,
              auditEvent(
                'processing.step',
                `Imported ${funnel.reportable} ranked variants from ${imported.platform}; annotation and ranking were done on the platform`,
                'System',
              ),
            )
            importContext(id, imported.context, imported.platform)
          }
          maybeInterpret(id)
        },
      },
      fromStep,
    )
    jobs.set(id, cancel)
  }

  /** Applies the case context recorded on the analysis platform. Never overwrites values a person typed. */
  const importContext = (id: string, context: PlatformCaseContext, platform: string) => {
    const c = getCase(id)
    if (!c) return
    const patch = Object.fromEntries(
      Object.entries(context).filter(
        ([k, v]) => v !== undefined && c.metadata.origin[k as keyof MetadataPatch] !== 'user',
      ),
    ) as MetadataPatch
    if (!Object.keys(patch).length) {
      log(id, auditEvent('metadata.updated', `No case context in the ${platform} export`, 'System'))
      return
    }
    // The platform already used these values for annotation and ranking, so they count as confirmed.
    const unconfirmed = (c.metadata.unconfirmed ?? []).filter((f) => !(f in patch))
    get().updateMetadata(
      id,
      { ...patch, unconfirmed },
      'platform',
      `Case context imported from ${platform}: ` +
        [
          patch.tumorType && `tumor type ${patch.tumorType.name} (${patch.tumorType.code})`,
          patch.tumorContent !== undefined && `tumor content ${patch.tumorContent}%`,
          patch.diagnosis && 'diagnosis',
          patch.specimenType && 'specimen',
          patch.panel && 'panel',
        ]
          .filter(Boolean)
          .join(', '),
    )
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
      // A platform export carries the case context itself; the LIMS stays available on demand.
      if (sourceFormat(source) === 'vcf') void get().fetchLims(c.id)
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
      const wasStale = isInterpretationStale(c)
      const originPatch = Object.fromEntries(
        Object.keys(patch)
          .filter((k) => k !== 'unconfirmed')
          .map((k) => [k, origin]),
      )
      patchCase(caseId, (x) => {
        // A value typed by a person counts as confirmed.
        const unconfirmed =
          origin === 'user'
            ? (x.metadata.unconfirmed ?? []).filter((f) => !(f in patch))
            : (patch.unconfirmed ?? x.metadata.unconfirmed)
        return {
          ...x,
          metadata: {
            ...x.metadata,
            ...patch,
            unconfirmed,
            origin: { ...x.metadata.origin, ...originPatch },
          },
        }
      })
      if (auditMessage)
        log(caseId, auditEvent('metadata.updated', auditMessage, origin === 'lims' ? 'LIMS' : CURRENT_USER))
      const after = getCase(caseId)!
      if (!wasStale && isInterpretationStale(after))
        log(
          caseId,
          auditEvent(
            'metadata.updated',
            `Interpretation inputs changed (${describeInputChanges(after)}) — AI draft is out of date, awaiting reviewer decision`,
            'System',
          ),
        )
      maybeInterpret(caseId)
    },

    rerunInterpretation(caseId) {
      const c = getCase(caseId)
      if (!c || c.report.status === 'signed' || c.processing.steps.interpretation !== 'done') return
      if (!canStartInterpretation(c.metadata)) return
      const changes = describeInputChanges(c)
      const discarded = Object.keys(c.edits).length + Object.keys(c.report.overrides).length
      jobs.get(caseId)?.()
      jobs.delete(caseId)
      patchCase(caseId, (x) => {
        const steps = { ...x.processing.steps, interpretation: 'pending' as const }
        return {
          ...x,
          status: 'processing',
          edits: {},
          report: { ...x.report, overrides: {}, highlighted: undefined },
          processing: { ...x.processing, steps, progress: processingProgress(steps), finishedAt: undefined },
        }
      })
      log(
        caseId,
        auditEvent(
          'processing.retry',
          `AI interpretation re-run${changes ? ` after input change (${changes})` : ''}` +
            (discarded ? `; ${discarded} reviewer edit${discarded === 1 ? '' : 's'} discarded` : ''),
        ),
      )
      maybeInterpret(caseId)
    },

    keepInterpretation(caseId) {
      const c = getCase(caseId)
      if (!c || !isInterpretationStale(c)) return
      const changes = describeInputChanges(c)
      patchCase(caseId, (x) => ({
        ...x,
        interpretationContext: { tumorType: x.metadata.tumorType, tumorContent: x.metadata.tumorContent },
      }))
      log(
        caseId,
        auditEvent('metadata.updated', `Current AI interpretation kept despite input change (${changes})`),
      )
    },

    applyLimsOrder(caseId, order) {
      const c = getCase(caseId)
      if (!c) return
      // LIMS never overwrites values a person typed or values the analysis platform used.
      const isUserValue = (k: string) => {
        const o = c.metadata.origin[k as keyof MetadataPatch]
        return o === 'user' || o === 'platform'
      }
      const patch = Object.fromEntries(
        Object.entries(order).filter(([k, v]) => v !== undefined && !isUserValue(k)),
      ) as MetadataPatch
      const unconfirmed = new Set(c.metadata.unconfirmed ?? [])
      const notes: string[] = []

      if (!isUserValue('tumorType') && order.diagnosisCode) {
        const { tumorType, needsConfirmation, reason } = resolveTumorType(order.diagnosisCode, ONCOTREE)
        const code = `ICD-O-3 ${order.diagnosisCode.morphology} (${order.diagnosisCode.topography})`
        if (tumorType) {
          patch.tumorType = tumorType
          if (needsConfirmation) unconfirmed.add('tumorType')
          else unconfirmed.delete('tumorType')
          notes.push(
            `Tumor type mapped from ${code} → ${tumorType.name} (${tumorType.code})` +
              (needsConfirmation ? ` — needs confirmation: ${reason}` : ''),
          )
        } else {
          notes.push(`No OncoTree mapping for ${code}; tumor type must be selected manually`)
        }
      }
      if (patch.tumorContent !== undefined)
        notes.push(`Tumor content ${patch.tumorContent}% from pathology record`)
      patch.unconfirmed = [...unconfirmed]

      get().updateMetadata(caseId, patch, 'lims', `Order fetched from LIMS for ${c.metadata.sampleId}`)
      for (const note of notes) log(caseId, auditEvent('metadata.updated', note, 'LIMS'))
    },

    async fetchLims(caseId) {
      const c = getCase(caseId)
      if (!c) return 'not-found'
      const order = await services.lims.fetchOrder(c.metadata.sampleId)
      if (!order) {
        log(caseId, auditEvent('metadata.updated', `No LIMS order found for ${c.metadata.sampleId}`, 'LIMS'))
        return 'not-found'
      }
      get().applyLimsOrder(caseId, order)
      return 'applied'
    },

    confirmField(caseId, field) {
      const c = getCase(caseId)
      if (!c?.metadata.unconfirmed?.includes(field)) return
      patchCase(caseId, (x) => ({
        ...x,
        metadata: { ...x.metadata, unconfirmed: (x.metadata.unconfirmed ?? []).filter((f) => f !== field) },
      }))
      const value =
        field === 'tumorType'
          ? `${c.metadata.tumorType?.name} (${c.metadata.tumorType?.code})`
          : `${c.metadata.tumorContent}%`
      log(
        caseId,
        auditEvent(
          'metadata.updated',
          `${REQUIRED_FIELD_LABELS[field][0].toUpperCase()}${REQUIRED_FIELD_LABELS[field].slice(1)} confirmed: ${value}`,
        ),
      )
      maybeInterpret(caseId)
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

    async sendChat(caseId, prompt, quote) {
      const now = () => new Date().toISOString()
      patchCase(caseId, (x) => ({
        ...x,
        chat: [...x.chat, { id: newId(), role: 'user', text: prompt, quote, at: now() }],
      }))
      const reply = await services.interpretation.chat(caseId, prompt, quote)
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
      const m = getCase(caseId)?.metadata
      log(
        caseId,
        auditEvent(
          'report.signed',
          `Report v1.0 signed and released (tumor type ${m?.tumorType?.code ?? '—'} and tumor content ${m?.tumorContent ?? '—'}% confirmed)`,
        ),
      )
    },
  }
})

export const useCase = (caseId: string | undefined) =>
  useCaseStore((s) => (caseId ? s.cases.find((c) => c.id === caseId) : undefined))
