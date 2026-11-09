import { staleInputs } from '../domain/case/interpretation'
import { ONCOTREE } from '../mocks/oncotree'
import { buildReport } from '../domain/report/buildReport'
import { useCaseStore } from './caseStore'

const flush = () => new Promise((r) => setTimeout(r, 0))
async function settle(times = 15) {
  for (let i = 0; i < times; i++) await flush()
}
const create = (fileName: string) =>
  useCaseStore.getState().createCase({ kind: 'local', fileName, sizeBytes: 100 })
const get = (id: string) => useCaseStore.getState().cases.find((c) => c.id === id)!
const tumor = (code: string) => ONCOTREE.find((t) => t.code === code)!

describe('caseStore background processing', () => {
  it('creates a case immediately and waits for manual metadata when the LIMS has no order', async () => {
    const id = create('X-unknown_tumor.vcf.gz')
    expect(get(id).status).toBe('processing')

    await settle()
    expect(get(id).processing.steps.filtering).toBe('done')
    expect(get(id).variants.length).toBeGreaterThan(0)
    expect(get(id).processing.steps.interpretation).toBe('waiting')
    expect(get(id).audit.some((e) => e.message.startsWith('No LIMS order found'))).toBe(true)

    useCaseStore.getState().updateMetadata(id, { tumorType: tumor('LUAD') })
    expect(get(id).processing.steps.interpretation).toBe('waiting')
    expect(get(id).processing.pausedAt).toBeDefined()

    useCaseStore.getState().updateMetadata(id, { tumorContent: 60 })
    await settle()
    expect(get(id).processing.steps.interpretation).toBe('done')
    expect(get(id).processing.pausedAt).toBeUndefined()
    expect(get(id).processing.finishedAt).toBeDefined()
    expect(get(id).status).toBe('ready')
  })

  it('runs fully automatically when the LIMS order has an exact code and tumor content', async () => {
    const id = create('S26-1201_LUAD_tumor.vcf.gz')
    await settle()
    const c = get(id)
    expect(c.metadata.tumorType?.code).toBe('LUAD')
    expect(c.metadata.origin.tumorType).toBe('lims')
    expect(c.metadata.tumorContent).toBe(60)
    expect(c.processing.steps.interpretation).toBe('done')
    expect(c.audit.some((e) => e.message.includes('→ Lung Adenocarcinoma (LUAD)'))).toBe(true)
  })

  it('pre-fills the closest tumor type for an ambiguous code and starts interpretation', async () => {
    const id = create('S26-1210_NSCLC.vcf.gz')
    await settle()
    expect(get(id).metadata.tumorType?.code).toBe('NSCLC')
    expect(get(id).processing.steps.interpretation).toBe('done')
    expect(get(id).audit.some((e) => e.message.includes('closest match'))).toBe(true)
  })

  it('marks the draft stale when inputs change and re-runs only on request', async () => {
    const id = create('S26-1201_LUAD_tumor.vcf.gz')
    await settle()
    expect(get(id).status).toBe('ready')
    useCaseStore.getState().editDescription(id, get(id).variants[0].id, 'gene', 'Edited')

    useCaseStore.getState().updateMetadata(id, { tumorType: tumor('LUSC') })
    await settle()
    expect(get(id).status).toBe('review')
    expect(staleInputs(get(id))).toEqual(['tumorType'])
    expect(get(id).audit.some((e) => e.message.includes('tumor type LUAD → LUSC'))).toBe(true)

    // Changing it back makes the draft valid again.
    useCaseStore.getState().updateMetadata(id, { tumorType: tumor('LUAD') })
    expect(staleInputs(get(id))).toEqual([])

    useCaseStore.getState().updateMetadata(id, { tumorType: tumor('LUSC') })
    useCaseStore.getState().rerunInterpretation(id)
    expect(get(id).status).toBe('processing')
    expect(get(id).edits).toEqual({})
    expect(get(id).audit.at(-1)?.message).toMatch(/re-run after input change .*1 reviewer edit discarded/)
    await settle()
    expect(get(id).status).toBe('ready')
    expect(staleInputs(get(id))).toEqual([])
    expect(get(id).interpretationContext?.tumorType?.code).toBe('LUSC')
  })

  it('keeps the current draft when the reviewer decides so', async () => {
    const id = create('S26-1201_LUAD_tumor.vcf.gz')
    await settle()
    useCaseStore.getState().updateMetadata(id, { tumorContent: 55 })
    expect(staleInputs(get(id))).toEqual(['tumorContent'])
    useCaseStore.getState().keepInterpretation(id)
    expect(staleInputs(get(id))).toEqual([])
    expect(get(id).processing.steps.interpretation).toBe('done')
    expect(get(id).audit.at(-1)?.message).toMatch(/kept despite input change \(tumor content 60% → 55%\)/)
  })

  it('sends a quoted passage and applies the edit to that section', async () => {
    const id = useCaseStore.getState().cases.find((c) => c.metadata.sampleId === 'S26-1187')!.id
    const before = buildReport(get(id)).sections.summary
    const passage = before.split(/(?<=\.)\s+/)[1]
    await useCaseStore
      .getState()
      .sendChat(id, 'Remove this', { text: passage, section: 'summary', sectionTitle: 'Summary' })
    const c = get(id)
    expect(c.chat.at(-2)?.quote?.text).toBe(passage)
    expect(c.report.overrides.summary).not.toContain(passage)
    expect(c.report.highlighted).toBe('summary')
  })

  it('does not let LIMS overwrite user-entered values', () => {
    const id = create('S26-1202_mel.vcf')
    useCaseStore.getState().updateMetadata(id, { panel: 'My panel' })
    useCaseStore.getState().applyLimsOrder(id, { panel: 'LIMS panel', patientId: 'P1' })
    const c = get(id)
    expect(c.metadata.panel).toBe('My panel')
    expect(c.metadata.patientId).toBe('P1')
    expect(c.metadata.origin.patientId).toBe('lims')
  })

  it('moves a ready case to review on the first selection change and signs it', () => {
    const id = useCaseStore.getState().cases.find((c) => c.metadata.sampleId === 'S26-1187')!.id
    useCaseStore.getState().toggleVariant(id, 'atm-vus')
    expect(get(id).selected).not.toContain('atm-vus')
    useCaseStore.getState().signReport(id)
    expect(get(id).status).toBe('signed')
    expect(get(id).report.version).toBe('1.0')
    // Signed reports are locked.
    useCaseStore.getState().toggleVariant(id, 'atm-vus')
    expect(get(id).selected).not.toContain('atm-vus')
  })
})
