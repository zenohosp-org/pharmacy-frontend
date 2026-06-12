import useCountUp from '../../hooks/useCountUp';
import './StatCard.css';

/**
 * Metric card with a tinted icon chip and tone-colored value.
 * tone:    'default' | 'success' | 'danger' | 'warning' | 'info'
 * countTo: when a number is given, the value counts up and is rendered via format()
 * format:  (n) => string  — formats the animated number (default: rounded integer)
 * icon:    a lucide icon node
 */
export default function StatCard({ label, value, countTo, format, sub, tone = 'default', icon }) {
  const animated = useCountUp(typeof countTo === 'number' ? countTo : 0);
  const display = typeof countTo === 'number'
    ? (format ? format(animated) : Math.round(animated))
    : value;

  return (
    <div className={`card stat-card stat-card--${tone}`}>
      {icon && <span className="stat-card-chip">{icon}</span>}
      <div className="stat-card-body">
        <div className="stat-card-label">{label}</div>
        <div className={`stat-card-value tone-${tone}`}>{display}</div>
        {sub && <div className="stat-card-sub">{sub}</div>}
      </div>
    </div>
  );
}
