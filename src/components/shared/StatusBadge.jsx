/**
 * Reusable status badge — wraps the shared .badge classes in components.css.
 * tone: 'primary' | 'success' | 'warning' | 'error' | 'gray'
 */
const TONES = {
    primary: 'badge-primary',
    success: 'badge-success',
    warning: 'badge-warning',
    error: 'badge-error',
    gray: 'badge-gray',
};

export default function StatusBadge({ tone = 'gray', className = '', children }) {
    return (
        <span className={`badge ${TONES[tone] || TONES.gray} ${className}`}>
            {children}
        </span>
    );
}
