import type { ConnectionType, InputFormat } from '../types'

export const VCF_EXTENSIONS = ['.vcf', '.vcf.gz'] as const
/** Case exports from a tertiary analysis platform (JSON or XML). */
export const EXPORT_EXTENSIONS = ['.json', '.xml'] as const
export const ACCEPTED_EXTENSIONS = [...VCF_EXTENSIONS, ...EXPORT_EXTENSIONS] as const
/** 2 GiB — generous upper bound for a single-sample somatic VCF. */
export const MAX_VCF_BYTES = 2 * 1024 ** 3

export const INPUT_FORMAT_LABEL: Record<InputFormat, string> = {
  vcf: 'VCF',
  'platform-export': 'Analysis platform export',
}

export function isVcfFileName(name: string): boolean {
  const lower = name.toLowerCase()
  return VCF_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

/** Input format by file name, or `null` when the file cannot be used to create a case. */
export function detectInputFormat(name: string): InputFormat | null {
  const lower = name.toLowerCase()
  if (isVcfFileName(lower)) return 'vcf'
  if (EXPORT_EXTENSIONS.some((ext) => lower.endsWith(ext))) return 'platform-export'
  return null
}

export const isAcceptedFileName = (name: string) => detectInputFormat(name) !== null

export type FileCheck = { ok: true } | { ok: false; reason: string }

export function checkInputFile(name: string, sizeBytes: number): FileCheck {
  if (!isAcceptedFileName(name))
    return {
      ok: false,
      reason: 'Choose a VCF (.vcf, .vcf.gz) or an analysis platform export (.json, .xml).',
    }
  if (sizeBytes <= 0) return { ok: false, reason: 'The file is empty.' }
  if (sizeBytes > MAX_VCF_BYTES) return { ok: false, reason: 'The file is larger than 2 GB.' }
  return { ok: true }
}

/** Joins path segments without duplicate slashes. */
export function joinPath(...parts: string[]): string {
  const joined = parts
    .filter(Boolean)
    .map((p, i) => (i === 0 ? p.replace(/\/+$/, '') : p.replace(/^\/+|\/+$/g, '')))
    .filter(Boolean)
    .join('/')
  return joined || '/'
}

/**
 * Builds the fully qualified location shown to the user and stored on the case.
 * NFS: `/mnt/ngs-runs/2026-11/S1.vcf.gz`; S3: `s3://bucket/2026-11/S1.vcf.gz`.
 */
export function buildFullPath(type: ConnectionType, root: string, relativePath: string): string {
  if (type === 's3') {
    const bucket = root.replace(/^s3:\/\//, '').replace(/\/+$/, '')
    const rel = relativePath.replace(/^\/+/, '')
    return rel ? `s3://${bucket}/${rel}` : `s3://${bucket}`
  }
  return joinPath(root, relativePath)
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let value = bytes / 1024
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`
}
