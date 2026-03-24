import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

export default function Login() {
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || '/predict';

    const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

    const handleSubmit = async e => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Login failed');

            // 2FA: user has OTP enabled — redirect to OTP page
            if (data.needs_otp) {
                navigate(`/verify-otp?email=${encodeURIComponent(data.email)}`);
                return;
            }

            login(data.token, data.user);
            navigate(from, { replace: true });
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
                {/* Logo */}
                <Link to="/" className="auth-logo">
                    <div className="auth-logo__icon">
                        <svg viewBox="0 0 36 36" fill="none">
                            <circle cx="18" cy="18" r="18" fill="url(#alg1)" />
                            <path d="M10 24l8-12 8 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="18" cy="14" r="2.5" fill="white" />
                            <defs>
                                <linearGradient id="alg1" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#1a56e8" /><stop offset="1" stopColor="#7c3aed" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                    <span className="auth-logo__text">LoanXAI</span>
                </Link>

                <h1 className="auth-title">Welcome back</h1>
                <p className="auth-sub">Sign in to your banking portal</p>

                {error && (
                    <div className="auth-error">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16, flexShrink: 0 }}>
                            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form" noValidate>
                    <div className="auth-field">
                        <label htmlFor="email">Email Address</label>
                        <input
                            id="email" name="email" type="email" autoComplete="email"
                            placeholder="you@bank.com"
                            value={form.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="auth-field">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password" name="password" type="password" autoComplete="current-password"
                            placeholder="Enter your password"
                            value={form.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button type="submit" className="auth-submit-btn" disabled={loading} id="login-submit-btn">
                        {loading ? <><span className="spinner" />&nbsp;Signing in...</> : 'Sign In'}
                    </button>
                </form>

                <p className="auth-switch">
                    Don't have an account? <Link to="/register">Create one</Link>
                </p>
                <p className="auth-switch" style={{ marginTop: 8 }}>
                    <Link to="/forgot-password" style={{ color: '#94a3b8', fontSize: '0.82rem' }}>Forgot your password?</Link>
                </p>

                {/* Demo hint */}
                <div className="auth-demo-hint">
                    <p><strong>Demo:</strong> Register a new account to get started. All predictions will be saved to your personal history.</p>
                </div>
            </div>
        </div>
    );
}
