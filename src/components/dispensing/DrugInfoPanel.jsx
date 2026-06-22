import { useState } from 'react';
import './DrugInfoPanel.css';

// Collapsible drug-info + same-generic alternatives panels shown under the
// drug search bar once a drug is selected. `alternatives` are GenericAlternativeResponse
// rows (id, brandName, genericName, schedule, totalQty, inStock) — same composition.
export default function DrugInfoPanel({ drug, alternatives = [], onPickAlternative, defaultAltOpen = false }) {
  const [showDrugInfo, setShowDrugInfo] = useState(false);
  const [showAlt, setShowAlt] = useState(defaultAltOpen);

  if (!drug) return null;
  const hasInfo = drug.purpose || drug.saltName;
  if (!hasInfo && alternatives.length === 0) return null;

  return (
    <div className="cs-info-row">
      {hasInfo && (
        <div className="cs-info-panel" onClick={() => setShowDrugInfo(v => !v)}>
          <div className="cs-info-head">
            <strong>ℹ Drug info</strong>
            <span>{showDrugInfo ? '▲' : '▼'}</span>
          </div>
          {showDrugInfo && (
            <div className="cs-info-body">
              {drug.saltName && <div><b>Salt:</b> {drug.saltName}</div>}
              {drug.chemicalClass && <div><b>Class:</b> {drug.chemicalClass}</div>}
              {drug.purpose && <div><b>Use:</b> {drug.purpose}</div>}
              {drug.sideEffects && <div><b>Side effects:</b> {drug.sideEffects}</div>}
              {drug.stripsPerPack && drug.unitsPerStrip && (
                <div><b>Pack:</b> {drug.stripsPerPack} strips × {drug.unitsPerStrip} tabs</div>
              )}
            </div>
          )}
        </div>
      )}
      {alternatives.length > 0 && (
        <div className="cs-info-panel cs-info-panel--warn" onClick={() => setShowAlt(v => !v)}>
          <div className="cs-info-head">
            <strong>💊 {alternatives.length} same-generic alternative{alternatives.length > 1 ? 's' : ''}</strong>
            <span>{showAlt ? '▲' : '▼'}</span>
          </div>
          {showAlt && (
            <div className="cs-info-body">
              {alternatives.map((alt) => (
                <div key={alt.id} onMouseDown={() => onPickAlternative(alt)} className="cs-alt-item">
                  <div>
                    <div className="cs-alt-name">{alt.brandName}</div>
                    <div className="cs-alt-generic">{alt.genericName}</div>
                  </div>
                  <span className={`cs-alt-stock cs-alt-stock--${alt.inStock ? 'ok' : 'out'}`}>
                    {alt.inStock ? `In stock · ${alt.totalQty}` : 'Out of stock'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
