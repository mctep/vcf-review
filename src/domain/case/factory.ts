import {
  PROCESSING_STEPS,
  type AuditEvent,
  type AuditKind,
  type Case,
  type CaseMetadata,
  type ProcessingState,
  type ProcessingStepId,
  type StepState,
  type VcfSource,
  type InputFormat,
} from '../types'
import { detectInputFormat } from '../upload/fileRules'

export const CURRENT_USER = 'Dr. A. Weber'

export function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`
}

export function stepsWith(states: Partial<Record<ProcessingStepId, StepState>> = {}) {
  return Object.fromEntries(PROCESSING_STEPS.map((s) => [s, states[s] ?? 'pending'])) as Record<
    ProcessingStepId,
    StepState
  >
}

export const isStepComplete = (state: StepState) => state === 'done' || state === 'skipped'

export function processingProgress(steps: Record<ProcessingStepId, StepState>): number {
  const done = PROCESSING_STEPS.filter((s) => isStepComplete(steps[s])).length
  const running = PROCESSING_STEPS.some((s) => steps[s] === 'running') ? 0.5 : 0
  return Math.round(((done + running) / PROCESSING_STEPS.length) * 100)
}

export function auditEvent(
  kind: AuditKind,
  message: string,
  actor = CURRENT_USER,
  at = new Date(),
): AuditEvent {
  return { id: newId(), at: at.toISOString(), actor, kind, message }
}

/** Sample id from a file name like `S26-1201_LUAD_tumor.vcf.gz` → `S26-1201`. */
export function sampleIdFromFileName(fileName: string): string {
  const match = fileName.match(/S\d{2}-\d{3,5}/i)
  if (match) return match[0].toUpperCase()
  return fileName.replace(/\.(vcf(\.gz)?|json|xml)$/i, '').slice(0, 24)
}

export function sourceFormat(source: VcfSource): InputFormat {
  return detectInputFormat(source.fileName) ?? 'vcf'
}

export function sourceFileName(source: VcfSource): string {
  return source.fileName
}

export function sourceLocation(source: VcfSource): string {
  return source.kind === 'local' ? `Local upload · ${source.fileName}` : source.fullPath
}

/** A brand-new case, created the moment a file is chosen. Processing starts right after. */
export function createCase(source: VcfSource, now = new Date()): Case {
  const sampleId = sampleIdFromFileName(source.fileName)
  // Header values are known up front (VCF header or export manifest).
  const from = sourceFormat(source) === 'vcf' ? 'vcf' : 'platform'
  const metadata: CaseMetadata = {
    sampleId,
    referenceGenome: 'GRCh38',
    variantCaller: 'Mutect2 4.6',
    assay: 'somatic',
    origin: { sampleId: from, referenceGenome: from, variantCaller: from, assay: 'user' },
  }
  const processing: ProcessingState = {
    steps: stepsWith(),
    progress: 0,
    startedAt: now.toISOString(),
  }
  return {
    id: newId(),
    createdAt: now.toISOString(),
    createdBy: CURRENT_USER,
    status: 'processing',
    source,
    metadata,
    processing,
    variants: [],
    selected: [],
    edits: {},
    report: { status: 'draft', version: '0.1', overrides: {} },
    audit: [
      auditEvent(
        'case.created',
        `Case created from ${source.kind === 'local' ? 'local file' : source.fullPath} (${source.fileName})`,
        CURRENT_USER,
        now,
      ),
    ],
    chat: [],
  }
}
