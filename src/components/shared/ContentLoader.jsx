import './ContentLoader.css';

/**
 * Loading spinner for the content area only — keeps header + sidebar fixed.
 * fullscreen: center within the viewport (used for the top-level Suspense
 *             fallback on routes that render outside the layout shell).
 */
export default function ContentLoader({ label = 'Loading…', fullscreen = false }) {
    return (
        <div className={`content-loader ${fullscreen ? 'content-loader--fullscreen' : ''}`}>
            <div className="content-loader-spinner" />
            {label && <p className="content-loader-label">{label}</p>}
        </div>
    );
}
