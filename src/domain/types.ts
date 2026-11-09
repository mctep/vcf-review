/** Core domain model. Pure types — no React, no Chakra. */

export type CaseStatus = 'processing' | 'ready' | 'review' | 'signed' | 'failed'

// ── Source file ──────────────────────────────────────────────────────

export type ConnectionType = 'nfs' | 's3'

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

export type StepState = 'pending' | 'running' | 'done' | 'waiting' | 'failed'

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

export type MetadataOrigin = 'vcf' | 'lims' | 'user'

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
  clinicalNotes?: string
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
  audit: AuditEvent[]
  chat: ChatMessage[]
}
