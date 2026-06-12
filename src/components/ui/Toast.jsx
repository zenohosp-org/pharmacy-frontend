import { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import './Toast.css';

const ToastContext = createContext(() => {});

export const useToast = () => useContext(ToastContext);

const ICONS = { success: CheckCircle2, error: AlertCircle, info: Info };

let seq = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => setToasts(t => t.filter(x => x.id !== id)), []);

  const toast = useCallback((message, tone = 'success', ttl = 3800) => {
    const id = ++seq;
    setToasts(t => [...t, { id, message, tone }]);
    setTimeout(() => remove(id), ttl);
  }, [remove]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {createPortal(
        <div className="toast-stack">
          {toasts.map(({ id, message, tone }) => {
            const Icon = ICONS[tone] || Info;
            return (
              <div key={id} className={`toast toast--${tone}`} role="status">
                <Icon size={18} className="toast-icon" />
                <span className="toast-msg">{message}</span>
                <button className="toast-close" onClick={() => remove(id)} aria-label="Dismiss"><X size={14} /></button>
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}
