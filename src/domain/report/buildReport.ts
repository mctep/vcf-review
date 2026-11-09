import { ONCOGENICITY_LABEL, tierRank } from '../labels'
import type { Case, ReportSectionId, RichText, Variant } from '../types'

export interface ReportRow {
  id: string
  gene: string
  notation: string
  hgvsc?: string
  vaf?: number
  copyNumber?: number
  classification: string
  tierLevel: string
  therapies: string
}

export interface ReportField {
  label: string
  /** `undefined` when not recorded — rendered as an em dash. */
  value?: string
}

/** A block of the report header: who the patient is, which specimen, clinical context, which test. */
export interface ReportHeaderBlock {
  title: 'Patient' | 'Specimen' | 'Clinical' | 'Test'
  fields: ReportField[]
}

export interface ReportModel {
  caseId: string
  sampleId: string
  tumorType: string
  header: ReportHeaderBlock[]
  significant: ReportRow[]
  uncertain: ReportRow[]
  sections: Record<ReportSectionId, string>
  version: string
  status: 'draft' | 'signed'
  signedBy?: string
  signedAt?: string
}

const fmtNotation = (v: Variant) =>
  v.kind === 'fusion' ? `${v.gene}${v.notation}` : `${v.gene} ${v.notation}`

function toRow(v: Variant): ReportRow {
  return {
    id: v.id,
    gene: v.gene,
    notation: v.notation,
    hgvsc: v.hgvsc,
    vaf: v.vaf,
    copyNumber: v.copyNumber,
    classification: ONCOGENICITY_LABEL[v.oncogenicity],
    tierLevel: v.tier === 'III' || v.tier === 'IV' ? `Tier ${v.tier}` : `Tier ${v.tierLevel}`,
    therapies:
      v.therapies
        .filter((t) => t.effect === 'sensitive')
        .map((t) => t.drug)
        .join(', ') || '—',
  }
}

export function richTextToPlain(text: RichText): string {
  return text.map((part) => (typeof part === 'string' ? part : part.cite.label)).join('')
}

