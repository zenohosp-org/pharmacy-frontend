import { LogOut, PanelLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/header.css';

export default function Header({ onToggleSidebar }) {
    const { user, logout } = useAuth();

    const displayName = user?.email || 'User';
    const initials = (user?.email?.[0] || 'U').toUpperCase();

    return (
        <header className="ph-header">
            {onToggleSidebar && (
                <button
                    onClick={onToggleSidebar}
                    className="ph-header-burger"
                    aria-label="Toggle sidebar"
                    title="Toggle sidebar"
                >
                    <PanelLeft size={18} />
                </button>
            )}
            <span className="ph-header-title">Pharmacy Management</span>

            <div className="ph-header-right">
                <div className="ph-header-divider" />

                <div className="ph-header-user">
                    <div className="ph-header-avatar">{initials}</div>
                    <div className="ph-header-name-group">
                        <span className="ph-header-name">{displayName}</span>
                        {user?.role && <span className="ph-header-role">{user.role}</span>}
                    </div>
                    <button
                        onClick={logout}
                        title="Logout"
                        className="ph-header-logout-btn"
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </header>
    );
}
