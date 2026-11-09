import { LIMS_ORDERS, type LimsOrder } from '../mocks/lims'
import { delay } from './delay'

export type { LimsOrder }

export interface LimsService {
  /**
   * Looks up the test order for a sample (HL7 ORM / FHIR ServiceRequest in a real system).
   * Resolves with `null` when the LIMS has no order for this sample.
   */
  fetchOrder(sampleId: string): Promise<LimsOrder | null>
}

export const mockLims: LimsService = {
  async fetchOrder(sampleId) {
    await delay(700)
    return LIMS_ORDERS[sampleId] ?? null
  },
}
