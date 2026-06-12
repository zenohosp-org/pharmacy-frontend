import { useState } from 'react';
import { getPatientEncounter } from '../api/pharmacyClient';

// HMS patient selection + active-encounter lookup for ward dispensing.
// `encounter`: null = not loaded, false = none, object = active.
export default function usePatientEncounter() {
  const [patientQuery, setPatientQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [encounter, setEncounter] = useState(null);

  const selectPatient = async (p) => {
    setSelectedPatient(p);
    setPatientQuery(p.name + (p.uhid ? ' · ' + p.uhid : ''));
    setEncounter(null);
    try {
      const enc = await getPatientEncounter(p.id);
      setEncounter(enc || false);
    } catch {
      setEncounter(false);
    }
  };

  const clearPatient = () => {
    setSelectedPatient(null);
    setEncounter(null);
    setPatientQuery('');
  };

  // Queue prefill: set patient + encounter directly, no lookup.
  const prefillPatient = (patient, enc) => {
    setSelectedPatient(patient);
    setPatientQuery(patient.name || '');
    setEncounter(enc);
  };

  return {
    patientQuery, setPatientQuery,
    selectedPatient, encounter,
    selectPatient, clearPatient, prefillPatient,
  };
}
