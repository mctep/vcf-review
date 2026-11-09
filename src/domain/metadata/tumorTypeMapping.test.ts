import { ONCOTREE } from '../../mocks/oncotree'
import { mapDiagnosisToOncoTree, resolveTumorType } from './tumorTypeMapping'

const code = (topography: string, morphology: string) =>
  ({ system: 'ICD-O-3', topography, morphology, label: '' }) as const

describe('tumorTypeMapping', () => {
  it('maps exact topography + morphology pairs', () => {
    expect(mapDiagnosisToOncoTree(code('C34.1', '8140/3'))).toEqual({ confidence: 'exact', code: 'LUAD' })
    expect(mapDiagnosisToOncoTree(code('C18.7', '8140/3'))).toEqual({ confidence: 'exact', code: 'COAD' })
  })

  it('flags NOS and site-ambiguous diagnoses', () => {
    expect(mapDiagnosisToOncoTree(code('C34.9', '8046/3')).confidence).toBe('ambiguous')
    expect(mapDiagnosisToOncoTree(code('C77.3', '8720/3')).confidence).toBe('ambiguous')
  })

  it('returns none for unknown codes or no code', () => {
    expect(mapDiagnosisToOncoTree(code('C71.9', '9440/3'))).toEqual({ confidence: 'none' })
    expect(mapDiagnosisToOncoTree(undefined)).toEqual({ confidence: 'none' })
  })

  it('resolves to a catalog entry and tells whether the code was ambiguous', () => {
    expect(resolveTumorType(code('C34.1', '8140/3'), ONCOTREE)).toMatchObject({
      tumorType: { code: 'LUAD' },
      ambiguous: false,
    })
    const nos = resolveTumorType(code('C34.9', '8046/3'), ONCOTREE)
    expect(nos.tumorType?.code).toBe('NSCLC')
    expect(nos.ambiguous).toBe(true)
    expect(nos.reason).toMatch(/NOS/)
  })
})
