import './AlertRow.css';

/**
 * Compact alert list row (used in dashboards / stock alert lists).
 * tone: 'error' | 'warning' — picks the background/border via a CSS class.
 *
 * Helper sub-elements (use plain spans with these classes inside):
 *   .alert-row-line   flex row
 *   .alert-row-name   bold label
 *   .alert-row-meta   small muted line
 *   .alert-row-value  bold trailing value (+ --error / --warning modifier)
 */
export default function AlertRow({ tone = 'error', className = '', children }) {
    return (
        <div className={`alert-row alert-row--${tone} ${className}`}>
            {children}
        </div>
    );
}
