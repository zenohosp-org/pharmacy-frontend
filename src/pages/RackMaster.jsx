import { useState, useMemo, Fragment } from 'react';
import useRackMaster from '../hooks/useRackMaster';
import PageHeader from '../components/shared/PageHeader';
import ContentLoader from '../components/shared/ContentLoader';
import Alert from '../components/shared/Alert';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import RackEditModal from '../components/rack-master/RackEditModal';
import RackDetailModal from '../components/rack-master/RackDetailModal';
import { buildGrid, firstFreeCell, cellKey, rowLabel, colLabel } from '../components/rack-master/rackGrid';
import './RackMaster.css';

export default function RackMaster() {
  const { racks, contentsByRack, storeId, loading, error, removeRack, refetch } = useRackMaster();

  const [detailRack, setDetailRack] = useState(null);
  const [edit, setEdit] = useState(null); // { rack } | { presetRow, presetCol } | null

  const grid = useMemo(() => buildGrid(racks), [racks]);
  const hasPlaced = grid.placed.size > 0;

  const stockOf = (rackId) => contentsByRack[rackId] || [];

  const openAdd = () => {
    const { row, col } = firstFreeCell(grid);
    setEdit({ presetRow: row, presetCol: col });
  };

  const onEditFromDetail = (rack) => { setDetailRack(null); setEdit({ rack }); };
  const onDeactivate = async (rack) => { setDetailRack(null); await removeRack(rack.id); };

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
        subtitle="The racks you've created, laid out by column (1, 2, 3…) and row (A, B, C…). Click a rack to see the medicines stored in it."
        actions={<Button onClick={openAdd}>+ Add Rack</Button>}
      />

      {error && <Alert tone="error" className="section-gap">{error}</Alert>}

      {loading ? (
        <ContentLoader label="Loading racks…" />
      ) : !hasPlaced && grid.unplaced.length === 0 ? (
        <Card className="section-gap">
          <div className="rack-empty-state">
            <p>No racks yet.</p>
            <Button onClick={openAdd}>+ Add your first rack</Button>
          </div>
        </Card>
      ) : (
        <>
          {hasPlaced && (
            <Card className="section-gap">
              <div className="rack-legend">
                <span className="rack-legend-item"><span className="rack-swatch rack-swatch--normal" /> Normal</span>
                <span className="rack-legend-item"><span className="rack-swatch rack-swatch--cold" /> Cold storage</span>
                <span className="rack-legend-item"><span className="rack-swatch rack-swatch--inactive" /> Inactive</span>
              </div>

              <div className="rack-grid-scroll">
                <div className="rack-grid" style={{ gridTemplateColumns: `var(--rack-rowhead) repeat(${grid.cols}, 1fr)` }}>
                  <div className="rack-corner" />
                  {Array.from({ length: grid.cols }, (_, c) => (
                    <div key={`h${c}`} className="rack-colhead">{colLabel(c)}</div>
                  ))}

                  {Array.from({ length: grid.rows }, (_, r) => (
                    <Fragment key={`r${r}`}>
                      <div className="rack-rowhead">{rowLabel(r)}</div>
                      {Array.from({ length: grid.cols }, (_, c) => {
                        const rack = grid.placed.get(cellKey(r, c));
                        if (!rack) return <div key={`${r}-${c}`} className="rack-cell-blank" />;
                        const items = stockOf(rack.id);
                        const units = items.reduce((s, b) => s + (parseFloat(b.currentUnits) || 0), 0);
                        return (
                          <button
                            key={`${r}-${c}`}
                            className={tileClass(rack)}
                            onClick={() => setDetailRack(rack)}
                            title={`${rack.code}${rack.name ? ' · ' + rack.name : ''} — click to view contents`}
                          >
                            <span className="rack-tile-code">{rack.code}</span>
                            {rack.name && <span className="rack-tile-name">{rack.name}</span>}
                            <span className="rack-tile-badge">
                              {items.length} batch{items.length === 1 ? '' : 'es'}{units ? ` · ${units.toFixed(0)}u` : ''}
                            </span>
                            {rack.rackType === 'COLD' && <span className="rack-tile-tag">❄ cold</span>}
                            {!rack.isActive && <span className="rack-tile-tag">inactive</span>}
                          </button>
                        );
                      })}
                    </Fragment>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {grid.unplaced.length > 0 && (
            <Card title="Unplaced racks" className="section-gap">
              <p className="rack-unplaced-hint">These racks have no grid position yet. Open one and set its row &amp; column.</p>
              <div className="rack-unplaced">
                {grid.unplaced.map(r => (
                  <button key={r.id} className="rack-chip" onClick={() => setDetailRack(r)}>
                    <strong>{r.code}</strong>{r.name ? ` · ${r.name}` : ''} · {stockOf(r.id).length} batches
                  </button>
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      <RackDetailModal
        open={!!detailRack}
        rack={detailRack}
        contents={detailRack ? stockOf(detailRack.id) : []}
        onClose={() => setDetailRack(null)}
        onEdit={onEditFromDetail}
        onDeactivate={onDeactivate}
      />

      <RackEditModal
        open={!!edit}
        rack={edit?.rack}
        presetRow={edit?.presetRow}
        presetCol={edit?.presetCol}
        storeId={storeId}
        onClose={() => setEdit(null)}
        onSaved={refetch}
      />
    </div>
  );
}
