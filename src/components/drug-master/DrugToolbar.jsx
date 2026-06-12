import { SCHEDULES } from './constants';

// Search + schedule filter + Excel import + template download.
export default function DrugToolbar({ searchQuery, onSearch, selectedSchedule, onSchedule, importing, onImport }) {
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) onImport(file);
  };

  return (
    <div className="toolbar">
      <input
        type="text"
        placeholder="Search by brand or generic name..."
        value={searchQuery}
        onChange={(e) => onSearch(e.target.value)}
        className="form-input search-input"
      />
      <select
        value={selectedSchedule}
        onChange={(e) => onSchedule(e.target.value)}
        className="form-select"
      >
        <option value="">All Schedules</option>
        {SCHEDULES.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      <label className="file-upload-label">
        {importing ? 'Importing...' : 'Import Excel'}
        <input
          type="file"
          accept=".xlsx,.xls"
          className="file-upload-input"
          onChange={handleFile}
          disabled={importing}
        />
      </label>
      <a href="/drug_master_template.xlsx" download className="btn btn-secondary btn-sm">
        Download Template
      </a>
    </div>
  );
}
