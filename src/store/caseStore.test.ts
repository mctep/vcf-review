import { ONCOTREE } from '../mocks/oncotree'
import { useCaseStore } from './caseStore'

const flush = () => new Promise((r) => setTimeout(r, 0))
async function settle(times = 10) {
  for (let i = 0; i < times; i++) await flush()
}

describe('caseStore background processing', () => {
  it('creates a case immediately and waits for required metadata before interpretation', async () => {
    const id = useCaseStore
      .getState()
      .createCase({ kind: 'local', fileName: 'S26-1201_LUAD_tumor.vcf.gz', sizeBytes: 100 })
    const get = () => useCaseStore.getState().cases.find((c) => c.id === id)!

    expect(get().status).toBe('processing')
    expect(get().metadata.sampleId).toBe('S26-1201')

    await settle()
    expect(get().processing.steps.filtering).toBe('done')
    expect(get().variants.length).toBeGreaterThan(0)
    expect(get().processing.steps.interpretation).toBe('waiting')

    useCaseStore.getState().updateMetadata(id, { tumorType: ONCOTREE[0] })
    expect(get().processing.steps.interpretation).toBe('waiting')

    useCaseStore.getState().updateMetadata(id, { tumorContent: 60 })
    await settle()
    expect(get().processing.steps.interpretation).toBe('done')
    expect(get().status).toBe('ready')
  })

  it('does not let LIMS overwrite user-entered values', () => {
    const id = useCaseStore
      .getState()
      .createCase({ kind: 'local', fileName: 'S26-1202_mel.vcf', sizeBytes: 100 })
    useCaseStore.getState().updateMetadata(id, { panel: 'My panel' })
    useCaseStore.getState().applyLimsOrder(id, { panel: 'LIMS panel', patientId: 'P1' })
    const c = useCaseStore.getState().cases.find((x) => x.id === id)!
    expect(c.metadata.panel).toBe('My panel')
    expect(c.metadata.patientId).toBe('P1')
    expect(c.metadata.origin.patientId).toBe('lims')
  })

  it('moves a ready case to review on the first selection change and signs it', () => {
    const id = useCaseStore.getState().cases.find((c) => c.metadata.sampleId === 'S26-1187')!.id
    useCaseStore.getState().toggleVariant(id, 'atm-vus')
    let c = useCaseStore.getState().cases.find((x) => x.id === id)!
    expect(c.selected).not.toContain('atm-vus')
    useCaseStore.getState().signReport(id)
    c = useCaseStore.getState().cases.find((x) => x.id === id)!
    expect(c.status).toBe('signed')
    expect(c.report.version).toBe('1.0')
    // Signed reports are locked.
    useCaseStore.getState().toggleVariant(id, 'atm-vus')
    expect(useCaseStore.getState().cases.find((x) => x.id === id)!.selected).not.toContain('atm-vus')
  })
})
