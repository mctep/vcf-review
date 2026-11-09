import type { CaseMetadata, InterpretationField } from '../types'

/**
 * Fields the AI interpretation step cannot start without:
 * evidence levels and tiers depend on the tumor type, and VAF interpretation
 * (clonality, possible germline origin) depends on tumor content.
 *
 * A field blocks interpretation when it is missing, or when it was pre-filled
 * automatically from an ambiguous source and still needs a person to confirm it.
 */
export const REQUIRED_FOR_INTERPRETATION: readonly InterpretationField[] = ['tumorType', 'tumorContent']
export type RequiredField = InterpretationField

export const REQUIRED_FIELD_LABELS: Record<RequiredField, string> = {
  tumorType: 'tumor type',
  tumorContent: 'tumor content',
}

export interface Blocker {
  field: RequiredField
  reason: 'missing' | 'unconfirmed'
}

export function isValidTumorContent(value: number | undefined): value is number {
  return value !== undefined && !Number.isNaN(value) && value > 0 && value <= 100
}

export function missingRequiredFields(meta: CaseMetadata): RequiredField[] {
  return REQUIRED_FOR_INTERPRETATION.filter((field) =>
    field === 'tumorType' ? !meta.tumorType : !isValidTumorContent(meta.tumorContent),
  )
}

export function unconfirmedFields(meta: CaseMetadata): RequiredField[] {
  const missing = missingRequiredFields(meta)
  return (meta.unconfirmed ?? []).filter((f) => !missing.includes(f))
}

export function interpretationBlockers(meta: CaseMetadata): Blocker[] {
  return [
    ...missingRequiredFields(meta).map((field) => ({ field, reason: 'missing' as const })),
    ...unconfirmedFields(meta).map((field) => ({ field, reason: 'unconfirmed' as const })),
  ]
}

export function canStartInterpretation(meta: CaseMetadata): boolean {
  return interpretationBlockers(meta).length === 0
}

const list = (fields: RequiredField[]) => fields.map((f) => REQUIRED_FIELD_LABELS[f]).join(' and ')

/**
 * "Waiting for tumor type and tumor content to start interpretation"
 * "Confirm tumor type to start interpretation"
 * "Waiting for tumor content and confirmation of tumor type to start interpretation"
 */
export function waitingMessage(blockers: Blocker[]): string {
  const missing = blockers.filter((b) => b.reason === 'missing').map((b) => b.field)
  const unconfirmed = blockers.filter((b) => b.reason === 'unconfirmed').map((b) => b.field)
  if (missing.length && unconfirmed.length)
    return `Waiting for ${list(missing)} and confirmation of ${list(unconfirmed)} to start interpretation`
  if (unconfirmed.length) return `Confirm ${list(unconfirmed)} to start interpretation`
  return `Waiting for ${list(missing)} to start interpretation`
}
