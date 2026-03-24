import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

// Password strength: returns { score 0-4, label, color }
function getPasswordStrength(pw) {
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    const labels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['#ef4444', '#f59e0b', '#eab308', '#10b981', '#2563eb'];
    return { score: Math.min(score, 4), label: labels[Math.min(score, 4)], color: colors[Math.min(score, 4)] };
}

export default function Register() {
    const [form, setForm] = useState({
        full_name: '', username: '', email: '', password: '', confirm: '', role: 'banker', admin_secret_key: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const pwStrength = getPasswordStrength(form.password);

    const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

    const handleSubmit = async e => {
        e.preventDefault();
        setError('');
        if (form.password !== form.confirm) {
            setError('Passwords do not match.'); return;
        }
        if (form.password.length < 8) {
            setError('Password must be at least 8 characters.'); return;
        }
        if (!/[A-Z]/.test(form.password)) {
            setError('Password must contain at least one uppercase letter.'); return;
        }
        if (!/[0-9]/.test(form.password)) {
            setError('Password must contain at least one number.'); return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    full_name: form.full_name, username: form.username,
                    email: form.email, password: form.password, role: form.role,
                    admin_secret_key: form.admin_secret_key,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Registration failed');
            login(data.token, data.user);
            navigate('/predict', { replace: true });
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

            <div className="auth-card auth-card--wide">
                <Link to="/" className="auth-logo">
                    <div className="auth-logo__icon">
                        <svg viewBox="0 0 36 36" fill="none">
                            <circle cx="18" cy="18" r="18" fill="url(#rlg1)" />
                            <path d="M10 24l8-12 8 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="18" cy="14" r="2.5" fill="white" />
                            <defs>
                                <linearGradient id="rlg1" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#1a56e8" /><stop offset="1" stopColor="#7c3aed" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                    <span className="auth-logo__text">LoanXAI</span>
                </Link>

                <h1 className="auth-title">Create your account</h1>
                <p className="auth-sub">Banking portal for loan risk assessment</p>

                {error && (
                    <div className="auth-error">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16, flexShrink: 0 }}>
                            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form" noValidate>
                    <div className="auth-form-grid">
                        <div className="auth-field">
                            <label htmlFor="full_name">Full Name</label>
                            <input id="full_name" name="full_name" type="text"
                                placeholder="e.g. Rahul Sharma" value={form.full_name}
                                onChange={handleChange} required />
                        </div>
                        <div className="auth-field">
                            <label htmlFor="username">Username</label>
                            <input id="username" name="username" type="text"
                                placeholder="e.g. rahul_sbi" value={form.username}
                                onChange={handleChange} required />
                        </div>
                        <div className="auth-field auth-field--full">
                            <label htmlFor="reg-email">Work Email</label>
                            <input id="reg-email" name="email" type="email"
                                placeholder="you@yourbank.com" value={form.email}
                                onChange={handleChange} required />
                        </div>
                        <div className="auth-field">
                            <label htmlFor="reg-password">Password</label>
                            <input id="reg-password" name="password" type="password"
                                placeholder="Min. 8 chars, 1 uppercase, 1 number" value={form.password}
                                onChange={handleChange} required />
                            {/* Password strength meter */}
                            {form.password && (
                                <div style={{ marginTop: 8 }}>
                                    <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                                        {[0, 1, 2, 3].map(i => (
                                            <div key={i} style={{
                                                flex: 1, height: 4, borderRadius: 99,
                                                background: i < pwStrength.score ? pwStrength.color : 'var(--border, #e2e8f0)',
                                                transition: 'background 0.25s'
                                            }} />
                                        ))}
                                    </div>
                                    <div style={{ fontSize: '0.78rem', color: pwStrength.color, fontWeight: 600 }}>
                                        {pwStrength.label}
                                        {pwStrength.score < 2 && <span style={{ color: 'var(--text-secondary, #64748b)', fontWeight: 400 }}>
                                            {' '}— add uppercase letters, numbers & symbols
                                        </span>}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="auth-field">
                            <label htmlFor="confirm">Confirm Password</label>
                            <input id="confirm" name="confirm" type="password"
                                placeholder="Repeat password" value={form.confirm}
                                onChange={handleChange} required />
                            {form.confirm && form.password !== form.confirm && (
                                <div style={{ fontSize: '0.78rem', color: '#ef4444', marginTop: 4 }}>Passwords do not match</div>
                            )}
                        </div>
                        <div className="auth-field auth-field--full">
                            <label htmlFor="role">Role</label>
                            <select id="role" name="role" value={form.role} onChange={handleChange}>
                                <option value="banker">Loan Officer / Banker</option>
                                <option value="admin">Admin</option>
                                <option value="loan_officer">Risk Analyst</option>
                            </select>
                        </div>
                        {form.role === 'admin' && (
                            <div className="auth-field auth-field--full">
                                <label htmlFor="admin_secret_key">Admin Secret Key</label>
                                <input id="admin_secret_key" name="admin_secret_key" type="password"
                                    placeholder="Enter admin secret key" value={form.admin_secret_key}
                                    onChange={handleChange} />
                            </div>
                        )}
                    </div>

                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #64748b)', marginBottom: 16, padding: '10px 14px', background: 'var(--bg-input, #f8faff)', borderRadius: 8 }}>
                        Password must be: 8+ characters • at least 1 uppercase • at least 1 number
                    </div>

                    <button type="submit" className="auth-submit-btn" disabled={loading} id="register-submit-btn">
                        {loading ? <><span className="spinner" />&nbsp;Creating account...</> : 'Create Account'}
                    </button>
                </form>

                <p className="auth-switch">
                    Already have an account? <Link to="/login">Sign in</Link>
                </p>
            </div>
        </div>
    );
}
