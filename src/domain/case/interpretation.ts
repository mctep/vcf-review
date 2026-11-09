import { missingRequiredFields, waitingMessage } from '../metadata/requiredFields'
import type { Case } from '../types'

/**
 * What the reviewer can see for a case:
 * - annotated variants (gene, HGVS, VAF, consequence) as soon as filtering & ranking are done;
 * - AI-derived content (classifications, descriptions, flags) and the report only after interpretation.
 */
export type InterpretationState = 'not-annotated' | 'waiting' | 'running' | 'failed' | 'done'

export function isAnnotated(c: Case): boolean {
  return c.processing.steps.filtering === 'done' && c.variants.length > 0
}

export function interpretationState(c: Case): InterpretationState {
  const step = c.processing.steps.interpretation
  if (step === 'done') return 'done'
  if (step === 'failed') return 'failed'
  if (!isAnnotated(c)) return 'not-annotated'
  if (step === 'waiting') return 'waiting'
  return 'running'
}

/** Why AI content / the report is not available yet, or `undefined` when it is. */
export function interpretationBlockReason(c: Case): string | undefined {
  switch (interpretationState(c)) {
    case 'done':
      return undefined
    case 'not-annotated':
      return c.status === 'failed'
        ? 'Processing failed before variants were annotated.'
        : 'Variants are still being annotated, filtered and ranked.'
    case 'waiting':
      return `${waitingMessage(missingRequiredFields(c.metadata))}.`
    case 'running':
      return 'AI interpretation is being drafted.'
    case 'failed':
      return 'AI interpretation failed. Retry it from the Details tab.'
  }
}
