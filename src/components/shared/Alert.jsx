import './Alert.css';

/**
 * Reusable alert banner — wraps the shared .alert classes in components.css
 * and adds warning/info tones in Alert.css.
 * tone: 'success' | 'error' | 'warning' | 'info'
 */
const TONES = {
    success: 'alert-success',
    error: 'alert-error',
    warning: 'alert-warning',
    info: 'alert-info',
};

export default function Alert({ tone = 'info', className = '', children, ...props }) {
    return (
        <div className={`alert ${TONES[tone] || TONES.info} ${className}`} {...props}>
            {children}
        </div>
    );
}
