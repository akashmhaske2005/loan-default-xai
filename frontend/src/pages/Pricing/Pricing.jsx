import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/Navbar/Navbar";
import "./Pricing.css";

const PLANS = [
    {
        name: "free",
        display: "Free",
        price: 0,
        subtitle: "Get started, no card needed",
        gradient: "linear-gradient(135deg,#475569,#334155)",
        icon: "🆓",
        features: [
            { label: "5 predictions / month", included: true },
            { label: "Basic prediction history", included: true },
            { label: "SHAP explanation", included: true },
            { label: "PDF reports", included: false },
            { label: "CSV export", included: false },
            { label: "Admin dashboard", included: false },
            { label: "API access", included: false },
            { label: "Priority support", included: false },
        ],
        cta: "Get Started Free",
        popular: false,
    },
    {
        name: "starter",
        display: "Starter",
        price: 2999,
        subtitle: "For NBFCs & rural branches",
        gradient: "linear-gradient(135deg,#2563eb,#1d4ed8)",
        icon: "🚀",
        features: [
            { label: "200 predictions / month", included: true },
            { label: "Full prediction history", included: true },
            { label: "SHAP explanation", included: true },
            { label: "PDF reports", included: true },
            { label: "Prediction notes", included: true },
            { label: "CSV export", included: false },
            { label: "Admin dashboard", included: false },
            { label: "Priority support 48hr", included: false },
        ],
        cta: "Upgrade to Starter",
        popular: false,
    },
    {
        name: "professional",
        display: "Professional",
        price: 7999,
        subtitle: "For mid-size private banks",
        gradient: "linear-gradient(135deg,#7c3aed,#6d28d9)",
        icon: "💼",
        features: [
            { label: "2,000 predictions / month", included: true },
            { label: "Full prediction history", included: true },
            { label: "SHAP explanation", included: true },
            { label: "PDF + branded reports", included: true },
            { label: "Prediction notes", included: true },
            { label: "CSV export", included: true },
            { label: "Admin dashboard", included: true },
            { label: "Priority support 24hr", included: true },
        ],
        cta: "Upgrade to Professional",
        popular: true,
    },
    {
        name: "enterprise",
        display: "Enterprise",
        price: 24999,
        subtitle: "For large multi-branch banks",
        gradient: "linear-gradient(135deg,#d97706,#b45309)",
        icon: "🏦",
        features: [
            { label: "Unlimited predictions", included: true },
            { label: "Full prediction history", included: true },
            { label: "SHAP explanation", included: true },
            { label: "White-label PDF reports", included: true },
            { label: "Prediction notes", included: true },
            { label: "CSV + audit exports", included: true },
            { label: "Multi-branch admin panel", included: true },
            { label: "Dedicated support + SLA", included: true },
        ],
        cta: "Contact Sales",
        popular: false,
    },
];

const ADDONS = [
    {
        icon: "📈", label: "Extra 500 Predictions", price: "₹499/month",
        desc: "Top up your prediction quota without changing your plan.",
        tag: "Most Popular"
    },
    {
        icon: "🤖", label: "Custom ML Model Retraining", price: "₹14,999 one-time",
        desc: "Retrain the model on your bank's own historical loan data.",
        tag: ""
    },
    {
        icon: "🔗", label: "CBS API Integration", price: "₹9,999 setup",
        desc: "Connect LoanXAI directly to your Core Banking System.",
        tag: ""
    },
    {
        icon: "📱", label: "WhatsApp / SMS Alerts", price: "₹1,999/month",
        desc: "Get instant high-risk loan alerts on WhatsApp or SMS.",
        tag: "New"
    },
];

