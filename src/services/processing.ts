import { sampleIdFromFileName, sourceFormat } from '../domain/case/factory'
import type { Funnel, ProcessingStepId, StepState, Variant, VcfSource } from '../domain/types'
import { platformExportFor, type PlatformExportInfo } from '../mocks/platformExports'
import { VARIANT_SETS, variantSetForFile } from '../mocks/variants'

export type { PlatformCaseContext, PlatformExportInfo } from '../mocks/platformExports'
import { STEP_SPEED } from './delay'

export interface AnnotationResult {
  variants: Variant[]
  funnel: Funnel
  /** Present for platform exports: the platform label and the case context recorded there. */
  imported?: PlatformExportInfo
}

export interface ProcessingHandlers {
  onStep: (step: ProcessingStepId, state: StepState) => void
  onError: (step: ProcessingStepId, message: string) => void
}

export interface ProcessingService {
  /**
   * VCF: upload → validate → annotate → filter & rank. Platform export: upload → validate (schema) → import;
   * annotation and ranking are reported as `skipped` because the platform already did them.
   * Resolves with the ranked variants. `fromStep` resumes a retried job. Returns a cancel function.
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

const EXPORT_ERRORS: Partial<Record<ProcessingStepId, string>> = {
  validating: 'Export schema version 2.1 is not supported (expected 3.x).',
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
 */
const failedOnce = new Set<string>()
function shouldFail(caseId: string, step: ProcessingStepId): boolean {
  if (typeof window === 'undefined') return false
  const query = window.location.search + '&' + (window.location.hash.split('?')[1] ?? '')
  const fail = new URLSearchParams(query.replace(/^\?/, '')).get('fail')
  const key = `${caseId}:${step}`
  if (fail === step && !failedOnce.has(key)) {
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
  errors: Partial<Record<ProcessingStepId, string>> = ERRORS,
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
          handlers.onError(step, errors[step] ?? ERRORS[step] ?? 'Unexpected error.')
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
    const isExport = sourceFormat(source) === 'platform-export'
    const pipeline = isExport ? PIPELINE.slice(0, 2) : PIPELINE
    const start = fromStep ? pipeline.indexOf(fromStep) : 0
    const steps = pipeline.slice(Math.max(start, 0))
    // Remote files are fetched server-side, and exports are small, so "uploading" is quicker.
    const durations = {
      ...(source.kind === 'remote' || isExport ? { uploading: 900 } : {}),
      ...(isExport ? { validating: 1400 } : {}),
    }
    return runSteps(
      caseId,
      steps,
      handlers,
      () => {
        const set = VARIANT_SETS[variantSetForFile(source.fileName)]
        if (!isExport) return handlers.onDone({ variants: set.variants, funnel: set.funnel })
        handlers.onStep('annotation', 'skipped')
        handlers.onStep('filtering', 'skipped')
        handlers.onDone({
          variants: set.variants,
          funnel: set.funnel,
          imported: platformExportFor(sampleIdFromFileName(source.fileName)),
        })
      },
      durations,
      isExport ? { ...ERRORS, ...EXPORT_ERRORS } : ERRORS,
    )
  },
  runInterpretation(caseId, handlers) {
    return runSteps(caseId, ['interpretation'], handlers, handlers.onDone)
  },
}
