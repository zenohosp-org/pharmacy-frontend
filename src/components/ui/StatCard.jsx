import './StatCard.css';

/**
 * Reusable metric card.
 * tone: 'default' | 'success' | 'danger' | 'warning' — picks the value color
 *       via a CSS state class (no inline styles).
 */
export default function StatCard({ label, value, sub, tone = 'default', icon }) {
    return (
        <div className="card card-elevated stat-card">
            <div className="stat-card-row">
                <div>
                    <div className="stat-card-label">{label}</div>
                    <div className={`stat-card-value tone-${tone}`}>{value}</div>
                    {sub && <div className="stat-card-sub">{sub}</div>}
                </div>
                {icon && <span className="stat-card-icon">{icon}</span>}
            </div>
        </div>
    );
}
