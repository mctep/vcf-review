import type { CaseMetadata } from '../types'
import {
  canStartInterpretation,
  interpretationBlockers,
  missingRequiredFields,
  unconfirmedFields,
  waitingMessage,
} from './requiredFields'

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

  it('blocks on unconfirmed values but ignores confirmation of missing ones', () => {
    const meta: CaseMetadata = {
      ...base,
      tumorType: { code: 'NSCLC', name: 'Non-Small Cell Lung Cancer', tissue: 'Lung' },
      tumorContent: 35,
      unconfirmed: ['tumorType'],
    }
    expect(unconfirmedFields(meta)).toEqual(['tumorType'])
    expect(canStartInterpretation(meta)).toBe(false)
    expect(unconfirmedFields({ ...base, unconfirmed: ['tumorType'] })).toEqual([])
  })

  it('builds readable waiting messages', () => {
    expect(waitingMessage(interpretationBlockers(base))).toBe(
      'Waiting for tumor type and tumor content to start interpretation',
    )
    expect(waitingMessage([{ field: 'tumorType', reason: 'unconfirmed' }])).toBe(
      'Confirm tumor type to start interpretation',
    )
    expect(
      waitingMessage([
        { field: 'tumorContent', reason: 'missing' },
        { field: 'tumorType', reason: 'unconfirmed' },
      ]),
    ).toBe('Waiting for tumor content and confirmation of tumor type to start interpretation')
  })
})
