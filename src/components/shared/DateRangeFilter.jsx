import './DateRangeFilter.css';

const iso = (d) => d.toISOString().slice(0, 10);

const PRESETS = [
  { label: 'Today', range: () => { const t = new Date(); return [iso(t), iso(t)]; } },
  { label: '7 days', range: () => { const t = new Date(); const s = new Date(); s.setDate(t.getDate() - 6); return [iso(s), iso(t)]; } },
  { label: '30 days', range: () => { const t = new Date(); const s = new Date(); s.setDate(t.getDate() - 29); return [iso(s), iso(t)]; } },
  { label: 'This month', range: () => { const t = new Date(); const s = new Date(t.getFullYear(), t.getMonth(), 1); return [iso(s), iso(t)]; } },
];

/**
 * Reusable date-range filter bar. Controlled: parent owns `from`/`to`
 * (ISO yyyy-MM-dd strings) and gets updates via onChange(from, to).
 */
export default function DateRangeFilter({ from, to, onChange, children }) {
  return (
    <div className="date-range-filter">
      <div className="drf-presets">
        {PRESETS.map((p) => {
          const [f, t] = p.range();
          const active = from === f && to === t;
          return (
            <button
              key={p.label}
              type="button"
              className={`drf-preset ${active ? 'drf-preset--active' : ''}`}
              onClick={() => onChange(f, t)}
            >
              {p.label}
            </button>
          );
        })}
      </div>
      <div className="drf-dates">
        <label className="drf-field">
          <span>From</span>
          <input type="date" value={from} max={to} onChange={(e) => onChange(e.target.value, to)} />
        </label>
        <label className="drf-field">
          <span>To</span>
          <input type="date" value={to} min={from} onChange={(e) => onChange(from, e.target.value)} />
        </label>
      </div>
      {children && <div className="drf-extra">{children}</div>}
    </div>
  );
}
