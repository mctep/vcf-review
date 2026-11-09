import type { CaseMetadata } from '../domain/types'
import { ONCOTREE } from './oncotree'

/** Case context carried by a platform export. Missing values were not recorded on the platform. */
export type PlatformCaseContext = Partial<
  Pick<
    CaseMetadata,
    'tumorType' | 'tumorContent' | 'diagnosis' | 'specimenType' | 'collectionDate' | 'panel' | 'clinicalNotes'
  >
>

export interface PlatformExportInfo {
  /** Generic platform label — never a vendor name. */
  platform: string
  exportedAt: string
  context: PlatformCaseContext
}

const tumor = (code: string) => ONCOTREE.find((t) => t.code === code)
const PANEL = 'Solid Tumor 52-gene panel v3'

/**
 * Synthetic case exports from a tertiary analysis platform, keyed by sample id.
 * Variants come from the same synthetic sets as VCF inputs (`variantSetForFile`).
 *
 * Demo coverage:
 * - S26-1220 (sample export): full context → interpretation starts right after import, no LIMS needed
 * - S26-1221: tumor content not recorded on the platform → waits for it
 * - S26-1222: full context
 * - unknown sample ids: variants only, context must be entered manually
 */
export const PLATFORM_EXPORTS: Record<string, PlatformExportInfo> = {
  'S26-1220': {
    platform: 'Tertiary analysis platform 5.4',
    exportedAt: '2026-11-09T08:14:00Z',
    context: {
      tumorType: tumor('LUAD'),
      tumorContent: 50,
      diagnosis: 'Lung adenocarcinoma, stage IVB',
      specimenType: 'FFPE, core needle biopsy (lung)',
      collectionDate: '2026-11-02',
      panel: PANEL,
    },
  },
  'S26-1221': {
    platform: 'Tertiary analysis platform 5.4',
    exportedAt: '2026-11-09T08:20:00Z',
    context: {
      tumorType: tumor('SKCM'),
      diagnosis: 'Cutaneous melanoma, metastatic',
      panel: PANEL,
    },
  },
  'S26-1222': {
    platform: 'Tertiary analysis platform 5.4',
    exportedAt: '2026-11-08T16:02:00Z',
    context: {
      tumorType: tumor('COAD'),
      tumorContent: 40,
      diagnosis: 'Adenocarcinoma of the ascending colon',
      specimenType: 'FFPE, resection (colon)',
      panel: PANEL,
    },
  },
}

export function platformExportFor(sampleId: string): PlatformExportInfo {
  return (
    PLATFORM_EXPORTS[sampleId] ?? {
      platform: 'Tertiary analysis platform',
      exportedAt: new Date().toISOString(),
      context: {},
    }
  )
}
