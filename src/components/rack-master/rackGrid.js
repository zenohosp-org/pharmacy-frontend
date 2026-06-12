// Rack grid helpers. Rows are 0-based internally, shown as letters A, B, C…;
// columns are 0-based internally, shown as numbers 1, 2, 3…. A rack at
// (row 0, col 0) defaults to code "R1-A".

export const rowLabel = (i) => {
  if (i < 26) return String.fromCharCode(65 + i);
  return `${rowLabel(Math.floor(i / 26) - 1)}${rowLabel(i % 26)}`;
};

export const colLabel = (i) => String(i + 1);

export const defaultRackCode = (row, col) => `R${colLabel(col)}-${rowLabel(row)}`;

export const cellKey = (row, col) => `${row}:${col}`;

// Build a {row:col -> rack} map plus the placed/unplaced split and the grid size
// needed to show every placed rack with at least one spare row/column to grow into.
export function buildGrid(racks, minRows = 3, minCols = 4) {
  const placed = new Map();
  const unplaced = [];
  let maxRow = -1;
  let maxCol = -1;

  for (const r of racks) {
    if (r.gridRow != null && r.gridCol != null) {
      placed.set(cellKey(r.gridRow, r.gridCol), r);
      maxRow = Math.max(maxRow, r.gridRow);
      maxCol = Math.max(maxCol, r.gridCol);
    } else {
      unplaced.push(r);
    }
  }

  return {
    placed,
    unplaced,
    rows: Math.max(minRows, maxRow + 2),
    cols: Math.max(minCols, maxCol + 2),
  };
}
