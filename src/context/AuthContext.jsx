import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getMe, logout as apiLogout } from '../api/pharmacyClient';

const AuthContext = createContext(null);
const LOGOUT_FLAG_KEY = 'pharmacy_logout_in_progress';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (import.meta.env.VITE_DEV_MOCK_AUTH === 'true') {
            setUser({
                userId: import.meta.env.VITE_MOCK_USER_ID || '1',
                email: import.meta.env.VITE_MOCK_USER_EMAIL || 'dev@zenohosp.com',
                role: import.meta.env.VITE_MOCK_USER_ROLE || 'super_admin',
                hospitalId: import.meta.env.VITE_MOCK_HOSPITAL_ID || '1',
                modules: [],
            });
            setLoading(false);
            return;
        }

        const logoutInProgress = localStorage.getItem(LOGOUT_FLAG_KEY);
        if (logoutInProgress) {
            sessionStorage.removeItem('pharmacy_user');
            setUser(null);
            setLoading(false);
            localStorage.removeItem(LOGOUT_FLAG_KEY);
            return;
        }

        getMe()
            .then((res) => {
                const userData = res.data.data || res.data;
                sessionStorage.setItem('pharmacy_user', JSON.stringify(userData));
                setUser(userData);
            })
            .catch(() => {
                sessionStorage.removeItem('pharmacy_user');
                setUser(null);
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        const verifyOnFocus = async () => {
            if (!user) return;
            if (import.meta.env.VITE_DEV_MOCK_AUTH === 'true') return;
            try {
                await getMe();
            } catch (err) {
                sessionStorage.removeItem('pharmacy_user');
                setUser(null);
                window.location.href = '/login?logged_out=1';
            }
        };

        window.addEventListener('focus', verifyOnFocus);
        return () => window.removeEventListener('focus', verifyOnFocus);
    }, [user]);

    useEffect(() => {
        const handleStorageChange = (event) => {
            if (event.key === 'sso-logout') {
                sessionStorage.removeItem('pharmacy_user');
                setUser(null);
                window.location.href = '/login?logged_out=1';
            }
        };

        const handleCustomLogoutEvent = (event) => {
            sessionStorage.removeItem('pharmacy_user');
            setUser(null);
            window.location.href = '/login?logged_out=1';
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('sso-logout', handleCustomLogoutEvent);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('sso-logout', handleCustomLogoutEvent);
        };
    }, []);

    const logout = useCallback(async () => {
        localStorage.setItem(LOGOUT_FLAG_KEY, '1');
        sessionStorage.removeItem('pharmacy_user');
        setUser(null);

        try {
            localStorage.setItem('sso-logout', `${Date.now()}`);
        } catch (e) {
            console.warn('Failed to broadcast logout:', e);
        }

        try {
            await apiLogout();
        } catch (e) {
            console.warn('Logout API call failed:', e);
        }

        window.location.href = '/login?logged_out=1';
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
