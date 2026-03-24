import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

export default function OtpVerify() {
    const [params] = useSearchParams();
    const email = params.get('email') || '';
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendIn, setResendIn] = useState(60);
    const { login } = useAuth();
    const navigate = useNavigate();

    // Countdown for resend button
    useEffect(() => {
        if (resendIn <= 0) return;
        const t = setTimeout(() => setResendIn(r => r - 1), 1000);
        return () => clearTimeout(t);
    }, [resendIn]);

    const handleVerify = async e => {
        e.preventDefault();
        setError(''); setInfo('');
        if (otp.length !== 6) { setError('Please enter the 6-digit OTP.'); return; }
        setLoading(true);
        try {
            const res = await fetch('/api/auth/otp/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp, purpose: 'login' }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'OTP verification failed');
            login(data.token, data.user);
            navigate('/predict', { replace: true });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setResendIn(60); setError(''); setInfo('');
        try {
            await fetch('/api/auth/otp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, purpose: 'login' }),
            });
            setInfo('New OTP sent to your email.');
        } catch {
            setError('Failed to resend OTP. Please try again.');
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-bg">
                <div className="auth-bg__glow" />
                <div className="auth-bg__glow auth-bg__glow--2" />
            </div>

            <div className="auth-card">
                <Link to="/" className="auth-logo">
                    <div className="auth-logo__icon">
                        <svg viewBox="0 0 36 36" fill="none">
                            <circle cx="18" cy="18" r="18" fill="url(#otplg)" />
                            <path d="M10 24l8-12 8 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="18" cy="14" r="2.5" fill="white" />
                            <defs><linearGradient id="otplg" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                                <stop stopColor="#1a56e8" /><stop offset="1" stopColor="#7c3aed" />
                            </linearGradient></defs>
                        </svg>
                    </div>
                    <span className="auth-logo__text">LoanXAI</span>
                </Link>

                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
                    <h1 className="auth-title" style={{ marginBottom: 8 }}>Two-Factor Verification</h1>
                    <p className="auth-sub">
                        Enter the 6-digit OTP sent to<br />
                        <strong>{email || 'your email'}</strong>
                    </p>
                </div>

                {error && <div className="auth-error">{error}</div>}
                {info && <div style={{ background: '#dcfce7', color: '#166534', padding: '12px 16px', borderRadius: 10, marginBottom: 16, fontSize: '0.9rem' }}>{info}</div>}

                <form onSubmit={handleVerify} className="auth-form">
                    <div className="auth-field">
                        <label htmlFor="otp">One-Time Password</label>
                        <input
                            id="otp"
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            pattern="[0-9]{6}"
                            placeholder="• • • • • •"
                            value={otp}
                            onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            required
                            autoFocus
                            style={{ fontSize: '1.5rem', letterSpacing: 12, textAlign: 'center', fontWeight: 700 }}
                        />
                    </div>

                    <button type="submit" className="auth-submit-btn" disabled={loading} id="otp-verify-btn">
                        {loading ? <><span className="spinner" />&nbsp;Verifying...</> : 'Verify OTP →'}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: 20, fontSize: '0.88rem', color: 'var(--text-secondary, #64748b)' }}>
                    Didn't receive it?{' '}
                    {resendIn > 0
                        ? <span>Resend in {resendIn}s</span>
                        : <button onClick={handleResend} style={{ background: 'none', border: 'none', color: '#1a56e8', cursor: 'pointer', fontWeight: 600, fontSize: 'inherit' }}>Resend OTP</button>
                    }
                </div>

                <p className="auth-switch"><Link to="/login">← Back to login</Link></p>
            </div>
        </div>
    );
}
