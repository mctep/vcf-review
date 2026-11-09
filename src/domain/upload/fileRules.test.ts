import { buildFullPath, checkVcfFile, formatBytes, isVcfFileName, joinPath } from './fileRules'

describe('fileRules', () => {
  it('accepts .vcf and .vcf.gz only', () => {
    expect(isVcfFileName('S1.vcf')).toBe(true)
    expect(isVcfFileName('S1.VCF.GZ')).toBe(true)
    expect(isVcfFileName('S1.bam')).toBe(false)
    expect(isVcfFileName('S1.vcf.gz.tbi')).toBe(false)
  })

  it('rejects empty and oversized files', () => {
    expect(checkVcfFile('a.vcf', 0)).toEqual({ ok: false, reason: 'The file is empty.' })
    expect(checkVcfFile('a.vcf', 3 * 1024 ** 3).ok).toBe(false)
    expect(checkVcfFile('a.txt', 10).ok).toBe(false)
    expect(checkVcfFile('a.vcf.gz', 10)).toEqual({ ok: true })
  })

  it('builds NFS and S3 locations', () => {
    expect(buildFullPath('nfs', '/mnt/ngs-runs/', '2026-11/S1.vcf.gz')).toBe(
      '/mnt/ngs-runs/2026-11/S1.vcf.gz',
    )
    expect(buildFullPath('s3', 's3://lab-ngs', '/runs/S1.vcf.gz')).toBe('s3://lab-ngs/runs/S1.vcf.gz')
    expect(buildFullPath('s3', 's3://lab-ngs/', '')).toBe('s3://lab-ngs')
  })

  it('joins paths without duplicate slashes', () => {
    expect(joinPath('/mnt/', '/a/', 'b')).toBe('/mnt/a/b')
    expect(joinPath('', '')).toBe('/')
  })

  it('formats sizes', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(38 * 1024 ** 2)).toBe('38 MB')
    expect(formatBytes(1.5 * 1024 ** 3)).toBe('1.5 GB')
  })
})
