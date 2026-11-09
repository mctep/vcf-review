import type {
  Agreement,
  BiologicalFunction,
  DisplayStatus,
  Oncogenicity,
  ProcessingStepId,
  Tier,
  VariantFlag,
} from './types'

export const STATUS_LABEL: Record<DisplayStatus, string> = {
  processing: 'Processing',
  needsInput: 'Needs input',
  ready: 'Ready for review',
  signed: 'Signed',
  failed: 'Failed',
}

export const STEP_LABEL: Record<ProcessingStepId, string> = {
  uploading: 'Uploading',
  validating: 'Validating',
  annotation: 'Annotation',
  filtering: 'Filtering & ranking',
  interpretation: 'AI interpretation',
}

export const ONCOGENICITY_LABEL: Record<Oncogenicity, string> = {
  oncogenic: 'Oncogenic',
  'likely-oncogenic': 'Likely oncogenic',
  vus: 'VUS',
  'likely-benign': 'Likely benign',
  benign: 'Benign',
}

/** Theme palette name (see src/theme/semanticTokens.ts) for each call. */
export const ONCOGENICITY_PALETTE: Record<Oncogenicity, string> = {
  oncogenic: 'oncogenic',
  'likely-oncogenic': 'oncogenic',
  vus: 'vus',
  'likely-benign': 'benign',
  benign: 'benign',
}

export const TIER_PALETTE: Record<Tier, string> = {
  I: 'tier1',
  II: 'tier2',
  III: 'tier3',
  IV: 'tier4',
}

export const FUNCTION_LABEL: Record<BiologicalFunction, string> = {
  'gain-of-function': 'Gain of function',
  'loss-of-function': 'Loss of function',
  'switch-of-function': 'Switch of function',
  unknown: 'Unknown',
}

export const AGREEMENT_LABEL: Record<Agreement, string> = {
  high: 'High source agreement',
  medium: 'Medium source agreement',
  low: 'Med-low source agreement',
}

export const AGREEMENT_PALETTE: Record<Agreement, string> = {
  high: 'agreementHigh',
  medium: 'agreementMedium',
  low: 'agreementLow',
}

export const FLAG_LABEL: Record<VariantFlag, string> = {
  subclonal: 'Subclonal',
  'possible-germline': 'Possible germline',
  'sources-disagree': 'Sources disagree',
  'low-coverage': 'Low coverage',
}

export function tierRank(tier: Tier): number {
  return { I: 1, II: 2, III: 3, IV: 4 }[tier]
}
