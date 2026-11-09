import { LIMS_ORDERS, type LimsOrder } from '../mocks/lims'
import { delay } from './delay'

export type { LimsOrder }

export interface LimsService {
  /** Looks up the test order for a sample (HL7 ORM / FHIR ServiceRequest in a real system). */
  fetchOrder(sampleId: string): Promise<LimsOrder>
}

export const mockLims: LimsService = {
  async fetchOrder(sampleId) {
    await delay(700)
    return LIMS_ORDERS[sampleId] ?? LIMS_ORDERS.generic
  },
}
