import { useLocation, Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import "./UpgradeConfirm.css";

const PLAN_COLORS = {
    starter: "#2563eb",
    professional: "#7c3aed",
    enterprise: "#d97706",
};

export default function UpgradeSuccess() {
    const location = useLocation();
    const navigate = useNavigate();
    const plan = location.state?.plan || "starter";
    const planDisplay = location.state?.planDisplay || plan;
    const color = PLAN_COLORS[plan] || "#2563eb";

    useEffect(() => {
        document.title = "Upgrade Successful — LoanXAI";
        // Auto-redirect to dashboard after 6 seconds
        const t = setTimeout(() => navigate("/predict"), 6000);
        return () => clearTimeout(t);
    }, [navigate]);

    return (
        <div className="uc-page">
            <div className="us-card">
                <div className="us-icon-wrap" style={{ background: `linear-gradient(135deg, ${color}, ${color}aa)` }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="40" height="40">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                </div>

                <div className="us-confetti">🎉</div>
                <h1 className="us-title">Welcome to {planDisplay}!</h1>
                <p className="us-sub">
                    Your account has been upgraded successfully. All {planDisplay} features are now active.
                </p>

                <div className="us-badge" style={{ background: `${color}18`, color, border: `1px solid ${color}44` }}>
                    ✓ {planDisplay} Plan Active
                </div>

                <div className="us-actions">
                    <Link to="/predict" className="us-btn-primary" style={{ background: `linear-gradient(135deg, ${color}, ${color}bb)` }}>
                        Start Predicting →
                    </Link>
                    <Link to="/pricing" className="us-btn-secondary">View All Plans</Link>
                </div>

                <p className="us-redirect-note">Redirecting to predictions in 6 seconds…</p>
            </div>
        </div>
    );
}
