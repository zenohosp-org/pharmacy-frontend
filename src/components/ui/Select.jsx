/**
 * Reusable select — wraps the shared .form-* classes in components.css.
 */
export default function Select({ label, required = false, error, id, className = '', children, ...props }) {
    return (
        <div className={`form-group ${error ? 'has-error' : ''}`}>
            {label && (
                <label className={`form-label ${required ? 'required' : ''}`} htmlFor={id}>
                    {label}
                </label>
            )}
            <select id={id} className={`form-select ${className}`} {...props}>
                {children}
            </select>
            {error && <span className="form-error">{error}</span>}
        </div>
    );
}
