import { useState } from "react";
import "./UsageMeter.css";

export default function UsageMeter({ used = 0, limit = 5, plan = "free" }) {
    const unlimited = limit === -1;
    const pct = unlimited ? 0 : Math.min(100, Math.round((used / Math.max(limit, 1)) * 100));
    const color = pct >= 100 ? "#ef4444" : pct >= 80 ? "#f59e0b" : "#22c55e";

    if (!used && !limit) return null;

    return (
        <div className="usage-meter">
            <div className="usage-meter-header">
                <span className="usage-meter-label">Monthly Usage</span>
                <span className="usage-meter-plan" style={{ color }}>
                    {unlimited ? "Unlimited" : `${used} / ${limit}`}
                </span>
            </div>
            {!unlimited && (
                <>
                    <div className="usage-meter-bar">
                        <div
                            className="usage-meter-fill"
                            style={{ width: `${pct}%`, background: color }}
                        />
                    </div>
                    <div className="usage-meter-footer">
                        <span className="usage-meter-pct" style={{ color }}>
                            {pct}% used
                        </span>
                        {pct >= 100 && (
                            <a href="/pricing" className="usage-upgrade-link">Upgrade plan →</a>
                        )}
                        {pct >= 80 && pct < 100 && (
                            <a href="/pricing" className="usage-upgrade-link">Approaching limit</a>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
