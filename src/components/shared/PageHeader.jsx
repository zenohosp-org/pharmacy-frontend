import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import './PageHeader.css';

/**
 * Reusable page header — title + optional subtitle on the left, actions on
 * the right. Sits inside the padded .main-content (no full-bleed strip).
 * backTo: when set, renders a "← Back" link above the title.
 */
export default function PageHeader({ title, subtitle, actions, backTo, backLabel = 'Back' }) {
    return (
        <div className="page-head">
            <div>
                {backTo && (
                    <Link to={backTo} className="page-head-back">
                        <ArrowLeft size={15} />
                        {backLabel}
                    </Link>
                )}
                <h1 className="page-head-title">{title}</h1>
                {subtitle && <p className="page-head-subtitle">{subtitle}</p>}
            </div>
            {actions && <div className="page-head-actions">{actions}</div>}
        </div>
    );
}
