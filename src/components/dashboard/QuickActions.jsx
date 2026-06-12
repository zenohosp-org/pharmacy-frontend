import { Link } from 'react-router-dom';
import { ShoppingCart, Stethoscope, Pill, ChevronRight } from 'lucide-react';

const QUICK_ACTIONS = [
  { label: 'Counter Sale', desc: 'Walk-in POS billing', to: '/pharmacy/counter-sale', Icon: ShoppingCart, tone: 'success' },
  { label: 'IPD Dispensing', desc: 'Ward & prescription queue', to: '/pharmacy/dispensing/queue', Icon: Stethoscope, tone: 'primary' },
  { label: 'Drug Master', desc: 'Catalogue & stock setup', to: '/pharmacy/drugs', Icon: Pill, tone: 'info' },
];

export default function QuickActions() {
  return (
    <div className="grid grid-3 quick-actions">
      {QUICK_ACTIONS.map(({ label, desc, to, Icon, tone }) => (
        <Link key={to} to={to} className={`quick-action quick-action--${tone}`}>
          <span className="quick-action-icon"><Icon size={20} /></span>
          <span className="quick-action-text">
            <span className="quick-action-label">{label}</span>
            <span className="quick-action-desc">{desc}</span>
          </span>
          <ChevronRight size={18} className="quick-action-arrow" />
        </Link>
      ))}
    </div>
  );
}
