import type { CaseMetadata, InterpretationField } from '../types'

/**
 * Fields the AI interpretation step cannot start without:
 * evidence levels and tiers depend on the tumor type, and VAF interpretation
 * (clonality, possible germline origin) depends on tumor content.
 */
export const REQUIRED_FOR_INTERPRETATION: readonly InterpretationField[] = ['tumorType', 'tumorContent']
export type RequiredField = InterpretationField

export const REQUIRED_FIELD_LABELS: Record<RequiredField, string> = {
  tumorType: 'tumor type',
  tumorContent: 'tumor content',
}

export function isValidTumorContent(value: number | undefined): value is number {
  return value !== undefined && !Number.isNaN(value) && value > 0 && value <= 100
}

export function missingRequiredFields(meta: CaseMetadata): RequiredField[] {
  return REQUIRED_FOR_INTERPRETATION.filter((field) =>
    field === 'tumorType' ? !meta.tumorType : !isValidTumorContent(meta.tumorContent),
  )
}

export function canStartInterpretation(meta: CaseMetadata): boolean {
  return missingRequiredFields(meta).length === 0
}

const list = (fields: RequiredField[]) => fields.map((f) => REQUIRED_FIELD_LABELS[f]).join(' and ')

/** "Waiting for tumor type and tumor content to start interpretation" */
export function waitingMessage(missing: RequiredField[]): string {
  return `Waiting for ${list(missing)} to start interpretation`
}
