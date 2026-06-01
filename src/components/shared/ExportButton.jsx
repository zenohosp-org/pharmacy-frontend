import * as XLSX from 'xlsx';
import { Download } from 'lucide-react';
import Button from '../ui/Button';

/**
 * Reusable "Download Excel" button.
 * columns: [{ header, value(row) }]  — value() extracts the cell for a row
 * rows: data array
 * filename: base name (".xlsx" appended)
 */
export default function ExportButton({ columns, rows, filename = 'report', disabled }) {
  const handleExport = () => {
    const aoa = [
      columns.map((c) => c.header),
      ...rows.map((row) => columns.map((c) => c.value(row))),
    ];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, `${filename}.xlsx`);
  };

  return (
    <Button variant="secondary" size="sm" onClick={handleExport} disabled={disabled || !rows?.length}>
      <Download size={14} /> Excel
    </Button>
  );
}
