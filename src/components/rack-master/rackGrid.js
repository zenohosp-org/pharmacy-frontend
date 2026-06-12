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

// Build a {row:col -> rack} map plus the placed/unplaced split and the grid size.
// The grid is sized tightly to the placed racks (no large empty spare) so the
// board reads as "the racks you created", not a sea of empty cells.
export function buildGrid(racks) {
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
    rows: Math.max(1, maxRow + 1),
    cols: Math.max(1, maxCol + 1),
  };
}

// First free (row, col) within the placed bounding box, else a new column on row 0.
export function firstFreeCell(grid) {
  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) {
      if (!grid.placed.has(cellKey(r, c))) return { row: r, col: c };
    }
  }
  return { row: 0, col: grid.cols };
}
