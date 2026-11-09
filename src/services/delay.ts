/** Artificial latency for mocked services. Set `VITE_FAST_MOCKS=1` (or run tests) to shorten. */
const FAST = import.meta.env.MODE === 'test' || import.meta.env.VITE_FAST_MOCKS === '1'

export const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, FAST ? 0 : ms))

/** Speed factor applied to processing step durations. */
export const STEP_SPEED = FAST ? 0 : 1
