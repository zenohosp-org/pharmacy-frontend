import { useState, useMemo, Fragment } from 'react';
import useRackMaster from '../hooks/useRackMaster';
import PageHeader from '../components/shared/PageHeader';
import ContentLoader from '../components/shared/ContentLoader';
import Alert from '../components/shared/Alert';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import RackEditModal from '../components/rack-master/RackEditModal';
import { buildGrid, cellKey, rowLabel, colLabel } from '../components/rack-master/rackGrid';
import './RackMaster.css';

export default function RackMaster() {
  const { racks, storeId, loading, error, refetch } = useRackMaster();

  const [modal, setModal] = useState(null); // { rack } | { presetRow, presetCol } | null
  const [extraRows, setExtraRows] = useState(0);
  const [extraCols, setExtraCols] = useState(0);

  const grid = useMemo(() => buildGrid(racks), [racks]);
  const rows = grid.rows + extraRows;
  const cols = grid.cols + extraCols;

  const openCell = (row, col) => {
    const rack = grid.placed.get(cellKey(row, col));
    setModal(rack ? { rack } : { presetRow: row, presetCol: col });
  };

  const tileClass = (rack) => {
    const cls = ['rack-tile'];
    if (!rack.isActive) cls.push('rack-tile--inactive');
    else if (rack.rackType === 'COLD') cls.push('rack-tile--cold');
    return cls.join(' ');
  };

  return (
    <div>
      <PageHeader
        title="Rack Master"
        subtitle="Lay out your pharmacy racks as a grid. Columns are numbered (1, 2, 3…), rows are lettered (A, B, C…) — so column 1 / row A is rack R1-A. Click a cell to add or edit; codes stay editable."
      />

      {error && <Alert tone="error" className="section-gap">{error}</Alert>}

      <Card className="section-gap">
        <div className="rack-legend">
          <span className="rack-legend-item"><span className="rack-swatch rack-swatch--normal" /> Normal</span>
          <span className="rack-legend-item"><span className="rack-swatch rack-swatch--cold" /> Cold storage</span>
          <span className="rack-legend-item"><span className="rack-swatch rack-swatch--inactive" /> Inactive</span>
          <span className="rack-legend-item"><span className="rack-swatch rack-swatch--empty" /> Empty (click to add)</span>
        </div>

        {loading ? (
          <ContentLoader label="Loading racks…" />
        ) : (
          <>
            <div className="rack-grid-scroll">
              <div className="rack-grid" style={{ gridTemplateColumns: `var(--rack-rowhead) repeat(${cols}, 1fr)` }}>
                <div className="rack-corner" />
                {Array.from({ length: cols }, (_, c) => (
                  <div key={`h${c}`} className="rack-colhead">{colLabel(c)}</div>
                ))}

                {Array.from({ length: rows }, (_, r) => (
                  <Fragment key={`r${r}`}>
                    <div className="rack-rowhead">{rowLabel(r)}</div>
                    {Array.from({ length: cols }, (_, c) => {
                      const rack = grid.placed.get(cellKey(r, c));
                      return (
                        <button
                          key={`${r}-${c}`}
                          className={rack ? tileClass(rack) : 'rack-cell-empty'}
                          onClick={() => openCell(r, c)}
                          title={rack ? `${rack.code}${rack.name ? ' · ' + rack.name : ''}` : `Add rack at column ${colLabel(c)}, row ${rowLabel(r)}`}
                        >
                          {rack ? (
                            <>
                              <span className="rack-tile-code">{rack.code}</span>
                              {rack.name && <span className="rack-tile-name">{rack.name}</span>}
                              {rack.rackType === 'COLD' && <span className="rack-tile-tag">❄ cold</span>}
                              {!rack.isActive && <span className="rack-tile-tag">inactive</span>}
                            </>
                          ) : (
                            <span className="rack-cell-plus">+</span>
                          )}
                        </button>
                      );
                    })}
                  </Fragment>
                ))}
              </div>
            </div>

            <div className="rack-grow">
              <Button size="sm" variant="secondary" onClick={() => setExtraRows(n => n + 1)}>+ Row</Button>
              <Button size="sm" variant="secondary" onClick={() => setExtraCols(n => n + 1)}>+ Column</Button>
            </div>
          </>
        )}
      </Card>

      {grid.unplaced.length > 0 && (
        <Card title="Unplaced racks" className="section-gap">
          <p className="rack-unplaced-hint">These racks have no grid position yet. Edit one to give it a row &amp; column.</p>
          <div className="rack-unplaced">
            {grid.unplaced.map(r => (
              <button key={r.id} className="rack-chip" onClick={() => setModal({ rack: r })}>
                <strong>{r.code}</strong>{r.name ? ` · ${r.name}` : ''}
              </button>
            ))}
          </div>
        </Card>
      )}

      <RackEditModal
        open={!!modal}
        rack={modal?.rack}
        presetRow={modal?.presetRow}
        presetCol={modal?.presetCol}
        storeId={storeId}
        onClose={() => setModal(null)}
        onSaved={refetch}
      />
    </div>
  );
}
