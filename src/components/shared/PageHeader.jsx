import './PageHeader.css';

/**
 * Reusable page header — title + optional subtitle on the left, actions on
 * the right. Sits inside the padded .main-content (no full-bleed strip).
 */
export default function PageHeader({ title, subtitle, actions }) {
    return (
        <div className="page-head">
            <div>
                <h1 className="page-head-title">{title}</h1>
                {subtitle && <p className="page-head-subtitle">{subtitle}</p>}
            </div>
            {actions && <div className="page-head-actions">{actions}</div>}
        </div>
    );
}
