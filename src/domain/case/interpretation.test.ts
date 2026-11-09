import { seedCases } from '../../mocks/seedCases'
import { VARIANT_SETS } from '../../mocks/variants'
import type { Case } from '../types'
import { createCase, elapsedMs, isClockRunning, pauseClock, resumeClock, stepsWith } from './factory'
import {
  describeInputChanges,
  displayStatus,
  interpretationBlockReason,
  interpretationState,
  isAnnotated,
  staleInputs,
} from './interpretation'

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

describe('staleInputs', () => {
  const done = (): Case => {
    const c = annotated('pending')
    const tumorType = { code: 'LUAD', name: 'Lung Adenocarcinoma', tissue: 'Lung' }
    return {
      ...c,
      metadata: { ...c.metadata, tumorType, tumorContent: 60 },
      processing: { ...c.processing, steps: { ...c.processing.steps, interpretation: 'done' } },
      interpretationContext: { tumorType, tumorContent: 60 },
    }
  }

  it('lists inputs that differ from the drafted context', () => {
    const c = done()
    expect(staleInputs(c)).toEqual([])
    const changed = { ...c, metadata: { ...c.metadata, tumorContent: 40 } }
    expect(staleInputs(changed)).toEqual(['tumorContent'])
    expect(describeInputChanges(changed)).toBe('tumor content 60% → 40%')
  })

  it('never reports a signed report as stale', () => {
    const c = done()
    const signed = {
      ...c,
      metadata: { ...c.metadata, tumorContent: 40 },
      report: { ...c.report, status: 'signed' as const },
    }
    expect(staleInputs(signed)).toEqual([])
  })
})

describe('displayStatus', () => {
  it('shows a waiting case as needing input, not processing', () => {
    expect(displayStatus({ ...annotated('waiting'), status: 'processing' })).toBe('needsInput')
    expect(displayStatus({ ...annotated('running'), status: 'processing' })).toBe('processing')
    expect(displayStatus(fresh())).toBe('processing')
    expect(displayStatus({ ...annotated('waiting'), status: 'failed' })).toBe('failed')
  })
})

describe('processing clock', () => {
  const t0 = new Date('2026-11-10T10:00:00Z')
  const at = (s: number) => new Date(t0.getTime() + s * 1000)
  const base = { steps: stepsWith(), progress: 0, startedAt: t0.toISOString() }

  it('stops while paused and does not count the pause after resuming', () => {
    const paused = pauseClock(base, at(30))
    expect(isClockRunning(paused)).toBe(false)
    expect(elapsedMs(paused, at(500).getTime())).toBe(30_000)
    const resumed = resumeClock(paused, at(130))
    expect(isClockRunning(resumed)).toBe(true)
    expect(elapsedMs(resumed, at(140).getTime())).toBe(40_000)
  })

  it('continues a finished clock without the idle gap (re-run)', () => {
    const done = { ...base, finishedAt: at(60).toISOString() }
    expect(pauseClock(done, at(70))).toBe(done)
    expect(elapsedMs(resumeClock(done, at(600)), at(610).getTime())).toBe(70_000)
  })
})
