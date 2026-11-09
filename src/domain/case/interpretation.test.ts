import { seedCases } from '../../mocks/seedCases'
import { VARIANT_SETS } from '../../mocks/variants'
import type { Case } from '../types'
import { createCase, stepsWith } from './factory'
import { interpretationBlockReason, interpretationState, isAnnotated } from './interpretation'

const fresh = (): Case => createCase({ kind: 'local', fileName: 'S26-1201.vcf', sizeBytes: 10 })

const annotated = (interpretation: 'pending' | 'waiting' | 'running' | 'failed'): Case => ({
  ...fresh(),
  variants: VARIANT_SETS.nsclc.variants,
  processing: {
    ...fresh().processing,
    steps: stepsWith({
      uploading: 'done',
      validating: 'done',
      annotation: 'done',
      filtering: 'done',
      interpretation,
    }),
  },
})

describe('interpretation state', () => {
  it('is not annotated while the pipeline runs', () => {
    const c = fresh()
    expect(isAnnotated(c)).toBe(false)
    expect(interpretationState(c)).toBe('not-annotated')
    expect(interpretationBlockReason(c)).toMatch(/still being annotated/)
  })

  it('exposes variants but blocks AI content while waiting for metadata', () => {
    const c = annotated('waiting')
    expect(isAnnotated(c)).toBe(true)
    expect(interpretationState(c)).toBe('waiting')
    expect(interpretationBlockReason(c)).toBe(
      'Waiting for tumor type and tumor content to start interpretation.',
    )
  })

  it('treats a pending step after ranking as running', () => {
    expect(interpretationState(annotated('pending'))).toBe('running')
    expect(interpretationState(annotated('running'))).toBe('running')
  })

  it('reports interpretation failures separately', () => {
    expect(interpretationState(annotated('failed'))).toBe('failed')
  })

  it('unblocks a fully interpreted case', () => {
    const c = seedCases().find((x) => x.metadata.sampleId === 'S26-1187')!
    expect(interpretationState(c)).toBe('done')
    expect(interpretationBlockReason(c)).toBeUndefined()
  })
})
