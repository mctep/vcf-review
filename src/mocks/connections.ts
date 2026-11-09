import type { ConnectionType } from '../domain/types'

export interface StorageConnection {
  id: string
  type: ConnectionType
  name: string
  /** NFS mount point or S3 bucket URI. */
  root: string
  region?: string
  status: 'connected' | 'error'
  /** Shown in the UI so it is clear credentials are not handled here. */
  access: string
}

export interface FsEntry {
  name: string
  type: 'folder' | 'file'
  sizeBytes?: number
  modified: string
  /** Simulates a folder the service account cannot read. */
  restricted?: boolean
}

export const CONNECTIONS: StorageConnection[] = [
  {
    id: 'nfs-runs',
    type: 'nfs',
    name: 'Sequencing runs',
    root: '/mnt/ngs-runs',
    status: 'connected',
    access: 'Read-only mount',
  },
  {
    id: 's3-lab',
    type: 's3',
    name: 'Lab NGS bucket',
    root: 's3://lab-ngs',
    region: 'eu-central-1',
    status: 'connected',
    access: 'IAM role · read-only',
  },
]

const MB = 1024 ** 2
const GB = 1024 ** 3

/** Directory listings keyed by `${connectionId}:${relativePath}` ('' = root). */
export const FILE_TREE: Record<string, FsEntry[]> = {
  'nfs-runs:': [
    { name: '2026-11', type: 'folder', modified: '2026-11-08T17:12:00Z' },
    { name: '2026-10', type: 'folder', modified: '2026-10-31T09:40:00Z' },
    { name: 'archive', type: 'folder', modified: '2026-01-04T08:00:00Z', restricted: true },
    { name: 'README.txt', type: 'file', sizeBytes: 2_310, modified: '2025-06-02T10:00:00Z' },
  ],
  'nfs-runs:2026-11': [
    { name: 'RUN-2611-A', type: 'folder', modified: '2026-11-08T17:12:00Z' },
    { name: 'RUN-2604-B', type: 'folder', modified: '2026-11-04T12:01:00Z' },
  ],
  'nfs-runs:2026-11/RUN-2611-A': [
    {
      name: 'S26-1201_LUAD_tumor.vcf.gz',
      type: 'file',
      sizeBytes: 38 * MB,
      modified: '2026-11-08T17:10:00Z',
    },
    { name: 'S26-1201_LUAD_tumor.bam', type: 'file', sizeBytes: 9.4 * GB, modified: '2026-11-08T16:55:00Z' },
    { name: 'S26-1202_mel_tumor.vcf.gz', type: 'file', sizeBytes: 31 * MB, modified: '2026-11-08T17:11:00Z' },
    { name: 'S26-1203_crc_tumor.vcf', type: 'file', sizeBytes: 182 * MB, modified: '2026-11-08T17:12:00Z' },
    { name: 'SampleSheet.csv', type: 'file', sizeBytes: 4_812, modified: '2026-11-08T08:02:00Z' },
    { name: 'qc_summary.pdf', type: 'file', sizeBytes: 1.2 * MB, modified: '2026-11-08T17:20:00Z' },
  ],
  'nfs-runs:2026-11/RUN-2604-B': [],
  'nfs-runs:2026-10': [{ name: 'RUN-2528-C', type: 'folder', modified: '2026-10-31T09:40:00Z' }],
  'nfs-runs:2026-10/RUN-2528-C': [
    {
      name: 'S26-1133_breast_tumor.vcf.gz',
      type: 'file',
      sizeBytes: 27 * MB,
      modified: '2026-10-31T09:31:00Z',
    },
    { name: 'S26-1133_R1.fastq.gz', type: 'file', sizeBytes: 6.1 * GB, modified: '2026-10-30T22:10:00Z' },
  ],
  's3-lab:': [
    { name: 'platform-exports', type: 'folder', modified: '2026-11-09T08:20:00Z' },
    { name: 'runs', type: 'folder', modified: '2026-11-09T07:30:00Z' },
    { name: 'reference', type: 'folder', modified: '2026-03-12T11:00:00Z' },
    { name: 'restricted-phi', type: 'folder', modified: '2026-09-01T11:00:00Z', restricted: true },
  ],
  's3-lab:runs': [
    { name: '2026-11-09', type: 'folder', modified: '2026-11-09T07:30:00Z' },
    { name: '2026-11-07', type: 'folder', modified: '2026-11-07T18:44:00Z' },
  ],
  's3-lab:runs/2026-11-09': [
    { name: 'S26-1210_NSCLC.vcf.gz', type: 'file', sizeBytes: 41 * MB, modified: '2026-11-09T07:28:00Z' },
    { name: 'S26-1211_melanoma.vcf.gz', type: 'file', sizeBytes: 29 * MB, modified: '2026-11-09T07:29:00Z' },
    { name: 'S26-1210_NSCLC.cram', type: 'file', sizeBytes: 5.8 * GB, modified: '2026-11-09T07:10:00Z' },
    { name: 'manifest.yaml', type: 'file', sizeBytes: 3_120, modified: '2026-11-09T07:30:00Z' },
  ],
  's3-lab:runs/2026-11-07': [
    {
      name: 'S26-1195_colorectal.vcf.gz',
      type: 'file',
      sizeBytes: 36 * MB,
      modified: '2026-11-07T18:40:00Z',
    },
  ],
  's3-lab:platform-exports': [
    {
      name: 'S26-1220_lung_case-export.json',
      type: 'file',
      sizeBytes: 412_000,
      modified: '2026-11-09T08:14:00Z',
    },
    {
      name: 'S26-1221_melanoma_case-export.json',
      type: 'file',
      sizeBytes: 388_000,
      modified: '2026-11-09T08:20:00Z',
    },
    {
      name: 'S26-1222_colon_case-export.xml',
      type: 'file',
      sizeBytes: 905_000,
      modified: '2026-11-08T16:02:00Z',
    },
    { name: 'export-log.txt', type: 'file', sizeBytes: 12_400, modified: '2026-11-09T08:20:00Z' },
  ],
  's3-lab:reference': [
    { name: 'GRCh38.fa.gz', type: 'file', sizeBytes: 0.9 * GB, modified: '2026-03-12T11:00:00Z' },
    { name: 'panel_targets_v3.bed', type: 'file', sizeBytes: 1.8 * MB, modified: '2026-03-12T11:00:00Z' },
  ],
}
