/**
 * Reusable card — wraps the shared .card classes in components.css.
 * title / action: render a .card-header row when provided.
 * padded: wrap children in .card-body (default true). Set false when the
 *         child manages its own padding (e.g. a full-bleed table).
 */
export default function Card({
    title,
    action,
    elevated = true,
    padded = true,
    className = '',
    children,
    ...props
}) {
    const classes = ['card', elevated ? 'card-elevated' : '', className].filter(Boolean).join(' ');

    return (
        <div className={classes} {...props}>
            {(title || action) && (
                <div className="card-header flex-between">
                    {title && <h3 className="card-title">{title}</h3>}
                    {action}
                </div>
            )}
            {padded ? <div className="card-body">{children}</div> : children}
        </div>
    );
}
