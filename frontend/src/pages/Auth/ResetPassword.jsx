import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import './Auth.css';

function PasswordBar({ password }) {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    const labels = ['Too weak', 'Weak', 'Fair', 'Good'];
    const colors = ['#ef4444', '#f59e0b', '#eab308', '#10b981'];
    const s = Math.min(score, 3);
    return password ? (
        <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                {[0, 1, 2, 3].map(i => (
                    <div key={i} style={{
                        flex: 1, height: 4, borderRadius: 99,
                        background: i <= s ? colors[s] : 'var(--border, #e2e8f0)', transition: 'background 0.25s'
                    }} />
                ))}
            </div>
            <div style={{ fontSize: '0.78rem', color: colors[s], fontWeight: 600 }}>{labels[s]}</div>
        </div>
    ) : null;
}

export default function ResetPassword() {
    const [params] = useSearchParams();
    const token = params.get('token') || '';
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async e => {
        e.preventDefault();
        setError('');
        if (password !== confirm) { setError('Passwords do not match.'); return; }
        if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
        if (!/[A-Z]/.test(password)) { setError('Password must contain at least one uppercase letter.'); return; }
        if (!/[0-9]/.test(password)) { setError('Password must contain at least one number.'); return; }
        setLoading(true);
        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Reset failed');
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
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
                            <circle cx="18" cy="18" r="18" fill="url(#rplg)" />
                            <path d="M10 24l8-12 8 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="18" cy="14" r="2.5" fill="white" />
                            <defs><linearGradient id="rplg" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                                <stop stopColor="#1a56e8" /><stop offset="1" stopColor="#7c3aed" />
                            </linearGradient></defs>
                        </svg>
                    </div>
                    <span className="auth-logo__text">LoanXAI</span>
                </Link>

                {success ? (
                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                        <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
                        <h2 style={{ color: '#10b981', fontWeight: 800, marginBottom: 10 }}>Password Reset!</h2>
                        <p style={{ color: 'var(--text-secondary, #64748b)' }}>
                            Your password has been changed. Redirecting to login…
                        </p>
                    </div>
                ) : (
                    <>
                        {!token && (
                            <div className="auth-error">
                                Invalid or missing reset token. Please request a new password reset link.
                            </div>
                        )}
                        <h1 className="auth-title">Set New Password</h1>
                        <p className="auth-sub">Choose a strong password for your account</p>

                        {error && <div className="auth-error">{error}</div>}

                        <form onSubmit={handleSubmit} className="auth-form">
                            <div className="auth-field">
                                <label htmlFor="rp-password">New Password</label>
                                <input id="rp-password" type="password" placeholder="Min. 8 chars, 1 uppercase, 1 number"
                                    value={password} onChange={e => setPassword(e.target.value)} required />
                                <PasswordBar password={password} />
                            </div>
                            <div className="auth-field">
                                <label htmlFor="rp-confirm">Confirm New Password</label>
                                <input id="rp-confirm" type="password" placeholder="Repeat password"
                                    value={confirm} onChange={e => setConfirm(e.target.value)} required />
                                {confirm && password !== confirm && (
                                    <div style={{ fontSize: '0.78rem', color: '#ef4444', marginTop: 4 }}>Passwords do not match</div>
                                )}
                            </div>
                            <button type="submit" className="auth-submit-btn" disabled={loading || !token} id="reset-password-btn">
                                {loading ? <><span className="spinner" />&nbsp;Resetting...</> : 'Reset Password'}
                            </button>
                        </form>

                        <p className="auth-switch"><Link to="/login">← Back to login</Link></p>
                    </>
                )}
            </div>
        </div>
    );
}
