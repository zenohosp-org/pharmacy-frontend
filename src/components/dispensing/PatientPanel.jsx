import { searchHmsPatients, searchHmsDoctors } from '../../api/pharmacyClient';
import SearchDropdown from '../SearchDropdown';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { fmt } from '../../utils/format';

// Right column of IPD dispensing: patient + encounter, doctor, notes, submit.
// `patient` is the usePatientEncounter hook result; `doctor` the useDoctorSearch result.
export default function PatientPanel({
  patient,
  doctor,
  requiresDoctor,
  notes,
  onNotesChange,
  total,
  hasItems,
  loading,
  onSubmit,
}) {
  const { patientQuery, setPatientQuery, selectedPatient, encounter, selectPatient, clearPatient } = patient;

  return (
    <Card padded={false} title="Patient" className="dp-summary">
      <div className="card-body">
        {/* Patient search */}
        <div className="form-group dp-field">
          <label className="form-label">Search patient <span className="text-error">*</span></label>
          <SearchDropdown
            value={patientQuery}
            onChange={setPatientQuery}
            onSelect={selectPatient}
            onClear={clearPatient}
            selected={!!selectedPatient}
            searchFn={searchHmsPatients}
            placeholder="Name, UHID or phone…"
            renderItem={(p) => (
              <>
                <div className="sd-strong">{p.name}</div>
                <div className="sd-muted sd-small">{p.uhid}{p.ward ? ' · Ward ' + p.ward : ''}</div>
              </>
            )}
          />
        </div>

        {/* Encounter status */}
        {selectedPatient && (
          <div className={`dp-enc ${encounter ? 'dp-enc--active' : encounter === false ? 'dp-enc--none' : ''}`}>
            {encounter === null && <span className="dp-enc-checking-text">Checking encounter…</span>}
            {encounter === false && <span className="dp-enc-none-text">No active encounter</span>}
            {encounter && (
              <>
                <div className="dp-enc-title">Active {encounter.type}</div>
                {encounter.ward && <div className="dp-enc-line">Ward: {encounter.ward}</div>}
                {encounter.doctorName && <div className="dp-enc-line">Dr {encounter.doctorName}</div>}
              </>
            )}
          </div>
        )}

        {/* Doctor search */}
        <div className={`form-group dp-field ${requiresDoctor ? 'dp-doctor' : ''}`}>
          <label className={requiresDoctor ? 'dp-doctor-label' : 'form-label'}>
            {requiresDoctor ? '⚠ Doctor name' : 'Doctor name'}
            {requiresDoctor && <span className="text-error"> *</span>}
          </label>
          <SearchDropdown
            value={doctor.doctorQuery}
            onChange={doctor.onChange}
            onSelect={doctor.onSelect}
            onClear={doctor.clear}
            selected={doctor.doctorSelected}
            searchFn={searchHmsDoctors}
            placeholder="Search doctor name…"
            getKey={(d, i) => d.id ?? `doc-${i}`}
            renderItem={(d) => (
              <>
                <div className="sd-strong">{d.name}</div>
                {d.specialization && <div className="sd-muted sd-small">{d.specialization}</div>}
              </>
            )}
          />
          {requiresDoctor && <div className="dp-doctor-hint">Required for Schedule H1/X</div>}
        </div>

        <div className="form-group dp-field">
          <label className="form-label">Notes</label>
          <input type="text" placeholder="Reason / ward notes" value={notes}
            onChange={e => onNotesChange(e.target.value)} className="form-input" />
        </div>

        {hasItems && (
          <div className="dp-total">
            <span>Total</span>
            <span className="dp-total-value">₹{fmt(total)}</span>
          </div>
        )}

        <div className="dp-note">
          Charged to patient's HMS bill — no cash collected at counter.
        </div>

        <Button
          variant="success"
          block
          onClick={onSubmit}
          disabled={loading || !hasItems || !encounter || (requiresDoctor && !doctor.doctorName.trim())}
        >
          {loading ? 'Processing…' : `Dispense  ₹${fmt(total)}`}
        </Button>
      </div>
    </Card>
  );
}
