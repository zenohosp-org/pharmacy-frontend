import { useEffect } from 'react';

/**
 * Reusable modal — wraps the shared .modal classes in components.css.
 * open: controls visibility
 * onClose: called on overlay click, close button, or Escape
 * title: header text
 * footer: optional footer node (e.g. action buttons)
 */
export default function Modal({ open, onClose, title, footer, children }) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            className="modal-overlay active"
            onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
        >
            <div className="modal">
                <div className="modal-header">
                    <h3 className="modal-title">{title}</h3>
                    <button className="modal-close" onClick={onClose} aria-label="Close">&times;</button>
                </div>
                <div className="modal-body">{children}</div>
                {footer && <div className="modal-footer">{footer}</div>}
            </div>
        </div>
    );
}
