/**
 * Reusable button — wraps the shared .btn classes in components.css.
 * variant: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost'
 * size: 'sm' (optional)
 * block: full width (optional)
 */
export default function Button({
    variant = 'primary',
    size,
    block = false,
    className = '',
    children,
    ...props
}) {
    const classes = [
        'btn',
        `btn-${variant}`,
        size === 'sm' ? 'btn-sm' : '',
        block ? 'btn-block' : '',
        className,
    ].filter(Boolean).join(' ');

    return (
        <button className={classes} {...props}>
            {children}
        </button>
    );
}
