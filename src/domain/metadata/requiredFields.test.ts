import type { CaseMetadata } from '../types'
import { canStartInterpretation, missingRequiredFields, waitingMessage } from './requiredFields'

const base: CaseMetadata = { sampleId: 'S1', referenceGenome: 'GRCh38', assay: 'somatic', origin: {} }

describe('requiredFields', () => {
  it('requires tumor type and tumor content', () => {
    expect(missingRequiredFields(base)).toEqual(['tumorType', 'tumorContent'])
    expect(canStartInterpretation(base)).toBe(false)
  })

  it('rejects out-of-range tumor content', () => {
    const meta = { ...base, tumorType: { code: 'LUAD', name: 'Lung Adenocarcinoma', tissue: 'Lung' } }
    expect(missingRequiredFields({ ...meta, tumorContent: 0 })).toEqual(['tumorContent'])
    expect(missingRequiredFields({ ...meta, tumorContent: 120 })).toEqual(['tumorContent'])
    expect(canStartInterpretation({ ...meta, tumorContent: 60 })).toBe(true)
  })

  it('builds a readable waiting message', () => {
    expect(waitingMessage(['tumorType', 'tumorContent'])).toBe(
      'Waiting for tumor type and tumor content to start interpretation',
    )
  })
})
