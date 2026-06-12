import { useState } from 'react';

// Doctor field that supports both autocomplete selection and free-text entry.
export default function useDoctorSearch() {
  const [doctorName, setDoctorName] = useState('');
  const [doctorQuery, setDoctorQuery] = useState('');
  const [doctorSelected, setDoctorSelected] = useState(false);

  const onChange = (q) => {
    setDoctorQuery(q);
    setDoctorName(q); // free-text fallback when no selection is made
    setDoctorSelected(false);
  };

  const onSelect = (doctor) => {
    setDoctorName(doctor.name);
    setDoctorQuery(doctor.name);
    setDoctorSelected(true);
  };

  const clear = () => {
    setDoctorName('');
    setDoctorQuery('');
    setDoctorSelected(false);
  };

  // Set a doctor by name (e.g. derived from a prescription's prescriber).
  const setDoctor = (name) => {
    setDoctorName(name);
    setDoctorQuery(name);
    setDoctorSelected(true);
  };

  return { doctorName, setDoctorName, doctorQuery, doctorSelected, onChange, onSelect, clear, setDoctor };
}
