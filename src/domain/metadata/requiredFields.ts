import type { CaseMetadata } from '../types'

/**
 * Fields the AI interpretation step cannot start without:
 * evidence levels and tiers depend on the tumor type, and VAF interpretation
 * (clonality, possible germline origin) depends on tumor content.
 */
export const REQUIRED_FOR_INTERPRETATION = ['tumorType', 'tumorContent'] as const
export type RequiredField = (typeof REQUIRED_FOR_INTERPRETATION)[number]

export const REQUIRED_FIELD_LABELS: Record<RequiredField, string> = {
  tumorType: 'tumor type',
  tumorContent: 'tumor content',
}

export function missingRequiredFields(meta: CaseMetadata): RequiredField[] {
  return REQUIRED_FOR_INTERPRETATION.filter((field) => {
    if (field === 'tumorType') return !meta.tumorType
    const value = meta.tumorContent
    return value === undefined || Number.isNaN(value) || value <= 0 || value > 100
  })
}

export function canStartInterpretation(meta: CaseMetadata): boolean {
  return missingRequiredFields(meta).length === 0
}

/** "Waiting for tumor type and tumor content" */
export function waitingMessage(missing: RequiredField[]): string {
  const labels = missing.map((f) => REQUIRED_FIELD_LABELS[f])
  return `Waiting for ${labels.join(' and ')} to start interpretation`
}