export default function Pricing() {
    const navigate = useNavigate();
    const { user, token, isAuthenticated } = useAuth();
    const [currentPlan, setCurrentPlan] = useState("free");
    const [billingAnnual, setBillingAnnual] = useState(false);

    useEffect(() => {
        document.title = "Pricing — LoanXAI";
        // Use plan from auth context (already synced from API)
        if (user?.plan) {
            setCurrentPlan(user.plan);
        } else if (token) {
            // Fallback: fetch directly
            fetch("/api/subscription", {
                headers: { Authorization: `Bearer ${token}` },
            })
                .then(r => r.json())
                .then(d => setCurrentPlan(d.plan || "free"))
                .catch(() => { });
        }
    }, [user, token]);

    const handlePlanClick = (planName) => {
        if (planName === currentPlan) return;

        if (!isAuthenticated) {
            navigate("/login", { state: { from: "/pricing" } });
            return;
        }

        if (planName === "enterprise") {
            window.open(
                "mailto:akash.loanxai@gmail.com?subject=Enterprise Plan Enquiry",
                "_blank"
            );
            return;
        }

        if (planName === "free") {
            // Downgrade — go to confirm
            navigate("/upgrade-confirm", { state: { plan: "free" } });
            return;
        }

        // Paid upgrade — go to confirmation page
        navigate("/upgrade-confirm", { state: { plan: planName } });
    };

    const getPrice = (p) => billingAnnual ? Math.round(p * 0.8) : p;
    const getCTA = (plan) => {
        if (plan.name === currentPlan) return "✓ Active Plan";
        if (plan.name === "free" && currentPlan !== "free") return "Downgrade to Free";
        return plan.cta;
    };

    return (
        <div className="pricing-page">
            <Navbar />

            {/* Back button */}
            <button className="pricing-back-btn" onClick={() => navigate(-1)}>
                ← Go Back
            </button>

            {/* Hero */}
            <div className="pricing-hero">
                <div className="pricing-hero-badge">SUBSCRIPTION PLANS</div>
                <h1 className="pricing-hero-title">
                    Transparent Pricing for <br />
                    <span className="pricing-highlight">Every Bank Size</span>
                </h1>
                <p className="pricing-hero-sub">
                    From rural NBFCs to enterprise banks — choose the plan that fits.<br />
                    All plans include our core XAI prediction engine with full SHAP explanations.
                </p>

                {/* Annual/Monthly toggle */}
                <div className="pricing-billing-toggle">
                    <span className={!billingAnnual ? "active" : ""}>Monthly</span>
                    <button
                        className={`pricing-toggle-btn ${billingAnnual ? "pricing-toggle-btn--on" : ""}`}
                        onClick={() => setBillingAnnual(!billingAnnual)}
                        aria-label="Toggle annual billing"
                    >
                        <div className="pricing-toggle-knob" />
                    </button>
                    <span className={billingAnnual ? "active" : ""}>
                        Annual <span className="pricing-save-badge">Save 20%</span>
                    </span>
                </div>

                {/* Current plan banner */}
                {isAuthenticated && currentPlan && (
                    <div className="pricing-current-banner">
                        You are on the <strong>{currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}</strong> plan
                        {currentPlan !== "free" && " · "}
                        {currentPlan !== "free" && <Link to="/predict">Go to dashboard →</Link>}
                    </div>
                )}
            </div>

            {/* Plan Cards */}
            <div className="pricing-cards">
                {PLANS.map((plan) => {
                    const isCurrent = currentPlan === plan.name;
                    const price = getPrice(plan.price);
                    return (
                        <div
                            key={plan.name}
                            className={`pricing-card
                                ${plan.popular ? "pricing-card--popular" : ""}
                                ${isCurrent ? "pricing-card--current" : ""}
                            `}
                        >
                            {plan.popular && !isCurrent && (
                                <div className="pricing-badge-popular">MOST POPULAR</div>
                            )}
                            {isCurrent && (
                                <div className="pricing-badge-current">YOUR PLAN</div>
                            )}

                            <div className="pricing-card-header" style={{ background: plan.gradient }}>
                                <div className="pricing-plan-icon">{plan.icon}</div>
                                <h3 className="pricing-plan-name">{plan.display}</h3>
                                <p className="pricing-plan-sub">{plan.subtitle}</p>
                                <div className="pricing-plan-price">
                                    {plan.price === 0 ? (
                                        <span className="pricing-price-free">Free Forever</span>
                                    ) : (
                                        <>
                                            <span className="pricing-currency">₹</span>
                                            <span className="pricing-amount">
                                                {price.toLocaleString("en-IN")}
                                            </span>
                                            <span className="pricing-period">/month</span>
                                        </>
                                    )}
                                </div>
                                {billingAnnual && plan.price > 0 && (
                                    <div className="pricing-annual-note">
                                        billed ₹{(price * 12).toLocaleString("en-IN")}/year
                                    </div>
                                )}
                            </div>

                            <div className="pricing-card-body">
                                <ul className="pricing-features">
                                    {plan.features.map((f, i) => (
                                        <li
                                            key={i}
                                            className={`pricing-feature-item ${!f.included ? "pricing-feature-item--excluded" : ""}`}
                                        >
                                            <span className="pricing-feature-icon">
                                                {f.included ? "✓" : "✗"}
                                            </span>
                                            {f.label}
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    className={`pricing-cta-btn ${isCurrent ? "pricing-cta-btn--current" : ""}`}
                                    style={!isCurrent ? { background: plan.gradient } : {}}
                                    onClick={() => handlePlanClick(plan.name)}
                                    disabled={isCurrent}
                                >
                                    {getCTA(plan)}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Add-ons */}
            <div className="pricing-addons">
                <div className="pricing-addons-header">
                    <div className="pricing-addons-badge">ADD-ONS</div>
                    <h2 className="pricing-addons-title">Extend Any Plan</h2>
                    <p className="pricing-addons-sub">
                        Available on all plans · Contact us to activate any add-on
                    </p>
                </div>
                <div className="pricing-addons-grid">
                    {ADDONS.map((a, i) => (
                        <div key={i} className="pricing-addon-card">
                            {a.tag && (
                                <div className={`pricing-addon-tag ${a.tag === "New" ? "pricing-addon-tag--new" : ""}`}>
                                    {a.tag}
                                </div>
                            )}
                            <div className="pricing-addon-icon-wrap">
                                <span className="pricing-addon-icon">{a.icon}</span>
                            </div>
                            <h3 className="pricing-addon-name">{a.label}</h3>
                            <p className="pricing-addon-desc">{a.desc}</p>
                            <div className="pricing-addon-footer">
                                <span className="pricing-addon-price">{a.price}</span>
                                {isAuthenticated ? (
                                    <button
                                        className="pricing-addon-btn"
                                        onClick={() =>
                                            navigate("/upgrade-confirm", {
                                                state: {
                                                    plan: "addon",
                                                    addonName: a.label,
                                                    addonPrice: a.price,
                                                    addonDesc: a.desc,
                                                }
                                            })
                                        }
                                    >
                                        Purchase →
                                    </button>
                                ) : (
                                    <button
                                        className="pricing-addon-btn"
                                        onClick={() => navigate("/login", { state: { from: "/pricing" } })}
                                    >
                                        Sign In to Purchase →
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Payment note */}
            <div className="pricing-payment-note">
                <div className="pricing-payment-icon">🔒</div>
                <div>
                    <strong>Secure Payments via Razorpay</strong> — UPI, Cards, Net Banking, EMI supported.
                    GST invoice for all paid plans.
                </div>
            </div>
        </div>
    );
}
