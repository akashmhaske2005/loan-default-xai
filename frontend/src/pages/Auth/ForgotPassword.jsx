import { useState } from 'react';
import { Link } from 'react-router-dom';
import './ForgotPassword.css';

export default function ForgotPassword() {
    const [step, setStep] = useState('email');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) { setError('Please enter your email.'); return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Please enter a valid email address.'); return; }
        setLoading(true); setError('');
        await new Promise(r => setTimeout(r, 1000));
        setStep('sent');
        setLoading(false);
    };

    return (
        <div className="fp-page">
            {/* Left panel — brand */}
            <div className="fp-left">
                <div className="fp-left-content">
                    <div className="fp-brand">
                        <svg viewBox="0 0 36 36" fill="none" width="40" height="40">
                            <circle cx="18" cy="18" r="18" fill="url(#fpg)" />
                            <path d="M10 24l8-12 8 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="18" cy="14" r="2.5" fill="white" />
                            <defs>
                                <linearGradient id="fpg" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#60a5fa" /><stop offset="1" stopColor="#a78bfa" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <span className="fp-brand-name">LoanXAI</span>
                    </div>

                    <div className="fp-left-text">
                        <h2>Account Recovery</h2>
                        <p>Don't worry — happens to everyone. We'll help you get back in securely.</p>
                    </div>

                    <div className="fp-steps">
                        {[
                            { icon: "📧", label: "Enter your email" },
                            { icon: "🔗", label: "Receive reset link" },
                            { icon: "🔑", label: "Set new password" },
                        ].map((s, i) => (
                            <div className="fp-step" key={i}>
                                <div className="fp-step-icon">{s.icon}</div>
                                <span>{s.label}</span>
                            </div>
                        ))}
                    </div>

                    <div className="fp-left-orbs">
                        <div className="fp-orb fp-orb--1" />
                        <div className="fp-orb fp-orb--2" />
                    </div>
                </div>
            </div>

            {/* Right panel — form */}
            <div className="fp-right">
                <div className="fp-form-wrap">
                    {step === 'email' ? (
                        <>
                            <div className="fp-icon-wrap">
                                <div className="fp-icon-circle">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="26" height="26">
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                        <polyline points="22,6 12,13 2,6" />
                                    </svg>
                                </div>
                            </div>

                            <h1 className="fp-title">Forgot Password?</h1>
                            <p className="fp-subtitle">Enter your registered email and we'll send you secure reset instructions.</p>

                            {error && <div className="fp-error">{error}</div>}

                            <form onSubmit={handleSubmit} className="fp-form">
                                <div className="fp-field">
                                    <label htmlFor="fp-email">Work Email</label>
                                    <div className="fp-input-wrap">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="fp-input-icon">
                                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                            <polyline points="22,6 12,13 2,6" />
                                        </svg>
                                        <input
                                            id="fp-email"
                                            type="email"
                                            placeholder="officer@bank.com"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            autoFocus
                                            className="fp-input"
                                        />
                                    </div>
                                </div>

                                <button type="submit" className="fp-btn" disabled={loading}>
                                    {loading ? <><span className="fp-spinner" /> Sending…</> : 'Send Reset Instructions'}
                                </button>
                            </form>

                            <p className="fp-note">
                                ⓘ Email server not configured? Contact your system admin to reset your password manually.
                            </p>
                        </>
                    ) : (
                        <div className="fp-success">
                            <div className="fp-success-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="32" height="32">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                    <polyline points="22 4 12 14.01 9 11.01" />
                                </svg>
                            </div>
                            <h2 className="fp-success-title">Check Your Inbox!</h2>
                            <p className="fp-success-sub">
                                If <strong>{email}</strong> is registered, reset instructions will arrive shortly.<br />
                                Don't forget to check your spam folder.
                            </p>
                            <div className="fp-success-info">
                                ⓘ Development mode: No email server configured. Contact your system admin to reset.
                            </div>
                            <button onClick={() => setStep('email')} className="fp-btn fp-btn--outline">
                                Try a different email
                            </button>
                        </div>
                    )}

                    <p className="fp-back-link">
                        Remembered it? <Link to="/login">Back to Sign In</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
