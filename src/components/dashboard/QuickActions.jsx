import { Link } from 'react-router-dom';

const QUICK_ACTIONS = [
  { label: 'Counter Sale', to: '/pharmacy/counter-sale', icon: '🛒', tone: 'success' },
  { label: 'IPD Dispensing', to: '/pharmacy/dispensing/queue', icon: '🏥', tone: 'primary' },
  { label: 'Drug Master', to: '/pharmacy/drugs', icon: '💊', tone: 'info' },
];

export default function QuickActions() {
  return (
    <div className="grid grid-3 quick-actions">
      {QUICK_ACTIONS.map(({ label, to, icon, tone }) => (
        <Link key={to} to={to} className={`quick-action quick-action--${tone}`}>
          <span className="quick-action-icon">{icon}</span>
          <span className="quick-action-label">{label}</span>
        </Link>
      ))}
    </div>
  );
}
