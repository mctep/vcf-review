import { mockInterpretation, type InterpretationService } from './interpretation'
import { mockLims, type LimsService } from './lims'
import { mockProcessing, type ProcessingService } from './processing'
import { mockStorage, type StorageService } from './storage'

export interface Services {
  storage: StorageService
  processing: ProcessingService
  lims: LimsService
  interpretation: InterpretationService
}

/** The only place that decides which implementations the app uses. Swap mocks for real clients here. */
export const services: Services = {
  storage: mockStorage,
  processing: mockProcessing,
  lims: mockLims,
  interpretation: mockInterpretation,
}
