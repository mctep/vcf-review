import type { Funnel, ProcessingStepId, StepState, Variant, VcfSource } from '../domain/types'
import { VARIANT_SETS, variantSetForFile } from '../mocks/variants'
import { STEP_SPEED } from './delay'

export interface AnnotationResult {
  variants: Variant[]
  funnel: Funnel
}

export interface ProcessingHandlers {
  onStep: (step: ProcessingStepId, state: StepState) => void
  onError: (step: ProcessingStepId, message: string) => void
}

export interface ProcessingService {
  /**
   * Upload → validate → annotate → filter & rank. Resolves with the ranked variants.
   * `fromStep` resumes a retried job. Returns a cancel function.
   */
  runPipeline(
    caseId: string,
    source: VcfSource,
    handlers: ProcessingHandlers & { onDone: (result: AnnotationResult) => void },
    fromStep?: ProcessingStepId,
  ): () => void
  /** AI interpretation draft for the annotated variants. */
  runInterpretation(caseId: string, handlers: ProcessingHandlers & { onDone: () => void }): () => void
}

const PIPELINE: ProcessingStepId[] = ['uploading', 'validating', 'annotation', 'filtering']

const DURATION_MS: Record<ProcessingStepId, number> = {
  uploading: 2200,
  validating: 1200,
  annotation: 4200,
  filtering: 2600,
  interpretation: 3800,
}

const ERRORS: Partial<Record<ProcessingStepId, string>> = {
  uploading: 'Upload interrupted: connection reset by peer.',
  validating: 'Header declares GRCh37 but contigs match GRCh38.',
  annotation: 'Annotation service timed out after 300 s (HTTP 504).',
  filtering: 'Ranking job exited with status 137.',
  interpretation: 'Interpretation model unavailable (HTTP 503).',
}

/**
 * Demo switch: add `?fail=<step>` to the URL (e.g. `#/new?fail=annotation`) to make
 * that step fail once per case. Retry then succeeds.
 *
 * The step is read when the job starts and remembered per case, because the app navigates
 * away from `#/new?fail=…` right after the case is created.
 */
const failPlan = new Map<string, ProcessingStepId>()
const failedOnce = new Set<string>()

function failParam(): ProcessingStepId | undefined {
  if (typeof window === 'undefined') return undefined
  const query = window.location.search + '&' + (window.location.hash.split('?')[1] ?? '')
  const fail = new URLSearchParams(query.replace(/^\?/, '')).get('fail')
  return (PIPELINE as string[]).concat('interpretation').includes(fail ?? '')
    ? (fail as ProcessingStepId)
    : undefined
}

function rememberFailPlan(caseId: string) {
  const step = failParam()
  if (step && !failPlan.has(caseId)) failPlan.set(caseId, step)
}

function shouldFail(caseId: string, step: ProcessingStepId): boolean {
  const key = `${caseId}:${step}`
  if ((failPlan.get(caseId) ?? failParam()) === step && !failedOnce.has(key)) {
    failedOnce.add(key)
    return true
  }
  return false
}

function runSteps(
  caseId: string,
  steps: ProcessingStepId[],
  handlers: ProcessingHandlers,
  onDone: () => void,
  durations: Partial<Record<ProcessingStepId, number>> = {},
): () => void {
  let cancelled = false
  let timer: ReturnType<typeof setTimeout> | undefined

  const next = (i: number) => {
    if (cancelled) return
    if (i >= steps.length) return onDone()
    const step = steps[i]
    handlers.onStep(step, 'running')
    timer = setTimeout(
      () => {
        if (cancelled) return
        if (shouldFail(caseId, step)) {
          handlers.onStep(step, 'failed')
          handlers.onError(step, ERRORS[step] ?? 'Unexpected error.')
          return
        }
        handlers.onStep(step, 'done')
        next(i + 1)
      },
      (durations[step] ?? DURATION_MS[step]) * STEP_SPEED,
    )
  }
  next(0)
  return () => {
    cancelled = true
    if (timer) clearTimeout(timer)
  }
}

export const mockProcessing: ProcessingService = {
  runPipeline(caseId, source, handlers, fromStep) {
    rememberFailPlan(caseId)
    const start = fromStep ? PIPELINE.indexOf(fromStep) : 0
    const steps = PIPELINE.slice(Math.max(start, 0))
    // Remote files are fetched server-side, so "uploading" is quicker.
    const durations = source.kind === 'remote' ? { uploading: 900 } : {}
    return runSteps(
      caseId,
      steps,
      handlers,
      () => {
        const set = VARIANT_SETS[variantSetForFile(source.fileName)]
        handlers.onDone({ variants: set.variants, funnel: set.funnel })
      },
      durations,
    )
  },
  runInterpretation(caseId, handlers) {
    return runSteps(caseId, ['interpretation'], handlers, handlers.onDone)
  },
}
