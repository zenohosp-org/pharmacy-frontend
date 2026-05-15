import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, ShoppingCart, History,
    LogOut, ChevronDown, ChevronRight, Pill, Inbox, FileText,
    Menu as MenuIcon, X as XIcon
} from 'lucide-react';

export default function Layout({ children }) {
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [reportsOpen, setReportsOpen] = useState(
        ['/pharmacy/sales-ledger', '/pharmacy/reports'].includes(location.pathname)
    );

    const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

    const NavLink = ({ to, icon: Icon, label }) => (
        <Link
            to={to}
            className={`sidebar-link sidebar-submenu-link ${isActive(to) ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
        >
            <Icon className="sidebar-icon" size={15} />
            {label}
        </Link>
    );

    const CollapseToggle = ({ open, onToggle, icon: Icon, label }) => (
        <button onClick={onToggle} className="sidebar-link sidebar-submenu-toggle">
            <div className="sidebar-submenu-inner">
                <Icon className="sidebar-icon" size={18} />
                {label}
            </div>
            {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </button>
    );

    return (
        <div className="app-layout">
            {/* Mobile Header */}
            <header className="app-header">
                <div className="app-logo">
                    <Pill size={22} />
                    <span>ZenoPharmacy</span>
                </div>
                <div className="header-right">
                    <div className="user-menu">
                        <span className="header-welcome">Pharmacy</span>
                    </div>
                    <button className="btn btn-icon btn-ghost" onClick={() => setSidebarOpen(!sidebarOpen)}>
                        {sidebarOpen ? <XIcon size={18} /> : <MenuIcon size={18} />}
                    </button>
                </div>
            </header>

            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'mobile-open' : ''}`}>
                <div className="sidebar-brand">
                    <Pill size={20} className="sidebar-brand-icon" />
                    <span className="sidebar-brand-text">ZenoPharmacy</span>
                </div>

                <nav className="sidebar-nav">
                    <ul className="sidebar-menu">
                        {/* Counter Sale */}
                        <li>
                            <Link
                                to="/pharmacy/counter-sale"
                                className={`sidebar-link ${isActive('/pharmacy/counter-sale') ? 'active' : ''}`}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <ShoppingCart className="sidebar-icon" size={18} />
                                Counter Sale
                            </Link>
                        </li>

                        {/* Dispensing (IPD) — directly below Counter Sale */}
                        <li>
                            <Link
                                to="/pharmacy/dispensing"
                                className={`sidebar-link ${isActive('/pharmacy/dispensing') ? 'active' : ''}`}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <Pill className="sidebar-icon" size={18} />
                                Dispensing
                            </Link>
                        </li>

                        {/* Stock Dashboard */}
                        <li>
                            <Link
                                to="/pharmacy/stock"
                                className={`sidebar-link ${isActive('/pharmacy/stock') && !location.pathname.includes('/receive') ? 'active' : ''}`}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <LayoutDashboard className="sidebar-icon" size={18} />
                                Stock Dashboard
                            </Link>
                        </li>

                        {/* Stock Receive */}
                        <li>
                            <Link
                                to="/pharmacy/stock/receive"
                                className={`sidebar-link ${isActive('/pharmacy/stock/receive') ? 'active' : ''}`}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <Inbox className="sidebar-icon" size={18} />
                                Receive Stock
                            </Link>
                        </li>

                        {/* Reports & Ledger Section */}
                        <li className="sidebar-section">
                            <div className="sidebar-section-title">Reports</div>

                            <div className="sidebar-subsection">
                                <CollapseToggle
                                    open={reportsOpen}
                                    onToggle={() => setReportsOpen(o => !o)}
                                    icon={FileText}
                                    label="Ledger & Reports"
                                />
                                {reportsOpen && (
                                    <div className="sidebar-submenu">
                                        <NavLink to="/pharmacy/sales-ledger" icon={History} label="Sales Ledger" />
                                        <NavLink to="/pharmacy/reports" icon={FileText} label="Reports" />
                                    </div>
                                )}
                            </div>
                        </li>
                    </ul>
                </nav>

                <div className="sidebar-footer">
                    <button onClick={() => console.log('logout')} className="btn btn-sm sidebar-footer-signout">
                        <LogOut size={14} />
                        Sign Out
                    </button>
                    <div className="sidebar-copyright">© 2026 Pharmacy Manager</div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                {children}
            </main>
        </div>
    );
}
