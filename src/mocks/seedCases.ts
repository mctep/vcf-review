import { auditEvent, stepsWith } from '../domain/case/factory'
import type { Case } from '../domain/types'
import { ONCOTREE } from './oncotree'
import { VARIANT_SETS } from './variants'

const tumor = (code: string) => ONCOTREE.find((t) => t.code === code)!
const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000)
const iso = (m: number) => minutesAgo(m).toISOString()
const allDone = stepsWith({
  uploading: 'done',
  validating: 'done',
  annotation: 'done',
  filtering: 'done',
  interpretation: 'done',
})
const reportableIds = (set: keyof typeof VARIANT_SETS) => VARIANT_SETS[set].variants.map((v) => v.id)

/** Synthetic worklist shown on first load. */
export function seedCases(): Case[] {
  const nsclc: Case = {
    id: '4f2a9c1e-7b3d-4e8a-9c61-2d5f0b8e3a17',
    createdAt: iso(95),
    createdBy: 'Dr. A. Weber',
    status: 'ready',
    source: {
      kind: 'remote',
      connectionId: 'nfs-runs',
      connectionType: 'nfs',
      fileName: 'S26-1187_LUAD_tumor.vcf.gz',
      fullPath: '/mnt/ngs-runs/2026-11/RUN-2611-A/S26-1187_LUAD_tumor.vcf.gz',
      sizeBytes: 39_845_120,
    },
    metadata: {
      sampleId: 'S26-1187',
      referenceGenome: 'GRCh38',
      variantCaller: 'Mutect2 4.6',
      assay: 'somatic',
      panel: 'Solid Tumor 52-gene panel v3',
      tumorType: tumor('LUAD'),
      tumorContent: 60,
      patientId: 'PSN-7Q4K-2291',
      sex: 'female',
      birthYear: 1961,
      orderingPhysician: 'Dr. J. Okafor, Thoracic Oncology',
      specimenType: 'FFPE, core needle biopsy (lung)',
      collectionDate: '2026-10-29',
      diagnosis: 'Adenocarcinoma of the right upper lobe, stage IVA',
      clinicalNotes: 'Never smoker. Treatment-naive. Question from oncologist: first-line targeted options?',
      origin: {
        sampleId: 'vcf',
        referenceGenome: 'vcf',
        variantCaller: 'vcf',
        assay: 'user',
        panel: 'lims',
        patientId: 'lims',
        sex: 'lims',
        birthYear: 'lims',
        orderingPhysician: 'lims',
        specimenType: 'lims',
        collectionDate: 'lims',
        diagnosis: 'lims',
        tumorType: 'user',
        tumorContent: 'user',
        clinicalNotes: 'user',
      },
    },
    processing: { steps: allDone, progress: 100, startedAt: iso(95), finishedAt: iso(88) },
    funnel: VARIANT_SETS.nsclc.funnel,
    variants: VARIANT_SETS.nsclc.variants,
    selected: reportableIds('nsclc'),
    edits: {},
    report: { status: 'draft', version: '0.1', overrides: {} },
    lims: { status: 'found', at: iso(94) },
    audit: [
      auditEvent(
        'case.created',
        'Case created from /mnt/ngs-runs/2026-11/RUN-2611-A/S26-1187_LUAD_tumor.vcf.gz',
        'Dr. A. Weber',
        minutesAgo(95),
      ),
      auditEvent('metadata.updated', 'Order fetched from LIMS for S26-1187', 'Dr. A. Weber', minutesAgo(94)),
      auditEvent(
        'metadata.updated',
        'Tumor type set to Lung Adenocarcinoma (LUAD)',
        'Dr. A. Weber',
        minutesAgo(93),
      ),
      auditEvent('metadata.updated', 'Tumor content set to 60%', 'Dr. A. Weber', minutesAgo(93)),
      auditEvent(
        'processing.step',
        'Annotation, filtering & ranking completed: 1,284 → 6 reportable variants',
        'System',
        minutesAgo(90),
      ),
      auditEvent('processing.step', 'AI interpretation drafted for 6 variants', 'System', minutesAgo(88)),
    ],
    chat: [],
  }

  const melanoma: Case = {
    id: 'b81e0d44-2c9a-4f17-8e3b-6a0c5d9f1e22',
    createdAt: iso(60 * 26),
    createdBy: 'Dr. L. Moreau',
    status: 'signed',
    source: { kind: 'local', fileName: 'S26-1179_mel_tumor.vcf.gz', sizeBytes: 30_408_704 },
    metadata: {
      sampleId: 'S26-1179',
      referenceGenome: 'GRCh38',
      variantCaller: 'Mutect2 4.6',
      assay: 'somatic',
      panel: 'Solid Tumor 52-gene panel v3',
      tumorType: tumor('SKCM'),
      tumorContent: 70,
      orderingPhysician: 'Dr. M. Lindqvist, Dermato-Oncology',
      specimenType: 'FFPE, lymph node excision',
      origin: {},
    },
    processing: { steps: allDone, progress: 100, startedAt: iso(60 * 26), finishedAt: iso(60 * 26 - 9) },
    funnel: VARIANT_SETS.melanoma.funnel,
    variants: VARIANT_SETS.melanoma.variants,
    selected: reportableIds('melanoma'),
    edits: {},
    report: {
      status: 'signed',
      version: '1.0',
      overrides: {},
      signedBy: 'Dr. L. Moreau',
      signedAt: minutesAgo(60 * 24).toISOString(),
    },
    audit: [
      auditEvent(
        'case.created',
        'Case created from local file (S26-1179_mel_tumor.vcf.gz)',
        'Dr. L. Moreau',
        minutesAgo(60 * 26),
      ),
      auditEvent('report.signed', 'Report v1.0 signed and released', 'Dr. L. Moreau', minutesAgo(60 * 24)),
    ],
    chat: [],
  }

  const colorectal: Case = {
    id: 'e5c7a210-91fd-4b6e-a3d8-0f4b2c6e9d55',
    createdAt: iso(2),
    createdBy: 'Dr. A. Weber',
    status: 'processing',
    source: {
      kind: 'remote',
      connectionId: 's3-lab',
      connectionType: 's3',
      fileName: 'S26-1195_colorectal.vcf.gz',
      fullPath: 's3://lab-ngs/runs/2026-11-07/S26-1195_colorectal.vcf.gz',
      sizeBytes: 37_748_736,
    },
    metadata: {
      sampleId: 'S26-1195',
      referenceGenome: 'GRCh38',
      variantCaller: 'Mutect2 4.6',
      assay: 'somatic',
      panel: 'Solid Tumor 52-gene panel v3',
      tumorType: tumor('COAD'),
      tumorContent: 40,
      origin: { sampleId: 'vcf', referenceGenome: 'vcf', tumorType: 'user', tumorContent: 'user' },
    },
    processing: {
      steps: stepsWith({ uploading: 'done', validating: 'done', annotation: 'running' }),
      progress: 50,
      startedAt: iso(2),
    },
    variants: [],
    selected: [],
    edits: {},
    report: { status: 'draft', version: '0.1', overrides: {} },
    audit: [
      auditEvent(
        'case.created',
        'Case created from s3://lab-ngs/runs/2026-11-07/S26-1195_colorectal.vcf.gz',
        'Dr. A. Weber',
        minutesAgo(2),
      ),
    ],
    chat: [],
  }

  const failed: Case = {
    id: '7d3b5f90-4e21-4c8b-b6a7-1e9f3d0c2b44',
    createdAt: iso(60 * 3),
    createdBy: 'Dr. A. Weber',
    status: 'failed',
    source: { kind: 'local', fileName: 'S26-1188_tumor_old_caller.vcf', sizeBytes: 141_557_760 },
    metadata: {
      sampleId: 'S26-1188',
      referenceGenome: 'GRCh37',
      assay: 'somatic',
      origin: { sampleId: 'vcf', referenceGenome: 'vcf' },
    },
    processing: {
      steps: stepsWith({ uploading: 'done', validating: 'failed' }),
      progress: 20,
      startedAt: iso(60 * 3),
      pausedAt: iso(60 * 3 - 1),
      error: {
        step: 'validating',
        message: 'FORMAT/AD is missing for 1,204 records — allele depths are required to compute VAF.',
      },
    },
    variants: [],
    selected: [],
    edits: {},
    report: { status: 'draft', version: '0.1', overrides: {} },
    audit: [
      auditEvent(
        'case.created',
        'Case created from local file (S26-1188_tumor_old_caller.vcf)',
        'Dr. A. Weber',
        minutesAgo(180),
      ),
      auditEvent(
        'processing.failed',
        'Validation failed: FORMAT/AD is missing for 1,204 records',
        'System',
        minutesAgo(179),
      ),
    ],
    chat: [],
  }

  const breast: Case = {
    id: 'c2a64e8b-5d10-47f3-9b2e-8c1d7a3f6e09',
    createdAt: iso(60 * 24 * 6),
    createdBy: 'Dr. L. Moreau',
    status: 'signed',
    source: { kind: 'local', fileName: 'S26-1133_breast_tumor.vcf.gz', sizeBytes: 28_311_552 },
    metadata: {
      sampleId: 'S26-1133',
      referenceGenome: 'GRCh38',
      assay: 'somatic',
      panel: 'Solid Tumor 52-gene panel v3',
      tumorType: tumor('IDC'),
      tumorContent: 55,
      origin: {},
    },
    processing: {
      steps: allDone,
      progress: 100,
      startedAt: iso(60 * 24 * 6),
      finishedAt: iso(60 * 24 * 6 - 8),
    },
    funnel: VARIANT_SETS.breast.funnel,
    variants: VARIANT_SETS.breast.variants,
    selected: reportableIds('breast'),
    edits: {},
    report: {
      status: 'signed',
      version: '1.0',
      overrides: {},
      signedBy: 'Dr. L. Moreau',
      signedAt: minutesAgo(60 * 24 * 5).toISOString(),
    },
    audit: [
      auditEvent(
        'report.signed',
        'Report v1.0 signed and released',
        'Dr. L. Moreau',
        minutesAgo(60 * 24 * 5),
      ),
    ],
    chat: [],
  }

  return [colorectal, nsclc, failed, melanoma, breast].map((c) =>
    c.processing.steps.interpretation === 'done'
      ? {
          ...c,
          interpretationContext: { tumorType: c.metadata.tumorType, tumorContent: c.metadata.tumorContent },
        }
      : c,
  )
}