const joinList = (items: string[]) =>
  items.length <= 1 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`

/** Deterministic draft of the clinical summary built from the selected variants. */
export function draftSummary(variants: Variant[], tumorType: string): string {
  if (variants.length === 0) return 'No reportable variants were selected for this report.'
  const sentences: string[] = []
  const tier1 = variants.filter((v) => v.tier === 'I')
  const tier2 = variants.filter((v) => v.tier === 'II')
  const vus = variants.filter((v) => v.tier === 'III')

  for (const v of tier1) {
    const drugs = v.therapies.filter((t) => t.effect === 'sensitive').map((t) => t.drug)
    sentences.push(
      `Molecular profiling of this ${tumorType.toLowerCase()} identified ${fmtNotation(v)} (Tier ${v.tierLevel})` +
        (drugs.length ? `, which predicts sensitivity to ${joinList(drugs)}.` : '.'),
    )
  }
  if (tier2.length) {
    sentences.push(
      `Additional alterations of potential clinical significance: ${joinList(tier2.map(fmtNotation))}.`,
    )
  }
  const germline = variants.filter((v) => v.flags.includes('possible-germline'))
  if (germline.length) {
    sentences.push(
      `The allele fraction of ${joinList(germline.map(fmtNotation))} is consistent with a possible germline origin.`,
    )
  }
  if (vus.length) {
    sentences.push(
      `${vus.length} variant${vus.length > 1 ? 's' : ''} of uncertain significance ${vus.length > 1 ? 'are' : 'is'} listed for completeness and should not guide treatment.`,
    )
  }
  return sentences.join(' ')
}

export function draftRecommendations(variants: Variant[]): string {
  const lines: string[] = []
  const tier1 = variants.filter((v) => v.tier === 'I' && v.therapies.length)
  if (tier1.length) {
    lines.push(
      `Consider targeted therapy according to current guidelines (${tier1.map(fmtNotation).join('; ')}).`,
    )
  }
  if (variants.some((v) => v.flags.includes('possible-germline'))) {
    lines.push('Germline confirmation testing and referral for genetic counselling are recommended.')
  }
  if (variants.some((v) => v.flags.includes('subclonal'))) {
    lines.push('Subclonal alterations may be relevant for resistance monitoring at progression.')
  }
  if (lines.length === 0)
    lines.push('No specific therapeutic recommendations based on the selected variants.')
  return lines.map((l) => `• ${l}`).join('\n')
}

export const DEFAULT_METHODS =
  'Somatic variants were called from tumor DNA, annotated and ranked by the laboratory pipeline, and interpreted ' +
  'against curated clinical, population and functional sources. Classification follows the AMP/ASCO/CAP tiers ' +
  'and the ClinGen/CGC/VICC oncogenicity framework. Variants below 5% allele fraction or 100x coverage are not ' +
  'reported. This report is a prototype output based on synthetic data and must not be used for clinical decisions.'

const SEX_LABEL = { female: 'Female', male: 'Male', unknown: 'Unknown' } as const

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** `2026-10-29` → `29 Oct 2026`, independent of the viewer's time zone. */
const fmtDate = (iso?: string) => {
  const m = iso?.match(/^(\d{4})-(\d{2})-(\d{2})/)
  return m ? `${m[3]} ${MONTHS[Number(m[2]) - 1]} ${m[1]}` : iso
}

/** Header blocks in the order clinical NGS reports usually list them. */
export function reportHeader(c: Case): ReportHeaderBlock[] {
  const m = c.metadata
  return [
    {
      title: 'Patient',
      fields: [
        { label: 'Patient ID', value: m.patientId },
        { label: 'Sex', value: m.sex && SEX_LABEL[m.sex] },
        { label: 'Year of birth', value: m.birthYear?.toString() },
      ],
    },
    {
      title: 'Specimen',
      fields: [
        { label: 'Sample ID', value: m.sampleId },
        { label: 'Specimen', value: m.specimenType },
        { label: 'Collected', value: fmtDate(m.collectionDate) },
        { label: 'Tumor content', value: m.tumorContent !== undefined ? `${m.tumorContent}%` : undefined },
      ],
    },
    {
      title: 'Clinical',
      fields: [
        { label: 'Diagnosis', value: m.diagnosis },
        { label: 'Tumor type', value: m.tumorType && `${m.tumorType.name} (${m.tumorType.code})` },
        { label: 'Requested by', value: m.orderingPhysician },
      ],
    },
    {
      title: 'Test',
      fields: [
        { label: 'Panel', value: m.panel },
        { label: 'Assay', value: m.assay === 'somatic' ? 'Somatic (tumor only)' : 'Germline' },
        { label: 'Reference', value: m.referenceGenome },
      ],
    },
  ]
}

/** Why the report cannot be signed yet, or `undefined`. Interpretation state is checked separately. */
export function signOffBlockReason(c: Case): string | undefined {
  if (!c.metadata.patientId)
    return 'Enter the patient ID on the Details tab — a report must identify the patient'
  if (c.selected.length === 0) return 'Select at least one variant to include'
  return undefined
}

export function buildReport(c: Case): ReportModel {
  const selected = c.variants
    .filter((v) => c.selected.includes(v.id))
    .sort((a, b) => tierRank(a.tier) - tierRank(b.tier))
  const tumorType = c.metadata.tumorType?.name ?? 'tumor'

  const sections: Record<ReportSectionId, string> = {
    summary: c.report.overrides.summary ?? draftSummary(selected, tumorType),
    recommendations: c.report.overrides.recommendations ?? draftRecommendations(selected),
    methods: c.report.overrides.methods ?? DEFAULT_METHODS,
  }

  return {
    caseId: c.id,
    sampleId: c.metadata.sampleId,
    tumorType,
    header: reportHeader(c),
    significant: selected.filter((v) => v.tier === 'I' || v.tier === 'II').map(toRow),
    uncertain: selected.filter((v) => v.tier === 'III').map(toRow),
    sections,
    version: c.report.version,
    status: c.report.status,
    signedBy: c.report.signedBy,
    signedAt: c.report.signedAt,
  }
}

const rowText = (r: ReportRow) =>
  `- ${r.gene} ${r.notation}${r.hgvsc ? ` (${r.hgvsc})` : ''}` +
  `${r.vaf !== undefined ? `, VAF ${r.vaf}%` : ''}${r.copyNumber !== undefined ? `, CN ${r.copyNumber}` : ''}` +
  ` — ${r.classification}, ${r.tierLevel}; therapies: ${r.therapies}`

/** Plain-text export used by "Copy output". */
export function reportToPlainText(r: ReportModel): string {
  return [
    `MOLECULAR PATHOLOGY REPORT — ${r.status === 'signed' ? `v${r.version} (signed)` : 'DRAFT'}`,
    `Case: ${r.caseId}`,
    '',
    ...r.header.flatMap((b) => [
      b.title.toUpperCase(),
      ...b.fields.map((f) => `${f.label}: ${f.value ?? '—'}`),
      '',
    ]),
    'SUMMARY',
    r.sections.summary,
    '',
    'CLINICALLY SIGNIFICANT VARIANTS',
    ...(r.significant.length ? r.significant.map(rowText) : ['- None']),
    '',
    'VARIANTS OF UNCERTAIN SIGNIFICANCE',
    ...(r.uncertain.length ? r.uncertain.map(rowText) : ['- None']),
    '',
    'RECOMMENDATIONS',
    r.sections.recommendations,
    '',
    'METHODS AND LIMITATIONS',
    r.sections.methods,
    ...(r.signedBy ? ['', `Signed by ${r.signedBy} on ${r.signedAt}`] : []),
  ].join('\n')
}
