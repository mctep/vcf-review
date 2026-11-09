import type { DiagnosisCode, TumorType } from '../types'

/**
 * Maps a coded diagnosis (ICD-O-3 topography + morphology) to an OncoTree tumor type.
 *
 * - `exact`: the code pair identifies one OncoTree type; it can be used without confirmation.
 * - `ambiguous`: the code is a broad or NOS diagnosis; the suggested type must be confirmed.
 * - `none`: no rule matched; the user picks the type manually.
 */
export type MappingResult =
  | { confidence: 'exact'; code: string }
  | { confidence: 'ambiguous'; code: string; reason: string }
  | { confidence: 'none' }

interface Rule {
  /** Topography prefix, e.g. `C34` matches C34.0–C34.9. */
  site: string
  morphology: string
  result: MappingResult
}

/** Small illustrative rule set — a real deployment would use a maintained crosswalk. */
const RULES: Rule[] = [
  { site: 'C34', morphology: '8140/3', result: { confidence: 'exact', code: 'LUAD' } },
  { site: 'C34', morphology: '8070/3', result: { confidence: 'exact', code: 'LUSC' } },
  { site: 'C34', morphology: '8041/3', result: { confidence: 'exact', code: 'SCLC' } },
  {
    site: 'C34',
    morphology: '8046/3',
    result: {
      confidence: 'ambiguous',
      code: 'NSCLC',
      reason: 'Non-small cell carcinoma, NOS — histologic subtype not specified',
    },
  },
  { site: 'C44', morphology: '8720/3', result: { confidence: 'exact', code: 'SKCM' } },
  {
    site: 'C77',
    morphology: '8720/3',
    result: {
      confidence: 'ambiguous',
      code: 'SKCM',
      reason: 'Melanoma in a lymph node — primary site (skin, mucosa, uvea) not coded',
    },
  },
  { site: 'C18', morphology: '8140/3', result: { confidence: 'exact', code: 'COAD' } },
  { site: 'C20', morphology: '8140/3', result: { confidence: 'exact', code: 'READ' } },
  { site: 'C50', morphology: '8500/3', result: { confidence: 'exact', code: 'IDC' } },
  { site: 'C50', morphology: '8520/3', result: { confidence: 'exact', code: 'ILC' } },
]

export function mapDiagnosisToOncoTree(code: DiagnosisCode | undefined): MappingResult {
  if (!code) return { confidence: 'none' }
  const rule = RULES.find((r) => code.topography.startsWith(r.site) && code.morphology === r.morphology)
  return rule?.result ?? { confidence: 'none' }
}

export function resolveTumorType(
  code: DiagnosisCode | undefined,
  catalog: TumorType[],
): { tumorType?: TumorType; needsConfirmation: boolean; reason?: string } {
  const result = mapDiagnosisToOncoTree(code)
  if (result.confidence === 'none') return { needsConfirmation: false }
  const tumorType = catalog.find((t) => t.code === result.code)
  if (!tumorType) return { needsConfirmation: false }
  return {
    tumorType,
    needsConfirmation: result.confidence === 'ambiguous',
    reason: result.confidence === 'ambiguous' ? result.reason : undefined,
  }
}
