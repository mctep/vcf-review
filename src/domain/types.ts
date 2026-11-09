/** Core domain model. Pure types — no React, no Chakra. */

export type CaseStatus = 'processing' | 'ready' | 'review' | 'signed' | 'failed'

// ── Source file ──────────────────────────────────────────────────────

export type ConnectionType = 'nfs' | 's3'

/**
 * What the chosen file is:
 * - `vcf` — raw variant calls; annotation, filtering and ranking run here (by the annotation provider);
 * - `platform-export` — a case exported from a tertiary analysis platform: variants are already annotated and
 *   ranked, and the case context (tumor type, tumor content, diagnosis) usually comes with it.
 */
export type InputFormat = 'vcf' | 'platform-export'

export type VcfSource =
  | { kind: 'local'; fileName: string; sizeBytes: number }
  | {
      kind: 'remote'
      connectionId: string
      connectionType: ConnectionType
      fileName: string
      /** Fully qualified location, e.g. `s3://lab-ngs/runs/S1.vcf.gz` or `/mnt/ngs-runs/S1.vcf.gz`. */
      fullPath: string
      sizeBytes: number
    }

// ── Background processing ────────────────────────────────────────────

export const PROCESSING_STEPS = [
  'uploading',
  'validating',
  'annotation',
  'filtering',
  'interpretation',
] as const
export type ProcessingStepId = (typeof PROCESSING_STEPS)[number]

/** `skipped` — not needed for this input (annotation and ranking of a platform export were done upstream). */
export type StepState = 'pending' | 'running' | 'done' | 'skipped' | 'waiting' | 'failed'

export interface ProcessingState {
  steps: Record<ProcessingStepId, StepState>
  /** 0–100 */
  progress: number
  startedAt: string
  finishedAt?: string
  error?: { step: ProcessingStepId; message: string }
}

// ── Metadata ─────────────────────────────────────────────────────────

export interface TumorType {
  /** OncoTree code, e.g. `LUAD`. */
  code: string
  name: string
  tissue: string
}

/** `vcf` — VCF header; `platform` — analysis platform export; `lims` — test order; `user` — typed by a person. */
export type MetadataOrigin = 'vcf' | 'platform' | 'lims' | 'user'

/** Fields the AI interpretation depends on. */
export type InterpretationField = 'tumorType' | 'tumorContent'

/** Coded diagnosis as it arrives with the test order (ICD-O-3 topography + morphology). */
export interface DiagnosisCode {
  system: 'ICD-O-3'
  /** Topography, e.g. `C34.1` (upper lobe, lung). */
  topography: string
  /** Morphology, e.g. `8140/3` (adenocarcinoma, NOS). */
  morphology: string
  label: string
}

export interface CaseMetadata {
  sampleId: string
  referenceGenome: 'GRCh37' | 'GRCh38'
  variantCaller?: string
  assay: 'somatic' | 'germline'
  panel?: string
  tumorType?: TumorType
  /** Tumor cell content estimated by the pathologist, 0–100. */
  tumorContent?: number
  patientId?: string
  sex?: 'female' | 'male' | 'unknown'
  birthYear?: number
  orderingPhysician?: string
  specimenType?: string
  collectionDate?: string
  diagnosis?: string
  diagnosisCode?: DiagnosisCode
  clinicalNotes?: string
  /** Values that were pre-filled automatically but must be confirmed by a person before interpretation. */
  unconfirmed?: InterpretationField[]
  /** Where each field value came from. */
  origin: Partial<Record<keyof Omit<CaseMetadata, 'origin'>, MetadataOrigin>>
}

// ── Variants and evidence ────────────────────────────────────────────

export type VariantKind = 'snv' | 'indel' | 'cnv' | 'fusion'
export type Oncogenicity = 'oncogenic' | 'likely-oncogenic' | 'vus' | 'likely-benign' | 'benign'
export type Tier = 'I' | 'II' | 'III' | 'IV'
export type TierLevel = 'IA' | 'IB' | 'IIC' | 'IID' | 'III' | 'IV'
export type BiologicalFunction = 'gain-of-function' | 'loss-of-function' | 'switch-of-function' | 'unknown'
export type Agreement = 'high' | 'medium' | 'low'
export type VariantFlag = 'subclonal' | 'possible-germline' | 'sources-disagree' | 'low-coverage'

export interface Citation {
  /** Visible label, e.g. `OncoKB: EGFR L858R`. */
  label: string
  url: string
  source: string
  accessed: string
  version?: string
}

/** Rich text = plain strings interleaved with inline citations. */
export type RichText = Array<string | { cite: Citation }>

export interface Criterion {
  /** ClinGen/CGC/VICC code, e.g. `OS2`, `OP3`, `SBP1`. */
  code: string
  direction: 'oncogenic' | 'benign'
  strength: 'very strong' | 'strong' | 'moderate' | 'supporting'
  points: number
  rationale: string
}

export interface EvidenceItem {
  source: string
  finding: string
  signal: 'supports' | 'neutral' | 'conflicts'
}

export interface Therapy {
  drug: string
  effect: 'sensitive' | 'resistant'
  level: string
  context: string
}

export interface Variant {
  id: string
  gene: string
  /** Display notation: `p.L858R`, `deletion cn=0`, `::ALK`. */
  notation: string
  kind: VariantKind
  transcript?: string
  hgvsc?: string
  hgvsg?: string
  consequence: string
  vaf?: number
  altReads?: number
  depth?: number
  copyNumber?: number
  oncogenicity: Oncogenicity
  tier: Tier
  tierLevel: TierLevel
  biologicalFunction: BiologicalFunction
  agreement: Agreement
  flags: VariantFlag[]
  criteria: Criterion[]
  evidence: EvidenceItem[]
  therapies: Therapy[]
  geneDescription: RichText
  variantDescription: RichText
  reasoning: string[]
}

export interface Funnel {
  total: number
  passQc: number
  rare: number
  coding: number
  reportable: number
}

// ── Review, report, audit ────────────────────────────────────────────

export type AuditKind =
  | 'case.created'
  | 'processing.step'
  | 'processing.failed'
  | 'processing.retry'
  | 'metadata.updated'
  | 'variant.selection'
  | 'variant.edited'
  | 'variant.feedback'
  | 'report.edited'
  | 'report.signed'

export interface AuditEvent {
  id: string
  at: string
  actor: string
  kind: AuditKind
  message: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  at: string
}

export interface ReportState {
  status: 'draft' | 'signed'
  version: string
  /** Report section overrides produced by the assistant or the user. */
  overrides: Partial<Record<ReportSectionId, string>>
  highlighted?: ReportSectionId
  signedBy?: string
  signedAt?: string
}

export type ReportSectionId = 'summary' | 'recommendations' | 'methods'

/** Interpretation inputs an AI draft was produced for (or explicitly kept for). */
export interface InterpretationContext {
  tumorType?: TumorType
  tumorContent?: number
}

export interface Case {
  id: string
  createdAt: string
  createdBy: string
  status: CaseStatus
  source: VcfSource
  metadata: CaseMetadata
  processing: ProcessingState
  funnel?: Funnel
  variants: Variant[]
  /** Variant ids included in the report. */
  selected: string[]
  /** User-edited descriptions keyed by `${variantId}:${field}`. */
  edits: Record<string, string>
  report: ReportState
  /**
   * Inputs the current AI draft is valid for. When the metadata no longer matches, the draft is stale and a
   * reviewer decides whether to re-run it (see `staleInputs`).
   */
  interpretationContext?: InterpretationContext
  audit: AuditEvent[]
  chat: ChatMessage[]
}
