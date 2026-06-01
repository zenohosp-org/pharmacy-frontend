/**
 * Reusable text input — wraps the shared .form-* classes in components.css.
 */
export default function Input({ label, required = false, error, id, className = '', ...props }) {
    return (
        <div className={`form-group ${error ? 'has-error' : ''}`}>
            {label && (
                <label className={`form-label ${required ? 'required' : ''}`} htmlFor={id}>
                    {label}
                </label>
            )}
            <input id={id} className={`form-input ${className}`} {...props} />
            {error && <span className="form-error">{error}</span>}
        </div>
    );
}
