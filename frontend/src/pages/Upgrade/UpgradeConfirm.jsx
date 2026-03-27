import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./UpgradeConfirm.css";

const PLAN_INFO = {
    starter: { name: "Starter", price: 2999, color: "#2563eb", icon: "🚀", predictions: "200/month" },
    professional: { name: "Professional", price: 7999, color: "#7c3aed", icon: "💼", predictions: "2,000/month" },
    enterprise: { name: "Enterprise", price: 24999, color: "#d97706", icon: "🏦", predictions: "Unlimited" },
};

const FEATURES = {
    starter: ["200 predictions/month", "PDF reports", "Full history", "Prediction notes", "SHAP explanation"],
    professional: ["2,000 predictions/month", "PDF + branded reports", "CSV export", "Admin dashboard", "API access", "Priority 24hr support"],
    enterprise: ["Unlimited predictions", "White-label PDF reports", "CSV + audit exports", "Multi-branch admin", "API + CBS integration", "Dedicated support + SLA"],
};

// Load Razorpay checkout.js dynamically
function loadRazorpay() {
    return new Promise((resolve) => {
        if (window.Razorpay) { resolve(true); return; }
        const s = document.createElement("script");
        s.src = "https://checkout.razorpay.com/v1/checkout.js";
        s.onload = () => resolve(true);
        s.onerror = () => resolve(false);
        document.body.appendChild(s);
    });
}

