import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMe } from '../api/pharmacyClient';
import { Shield } from 'lucide-react';

export default function SsoCallback() {
    const { loading, user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [error, setError] = useState('');

    useEffect(() => {
        const errorParam = searchParams.get('error');

        if (errorParam) {
            setError(errorParam === 'sso_failed'
                ? 'SSO login failed. Please try again.'
                : errorParam);
            return;
        }

        if (!loading && user) {
            navigate('/pharmacy/counter-sale', { replace: true });
            return;
        }

        if (!loading && !user) {
            getMe()
                .then(() => {
                    setTimeout(() => {
                        navigate('/pharmacy/counter-sale', { replace: true });
                    }, 500);
                })
                .catch((err) => {
                    console.error('SSO callback validation error:', err);
                    setError('Failed to validate your session. The cookie may have expired.');
                    setTimeout(() => {
                        navigate('/login?error=session_validation_failed', { replace: true });
                    }, 3000);
                });
        }
    }, [searchParams, loading, user, navigate]);

    if (error) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
                <div className="w-full max-w-[440px]">
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600/10 rounded-xl mb-4 border border-red-600/20">
                            <Shield className="w-8 h-8 text-red-500" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">SSO Login Failed</h2>
                        <p className="text-slate-400 mb-6">{error}</p>
                        <button
                            onClick={() => navigate('/login', { replace: true })}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition-all"
                        >
                            Back to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-white font-bold tracking-widest uppercase text-xs animate-pulse">
                    Completing SSO Login...
                </p>
            </div>
        </div>
    );
}
