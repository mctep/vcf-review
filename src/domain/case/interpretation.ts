import { interpretationBlockers, waitingMessage } from '../metadata/requiredFields'
import type { Case, DisplayStatus, InterpretationContext, InterpretationField } from '../types'

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
      return `${waitingMessage(interpretationBlockers(c.metadata))}.`
    case 'running':
      return 'AI interpretation is being drafted.'
    case 'failed':
      return 'AI interpretation failed. Retry it from the Details tab.'
  }
}

/**
 * Interpretation inputs that changed since the current AI draft was produced. Interpretation is not re-run
 * automatically: a reviewer either re-runs it or keeps the current draft. Signed reports are never stale.
 */
export function staleInputs(c: Case): InterpretationField[] {
  const ctx = c.interpretationContext
  if (!ctx || c.processing.steps.interpretation !== 'done' || c.report.status === 'signed') return []
  const out: InterpretationField[] = []
  if (ctx.tumorType?.code !== c.metadata.tumorType?.code) out.push('tumorType')
  if (ctx.tumorContent !== c.metadata.tumorContent) out.push('tumorContent')
  return out
}

export const isInterpretationStale = (c: Case) => staleInputs(c).length > 0

/** Display value of an interpretation input, e.g. `Lung Adenocarcinoma (LUAD)` or `60%`. */
export function formatInput(field: InterpretationField, ctx: InterpretationContext): string {
  if (field === 'tumorType')
    return ctx.tumorType ? `${ctx.tumorType.name} (${ctx.tumorType.code})` : 'not set'
  return ctx.tumorContent !== undefined ? `${ctx.tumorContent}%` : 'not set'
}

/** `tumor type LUAD → LUSC; tumor content 60% → 40%` */
export function describeInputChanges(c: Case): string {
  const ctx = c.interpretationContext ?? {}
  return staleInputs(c)
    .map((f) => {
      const code = (x: InterpretationContext) =>
        f === 'tumorType' ? (x.tumorType?.code ?? 'not set') : formatInput(f, x)
      return `${f === 'tumorType' ? 'tumor type' : 'tumor content'} ${code(ctx)} → ${code(c.metadata)}`
    })
    .join('; ')
}

/** Status shown in pills, the worklist and the sidebar: a waiting case "needs input" rather than "processing". */
export function displayStatus(c: Case): DisplayStatus {
  return c.status === 'processing' && interpretationState(c) === 'waiting' ? 'needsInput' : c.status
}
