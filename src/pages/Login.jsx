import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../api/pharmacyClient';
import './Login.css';

export default function Login() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading && user) {
            navigate('/pharmacy/counter-sale', { replace: true });
        }
    }, [user, loading, navigate]);

    const handleLoginClick = () => {
        window.location.href = `${API_BASE_URL}/oauth2/authorization/directory`;
    };

    const error = searchParams.get('error') ? (searchParams.get('error_description') || 'SSO login failed.') : null;

    if (searchParams.get('code')) {
        return (
            <div className="login-loading">
                <div className="text-center">
                    <div className="login-spinner" />
                    <p className="login-loading-text">Completing SSO Login...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="login-page">
            <div className="login-left">
                <div className="login-badge">
                    <span className="login-badge-text">ZenoHosp Enterprise OS</span>
                </div>

                <h1 className="login-title">Pharmacy<br />Management</h1>

                <p className="login-subtitle">
                    Streamline drug inventory, track stock, manage dispensing, and maintain compliance powered by ZenoHosp's integrated security directory.
                </p>

                <div className="login-features">
                    <div className="login-feature">
                        <span className="login-feature-check">✓</span>
                        <span>Real-time stock tracking</span>
                    </div>
                    <div className="login-feature">
                        <span className="login-feature-check">✓</span>
                        <span>Expiry and reorder alerts</span>
                    </div>
                    <div className="login-feature">
                        <span className="login-feature-check">✓</span>
                        <span>Seamless global SSO authentication</span>
                    </div>
                </div>
            </div>

            <div className="login-right">
                <div className="login-card">
                    <div className="login-card-accent" />

                    <div className="login-card-head">
                        <div className="login-logo">
                            <span className="login-logo-emoji">💊</span>
                        </div>
                        <h2 className="login-card-title">Welcome Back</h2>
                        <p className="login-card-sub">Please sign in to your pharmacy management system</p>
                    </div>

                    {error && <div className="login-error">{error}</div>}

                    <div>
                        <button onClick={handleLoginClick} className="login-sso-btn">
                            <span className="login-sso-emoji">🌐</span>
                            Continue with ZenoHosp SSO
                        </button>

                        <p className="login-terms">
                            By logging in, you agree to our Terms of Service and Privacy Policy. Auth tokens are fully encrypted via Identity Directory.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
