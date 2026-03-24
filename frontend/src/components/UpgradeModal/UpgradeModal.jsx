import { useNavigate } from 'react-router-dom';
import './UpgradeModal.css';

const PLAN_HIGHLIGHTS = {
    starter: {
        name: 'Starter',
        price: '₹2,999/mo',
        color: '#2563eb',
        icon: '🚀',
        perks: ['200 predictions/month', 'PDF reports', 'Prediction notes', 'Full history'],
    },
    professional: {
        name: 'Professional',
        price: '₹7,999/mo',
        color: '#7c3aed',
        icon: '💼',
        perks: ['2,000 predictions/month', 'PDF + branded reports', 'CSV export', 'Admin dashboard'],
    },
    enterprise: {
        name: 'Enterprise',
        price: '₹24,999/mo',
        color: '#d97706',
        icon: '🏦',
        perks: ['Unlimited predictions', 'White-label PDF', 'CSV + audit exports', 'Dedicated support'],
    },
};

/**
 * UpgradeModal — shown when a feature is blocked by the current plan.
 *
 * Props:
 *   onClose       – () => void
 *   featureName   – string, e.g. "PDF Reports"
 *   requiredPlan  – 'starter' | 'professional' | 'enterprise'
 *   message       – override message (optional)
 */
export default function UpgradeModal({ onClose, featureName = 'This feature', requiredPlan = 'starter', message }) {
    const navigate = useNavigate();

    // Show the required plan and all plans above it
    const planOrder = ['starter', 'professional', 'enterprise'];
    const startIdx = planOrder.indexOf(requiredPlan);
    const showPlans = planOrder.slice(startIdx);

    return (
        <div className="upgrade-modal-overlay" onClick={onClose}>
            <div className="upgrade-modal" onClick={e => e.stopPropagation()}>
                {/* Close */}
                <button className="upgrade-modal-close" onClick={onClose} aria-label="Close">✕</button>

                {/* Header */}
                <div className="upgrade-modal-header">
                    <div className="upgrade-modal-lock">🔒</div>
                    <h2 className="upgrade-modal-title">{featureName} Requires Upgrade</h2>
                    <p className="upgrade-modal-sub">
                        {message || `${featureName} is not available on your current plan. Upgrade to unlock it.`}
                    </p>
                </div>

                {/* Plan cards */}
                <div className="upgrade-modal-plans">
                    {showPlans.map(key => {
                        const p = PLAN_HIGHLIGHTS[key];
                        return (
                            <div
                                key={key}
                                className="upgrade-modal-plan-card"
                                style={{ borderColor: p.color }}
                            >
                                <div className="umpc-top" style={{ background: `${p.color}15` }}>
                                    <span className="umpc-icon">{p.icon}</span>
                                    <div>
                                        <div className="umpc-name" style={{ color: p.color }}>{p.name}</div>
                                        <div className="umpc-price">{p.price}</div>
                                    </div>
                                </div>
                                <ul className="umpc-perks">
                                    {p.perks.map((perk, i) => (
                                        <li key={i}>
                                            <span style={{ color: p.color }}>✓</span> {perk}
                                        </li>
                                    ))}
                                </ul>
                                <button
                                    className="umpc-btn"
                                    style={{ background: `linear-gradient(135deg, ${p.color}, ${p.color}cc)` }}
                                    onClick={() => {
                                        onClose();
                                        navigate('/upgrade-confirm', { state: { plan: key } });
                                    }}
                                >
                                    Upgrade to {p.name}
                                </button>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="upgrade-modal-footer">
                    <button className="upgrade-modal-all-plans" onClick={() => { onClose(); navigate('/pricing'); }}>
                        View All Plans →
                    </button>
                </div>
            </div>
        </div>
    );
}
