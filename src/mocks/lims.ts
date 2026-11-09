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
  | 'diagnosisCode'
  | 'tumorContent'
  | 'panel'
>

const PANEL = 'Solid Tumor 52-gene panel v3'

/**
 * Synthetic test orders as they might arrive from a LIMS (HL7 ORM / FHIR ServiceRequest),
 * including the coded diagnosis and the pathologist's tumor content estimate when available.
 * Unknown sample ids have no order.
 *
 * Demo coverage:
 * - S26-1201 (sample file): exact code + tumor content → interpretation starts automatically
 * - S26-1203: exact code, tumor content not recorded yet → waits for tumor content
 * - S26-1210, S26-1202: ambiguous code → tumor type must be confirmed
 */
export const LIMS_ORDERS: Record<string, LimsOrder> = {
  'S26-1201': {
    patientId: 'PSN-7Q4K-2291',
    sex: 'female',
    birthYear: 1961,
    orderingPhysician: 'Dr. J. Okafor, Thoracic Oncology',
    specimenType: 'FFPE, core needle biopsy (lung)',
    collectionDate: '2026-10-29',
    diagnosis: 'Adenocarcinoma of the right upper lobe, stage IVA',
    diagnosisCode: {
      system: 'ICD-O-3',
      topography: 'C34.1',
      morphology: '8140/3',
      label: 'Adenocarcinoma, NOS — upper lobe, lung',
    },
    tumorContent: 60,
    panel: PANEL,
  },
  'S26-1202': {
    patientId: 'PSN-3B8D-1180',
    sex: 'male',
    birthYear: 1974,
    orderingPhysician: 'Dr. M. Lindqvist, Dermato-Oncology',
    specimenType: 'FFPE, lymph node excision',
    collectionDate: '2026-10-30',
    diagnosis: 'Metastatic melanoma, axillary lymph node',
    diagnosisCode: {
      system: 'ICD-O-3',
      topography: 'C77.3',
      morphology: '8720/3',
      label: 'Malignant melanoma, NOS — axillary lymph node',
    },
    tumorContent: 70,
    panel: PANEL,
  },
  'S26-1203': {
    patientId: 'PSN-9C1F-4402',
    sex: 'male',
    birthYear: 1958,
    orderingPhysician: 'Dr. S. Haddad, GI Oncology',
    specimenType: 'FFPE, resection (sigmoid colon)',
    collectionDate: '2026-10-31',
    diagnosis: 'Adenocarcinoma of the sigmoid colon, pT3 N1',
    diagnosisCode: {
      system: 'ICD-O-3',
      topography: 'C18.7',
      morphology: '8140/3',
      label: 'Adenocarcinoma, NOS — sigmoid colon',
    },
    panel: PANEL,
  },
  'S26-1210': {
    patientId: 'PSN-2D7A-5517',
    sex: 'female',
    birthYear: 1966,
    orderingPhysician: 'Dr. J. Okafor, Thoracic Oncology',
    specimenType: 'Cytology cell block (pleural effusion)',
    collectionDate: '2026-11-03',
    diagnosis: 'Non-small cell lung carcinoma, NOS',
    diagnosisCode: {
      system: 'ICD-O-3',
      topography: 'C34.9',
      morphology: '8046/3',
      label: 'Non-small cell carcinoma — lung, NOS',
    },
    tumorContent: 35,
    panel: PANEL,
  },
  'S26-1211': {
    patientId: 'PSN-6E3B-0921',
    sex: 'female',
    birthYear: 1982,
    orderingPhysician: 'Dr. M. Lindqvist, Dermato-Oncology',
    specimenType: 'FFPE, excision (skin, back)',
    collectionDate: '2026-11-04',
    diagnosis: 'Cutaneous melanoma, back, Breslow 3.1 mm',
    diagnosisCode: {
      system: 'ICD-O-3',
      topography: 'C44.5',
      morphology: '8720/3',
      label: 'Malignant melanoma, NOS — skin of trunk',
    },
    tumorContent: 65,
    panel: PANEL,
  },
}
