import type { CaseMetadata } from '../domain/types'

export type LimsOrder = Pick<
  CaseMetadata,
  | 'patientId'
  | 'sex'
  | 'birthYear'
  | 'orderingPhysician'
  | 'specimenType'
  | 'collectionDate'
  | 'diagnosis'
  | 'panel'
>

/**
 * Synthetic test orders as they might arrive from a LIMS (HL7 ORM / FHIR ServiceRequest).
 * Any unknown sample id falls back to the generic order so the demo always works.
 */
export const LIMS_ORDERS: Record<string, LimsOrder> = {
  generic: {
    patientId: 'PSN-7Q4K-2291',
    sex: 'female',
    birthYear: 1961,
    orderingPhysician: 'Dr. J. Okafor, Thoracic Oncology',
    specimenType: 'FFPE, core needle biopsy (lung)',
    collectionDate: '2026-10-29',
    diagnosis: 'Adenocarcinoma of the right upper lobe, stage IVA',
    panel: 'Solid Tumor 52-gene panel v3',
  },
  'S26-1202': {
    patientId: 'PSN-3B8D-1180',
    sex: 'male',
    birthYear: 1974,
    orderingPhysician: 'Dr. M. Lindqvist, Dermato-Oncology',
    specimenType: 'FFPE, lymph node excision',
    collectionDate: '2026-10-30',
    diagnosis: 'Metastatic cutaneous melanoma',
    panel: 'Solid Tumor 52-gene panel v3',
  },
}
