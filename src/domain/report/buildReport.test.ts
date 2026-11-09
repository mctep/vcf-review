import { seedCases } from '../../mocks/seedCases'
import { sampleIdFromFileName } from '../case/factory'
import {
  buildReport,
  draftSummary,
  reportToPlainText,
  richTextToPlain,
  signOffBlockReason,
} from './buildReport'

const nsclc = () => seedCases().find((c) => c.metadata.sampleId === 'S26-1187')!

describe('buildReport', () => {
  it('splits significant and uncertain variants by tier', () => {
    const r = buildReport(nsclc())
    expect(r.significant.map((v) => v.gene)).toEqual(['EGFR', 'TP53', 'CDKN2A', 'PIK3CA', 'BRCA2'])
    expect(r.uncertain.map((v) => v.gene)).toEqual(['ATM'])
    expect(r.significant[0].tierLevel).toBe('Tier IA')
  })

  it('only includes selected variants', () => {
    const c = { ...nsclc(), selected: ['egfr-l858r'] }
    const r = buildReport(c)
    expect(r.significant).toHaveLength(1)
    expect(r.uncertain).toHaveLength(0)
  })

  it('drafts a summary with therapy and germline notes', () => {
    const c = nsclc()
    const summary = draftSummary(c.variants, 'Lung Adenocarcinoma')
    expect(summary).toContain('EGFR p.L858R (Tier IA)')
    expect(summary).toContain('Osimertinib')
    expect(summary).toContain('possible germline origin')
  })

  it('prefers user/assistant overrides', () => {
    const c = nsclc()
    c.report = { ...c.report, overrides: { summary: 'Custom summary.' } }
    expect(buildReport(c).sections.summary).toBe('Custom summary.')
  })

  it('lists patient, specimen, clinical and test details in the header', () => {
    const header = buildReport(nsclc()).header
    expect(header.map((b) => b.title)).toEqual(['Patient', 'Specimen', 'Clinical', 'Test'])
    const field = (label: string) => header.flatMap((b) => b.fields).find((f) => f.label === label)?.value
    expect(field('Patient ID')).toBe('PSN-7Q4K-2291')
    expect(field('Sex')).toBe('Female')
    expect(field('Year of birth')).toBe('1961')
    expect(field('Collected')).toBe('29 Oct 2026')
    expect(field('Diagnosis')).toMatch(/Adenocarcinoma/)
    expect(field('Tumor type')).toBe('Lung Adenocarcinoma (LUAD)')
  })

  it('requires a patient ID and at least one variant to sign', () => {
    const c = nsclc()
    expect(signOffBlockReason(c)).toBeUndefined()
    expect(signOffBlockReason({ ...c, metadata: { ...c.metadata, patientId: undefined } })).toMatch(
      /patient ID/,
    )
    expect(signOffBlockReason({ ...c, selected: [] })).toMatch(/at least one variant/)
  })

  it('exports plain text', () => {
    const text = reportToPlainText(buildReport(nsclc()))
    expect(text).toContain('MOLECULAR PATHOLOGY REPORT — DRAFT')
    expect(text).toContain('PATIENT\nPatient ID: PSN-7Q4K-2291')
    expect(text).toContain('- EGFR p.L858R (c.2573T>G), VAF 31%')
  })

  it('flattens rich text', () => {
    expect(richTextToPlain(['a ', { cite: { label: 'X', url: '', source: '', accessed: '' } }, ' b'])).toBe(
      'a X b',
    )
  })
})

describe('sampleIdFromFileName', () => {
  it('extracts lab sample ids', () => {
    expect(sampleIdFromFileName('S26-1201_LUAD_tumor.vcf.gz')).toBe('S26-1201')
    expect(sampleIdFromFileName('my_sample.vcf')).toBe('my_sample')
  })
})
