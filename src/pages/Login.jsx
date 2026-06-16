import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    Pill,
    Syringe,
    ClipboardList,
    Boxes,
    Truck,
    Activity,
    PackageCheck,
    ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../api/pharmacyClient';
import './Login.css';

// Auto-rotating feature carousel. Inline lucide icons + CSS transitions only —
// no images, no network round-trips, so the panel paints instantly. Slides are
// pharmacy-domain specific (dispensing, stock, prescriptions, reorders).
const SLIDES = [
    {
        title: 'Dispense without misses',
        sub: 'Every counter sale and ward issue, logged down to the batch.',
        Hero: Pill,
        side: [Syringe, ClipboardList, Activity],
        tone: 'is-blue',
    },
    {
        title: 'Stock that knows itself',
        sub: 'Live batch quantities and FEFO picking — zero guesswork.',
        Hero: Boxes,
        side: [PackageCheck, Truck, Activity],
        tone: 'is-green',
    },
    {
        title: 'Prescriptions, scanned and reconciled',
        sub: "Ward dispensing tied straight to the patient's encounter bill.",
        Hero: ClipboardList,
        side: [Pill, Syringe, ShieldCheck],
        tone: 'is-violet',
    },
    {
        title: 'Reorders before the shelf goes empty',
        sub: 'Expiry and reorder alerts surface exactly what needs attention.',
        Hero: Truck,
        side: [Boxes, PackageCheck, ClipboardList],
        tone: 'is-amber',
    },
];

const SLIDE_INTERVAL_MS = 4500;

export default function Login() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user, loading } = useAuth();
    const [slide, setSlide] = useState(0);

    useEffect(() => {
        if (!loading && user) {
            navigate('/pharmacy/counter-sale', { replace: true });
        }
    }, [user, loading, navigate]);

    useEffect(() => {
        const id = setInterval(
            () => setSlide((s) => (s + 1) % SLIDES.length),
            SLIDE_INTERVAL_MS
        );
        return () => clearInterval(id);
    }, []);

    const handleLoginClick = () => {
        window.location.href = `${API_BASE_URL}/oauth2/authorization/directory`;
    };

    const error = searchParams.get('error') ? (searchParams.get('error_description') || 'SSO login failed.') : null;

    if (searchParams.get('code')) {
        return (
            <div className="pharmacy-login__loading">
                <div className="pharmacy-login__loading-inner">
                    <div className="pharmacy-login__spinner" />
                    <p className="pharmacy-login__loading-text">Completing SSO Login...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="pharmacy-login">
            {/* Left — Sign in */}
            <div className="pharmacy-login__form-pane">
                <div className="pharmacy-login__form-inner">
                    <div className="pharmacy-login__brand">
                        <div className="pharmacy-login__brand-icon">
                            <Pill size={20} />
                        </div>
                        <div>
                            <h1 className="pharmacy-login__brand-title">ZenoHosp</h1>
                            <p className="pharmacy-login__brand-sub">Pharmacy</p>
                        </div>
                    </div>

                    <div className="pharmacy-login__heading">
                        <h2>Sign in</h2>
                        <p>to access Pharmacy Management</p>
                    </div>

                    {error && <div className="pharmacy-login__alert is-danger">{error}</div>}

                    <button
                        type="button"
                        onClick={handleLoginClick}
                        className="pharmacy-login__sso-btn"
                    >
                        <ShieldCheck size={20} />
                        Continue with ZenoHosp SSO
                    </button>

                    <p className="pharmacy-login__terms">
                        By logging in, you agree to our Terms of Service and Privacy Policy.
                        Auth tokens are fully encrypted via Identity Directory.
                    </p>
                </div>
            </div>

            {/* Right — Auto-rotating feature panel */}
            <div className="pharmacy-login__visual">
                <div className="pharmacy-login__carousel">
                    {SLIDES.map((s, i) => {
                        const Hero = s.Hero;
                        return (
                            <div
                                key={i}
                                className={`pharmacy-login__slide ${s.tone}${i === slide ? ' is-active' : ''}`}
                                aria-hidden={i !== slide}
                            >
                                <div className="pharmacy-login__slide-stage">
                                    <div className="pharmacy-login__slide-hero">
                                        <Hero size={56} strokeWidth={1.6} />
                                    </div>
                                    {s.side.map((Icon, idx) => (
                                        <div
                                            key={idx}
                                            className={`pharmacy-login__slide-orb is-orb-${idx + 1}`}
                                        >
                                            <Icon size={18} strokeWidth={1.8} />
                                        </div>
                                    ))}
                                </div>
                                <div className="pharmacy-login__slide-caption">
                                    <h3>{s.title}</h3>
                                    <p>{s.sub}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="pharmacy-login__dots">
                    {SLIDES.map((_, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => setSlide(i)}
                            className={`pharmacy-login__dot${i === slide ? ' is-active' : ''}`}
                            aria-label={`Slide ${i + 1}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
