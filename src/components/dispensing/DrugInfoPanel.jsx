import { useState } from 'react';

// Collapsible drug-info + therapeutic-alternatives panels shown under the
// counter-sale search bar once a drug is selected.
export default function DrugInfoPanel({ drug, alternatives, drugs, onPickAlternative }) {
  const [showDrugInfo, setShowDrugInfo] = useState(false);
  const [showAlt, setShowAlt] = useState(false);

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
            <strong>💊 {alternatives.length} alternative{alternatives.length > 1 ? 's' : ''}</strong>
            <span>{showAlt ? '▲' : '▼'}</span>
          </div>
          {showAlt && (
            <div className="cs-info-body">
              {alternatives.map((alt, i) => {
                const altDrug = drugs.find(d => d.id === alt.alternativeDrugId);
                return altDrug ? (
                  <div key={i} onMouseDown={() => onPickAlternative(altDrug)} className="cs-alt-item">
                    <div>
                      <div className="cs-alt-name">{altDrug.brandName}</div>
                      <div className="cs-alt-generic">{altDrug.genericName} {alt.reason && `· ${alt.reason}`}</div>
                    </div>
                    <span>→</span>
                  </div>
                ) : null;
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