export default function UpgradeConfirm() {
    const navigate = useNavigate();
    const location = useLocation();
    const { token, updateUserPlan, user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const planName = location.state?.plan || new URLSearchParams(location.search).get("plan") || "starter";
    const isAddon = planName === "addon";
    const addonName = location.state?.addonName || "Extra 500 Predictions";
    const addonPrice = location.state?.addonPrice || "₹499/month";
    const addonDesc = location.state?.addonDesc || "";

    // For add-on: ₹499 (extract numeric value)
    const addonAmount = 499 * 100; // paise

    const plan = isAddon ? { name: addonName, price: 499, color: "#0891b2", icon: "🔌", predictions: "+500" }
        : (PLAN_INFO[planName] || PLAN_INFO.starter);
    const features = isAddon ? [addonDesc || "Add 500 predictions to your quota", "Invoice provided", "Cancel anytime"]
        : (FEATURES[planName] || FEATURES.starter);

    useEffect(() => {
        document.title = `Upgrade to ${plan.name} — LoanXAI`;
        if (!token) navigate("/login", { state: { from: "/pricing" } });
    }, [token, navigate, plan.name]);

    // ── Razorpay payment handler ──────────────────────────────────────────────
    const handleConfirm = async () => {
        setLoading(true); setError("");
        try {
            // Step 1: Create Razorpay order on backend
            const endpoint = isAddon ? "/api/subscription/add-predictions" : "/api/subscription/upgrade";
            const body = isAddon ? {} : { plan: planName };

            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(body),
            });
            const data = await res.json();

            if (res.status === 401) { setError("Session expired. Please log in again."); setLoading(false); return; }

            // Payment required for all plans — must get a Razorpay order_id
            if (!data.razorpay_key || !data.order_id) {
                setError(data.error || "Unable to initiate payment. Please try again or contact support.");
                setLoading(false);
                return;
            }

            // Step 2: Load Razorpay checkout.js and open payment modal
            const loaded = await loadRazorpay();
            if (!loaded) { setError("Failed to load Razorpay. Please check your internet connection."); setLoading(false); return; }

            const options = {
                key: data.razorpay_key,
                amount: data.amount,
                currency: data.currency || "INR",
                name: "LoanXAI",
                description: isAddon ? `Add-on: ${addonName}` : `${plan.name} Plan Subscription`,
                order_id: data.order_id,
                image: "/logo.png",
                prefill: {
                    name: user?.full_name || "",
                    email: user?.email || "",
                },
                theme: { color: plan.color },
                handler: async (response) => {
                    // Step 3: Verify HMAC signature on backend — this is the only activation path
                    try {
                        const vRes = await fetch("/api/payment/verify", {
                            method: "POST",
                            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                            body: JSON.stringify({
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_signature: response.razorpay_signature,
                                plan: isAddon ? "addon" : planName,
                            }),
                        });
                        const vData = await vRes.json();
                        if (vData.success) {
                            if (!isAddon) updateUserPlan(planName);
                            navigate("/upgrade-success", { state: { plan: planName, planDisplay: plan.name } });
                        } else {
                            setError(vData.error || "Payment verification failed. Contact support.");
                        }
                    } catch {
                        setError("Payment recorded but activation failed. Contact support with payment ID: " + response.razorpay_payment_id);
                    } finally {
                        setLoading(false);
                    }
                },
                modal: {
                    ondismiss: () => { setLoading(false); }
                }
            };
            new window.Razorpay(options).open();
            return; // keep loading spinner until handler fires or modal dismissed
        } catch {
            setError("Network error. Please check your connection and try again.");
            setLoading(false);
        }
    };

    return (
        <div className="uc-page">
            <button className="uc-back" onClick={() => navigate("/pricing")}>
                ← Back to Plans
            </button>

            <div className="uc-card">
                {/* Header */}
                <div className="uc-header" style={{ background: `linear-gradient(135deg, ${plan.color}, ${plan.color}cc)` }}>
                    <div className="uc-header-icon">{plan.icon}</div>
                    <h1 className="uc-header-title">{isAddon ? "Purchase Add-on" : `Upgrade to ${plan.name}`}</h1>
                    <p className="uc-header-sub">Secure payment powered by Razorpay</p>
                </div>

                <div className="uc-body">
                    {/* Price summary */}
                    <div className="uc-price-row">
                        <div className="uc-price-label">{isAddon ? "Add-on Price" : "Monthly Subscription"}</div>
                        <div className="uc-price-amount">
                            {isAddon ? (
                                <span className="uc-period" style={{ fontSize: "1.2rem", fontWeight: 700 }}>{addonPrice}</span>
                            ) : (
                                <><span className="uc-currency">₹</span>
                                    <span className="uc-amount">{plan.price.toLocaleString("en-IN")}</span>
                                    <span className="uc-period">/month</span></>
                            )}
                        </div>
                    </div>

                    {/* Predictions */}
                    {plan.predictions && (
                        <div className="uc-predictions">
                            <span className="uc-pred-icon">📊</span>
                            <span><strong>{plan.predictions}</strong> predictions included</span>
                        </div>
                    )}

                    {/* Feature list */}
                    <div className="uc-features-section">
                        <div className="uc-features-title">What's included</div>
                        <ul className="uc-features-list">
                            {features.map((f, i) => (
                                <li key={i} className="uc-feature-item">
                                    <span className="uc-feature-check" style={{ color: plan.color }}>✓</span>
                                    {f}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Payment note */}
                    <div className="uc-note">
                        <span>🔒</span>
                        <span>Secure payment via Razorpay — UPI, Cards, Net Banking &amp; EMI accepted. GST invoice included.</span>
                    </div>

                    {error && <div className="uc-error">{error}</div>}

                    {/* CTA */}
                    <button
                        className="uc-confirm-btn"
                        onClick={handleConfirm}
                        disabled={loading}
                        style={{ background: `linear-gradient(135deg, ${plan.color}, ${plan.color}aa)` }}
                    >
                        {loading ? <><span className="uc-spinner" /> Processing…</> :
                            isAddon ? `Pay ${addonPrice} — ${addonName}` : `Pay ₹${plan.price.toLocaleString("en-IN")}/mo — Upgrade to ${plan.name}`}
                    </button>

                    <Link to="/pricing" className="uc-cancel-link">Cancel — keep current plan</Link>
                </div>
            </div>
        </div>
    );
}
