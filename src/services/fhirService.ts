import { collection, doc, setDoc, getDoc, query, where, getDocs, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface FHIRPatient {
  resourceType: 'Patient';
  id: string;
  active: boolean;
  name: Array<{
    use?: string;
    family: string;
    given: string[];
  }>;
  gender: 'male' | 'female' | 'other' | 'unknown';
  birthDate: string;
  telecom?: Array<{
    system: string;
    value: string;
    use?: string;
  }>;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface FHIRObservation {
  resourceType: 'Observation';
  id: string;
  status: 'registered' | 'preliminary' | 'final' | 'amended';
  category: Array<{
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  }>;
  code: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
    text: string;
  };
  subject: {
    reference: string;
  };
  effectiveDateTime: string;
  valueQuantity?: {
    value: number;
    unit: string;
    system: string;
    code: string;
  };
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export const fhirService = {
  // Convert local Patient to FHIR Patient
  async createFHIRPatient(patientData: any) {
    const fhirId = patientData.id || `patient-${Date.now()}`;
    const fhirPatient: FHIRPatient = {
      resourceType: 'Patient',
      id: fhirId,
      active: true,
      name: [{
        family: patientData.name.split(' ').pop() || '',
        given: patientData.name.split(' ').slice(0, -1)
      }],
      gender: patientData.gender === 'male' ? 'male' : 'female',
      birthDate: patientData.birthDate || '',
      telecom: [{
        system: 'phone',
        value: patientData.phone || ''
      }]
    };

    await setDoc(doc(db, 'fhir_patients', fhirId), {
      ...fhirPatient,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return fhirId;
  },

  async getPatient(id: string) {
    const docSnap = await getDoc(doc(db, 'fhir_patients', id));
    if (docSnap.exists()) {
      return docSnap.data() as FHIRPatient;
    }
    return null;
  },

  async addObservation(observation: Partial<FHIRObservation>) {
    const id = `obs-${Date.now()}`;
    const fullObs = {
      ...observation,
      id,
      resourceType: 'Observation',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    await setDoc(doc(db, 'fhir_observations', id), fullObs);
    return id;
  },

  async getPatientObservations(patientId: string) {
    const q = query(
      collection(db, 'fhir_observations'),
      where('subject.reference', '==', `Patient/${patientId}`)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as FHIRObservation);
  }
};
