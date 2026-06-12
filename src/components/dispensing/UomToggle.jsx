import { lineRatio } from '../../utils/counterSale';

// Strip/Unit toggle — hidden when the drug has no usable ratio (ratio <= 1).
export default function UomToggle({ item, onChange }) {
  const ratio = lineRatio(item);
  if (ratio <= 1) return null;
  return (
    <div className="cs-uom">
      {['UNIT', 'STRIP'].map(u => (
        <button
          key={u}
          type="button"
          onClick={() => onChange({ ...item, uom: u })}
          className={`cs-uom-btn ${item.uom === u ? 'cs-uom-btn--active' : ''}`}
        >
          {u === 'UNIT' ? 'Unit' : `Strip ×${ratio}`}
        </button>
      ))}
    </div>
  );
}
