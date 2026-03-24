import { useEffect, useState } from 'react';

import { Link, useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip
} from 'recharts';
import Navbar from '../components/Navbar/Navbar';
import { usePredictionContext } from '../context/PredictionContext';
import { downloadReport } from '../services/api';
import UpgradeModal from '../components/UpgradeModal/UpgradeModal';
import './Result.css';

// ── Correct polar gauge ───────────────────────────────────────────────────────
function polarPoint(cx, cy, r, angleDeg) {
  // angle 0 = top (12 o'clock), clockwise
  const rad = (angleDeg - 90) * Math.PI / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx, cy, r, startDeg, endDeg, clockwise = 1) {
  const s = polarPoint(cx, cy, r, startDeg);
  const e = polarPoint(cx, cy, r, endDeg);
  const sweep = clockwise;
  const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} ${sweep} ${e.x} ${e.y}`;
}

function RiskGauge({ probability }) {
  const safeProb = Math.min(100, Math.max(0, probability || 0));
  // Gauge arc: 225° → 135° clockwise (270° total sweep)
  const START_DEG = 225;
  const TOTAL_SWEEP = 270;
  const cx = 80, cy = 84, rTrack = 56;

  const filledEndDeg = START_DEG + (safeProb / 100) * TOTAL_SWEEP;
  const needleRotation = START_DEG + (safeProb / 100) * TOTAL_SWEEP;

  let color = '#10b981';
  if (safeProb >= 70) color = '#ef4444';
  else if (safeProb >= 30) color = '#f59e0b';

  const trackPath = arcPath(cx, cy, rTrack, START_DEG, START_DEG + TOTAL_SWEEP, 1);
  const progressPath = safeProb > 0
    ? arcPath(cx, cy, rTrack, START_DEG, filledEndDeg, 1)
    : null;

  // Needle tip point
  const needleLen = 48;
  const needleTip = polarPoint(cx, cy, needleLen, needleRotation);

  return (
    <div className="gauge-wrap">
      <svg viewBox="0 0 160 140" className="gauge-svg">
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.7" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>

        {/* Track ring */}
        <path d={trackPath} fill="none" stroke="#e8edf5" strokeWidth="13" strokeLinecap="round" />

        {/* Filled arc */}
        {progressPath && (
          <path d={progressPath} fill="none" stroke="url(#gaugeGrad)" strokeWidth="13"
            strokeLinecap="round"
            style={{ transition: 'all 0.9s cubic-bezier(.4,0,.2,1)' }}
          />
        )}

        {/* Ticks */}
        {[0, 25, 50, 75, 100].map(pct => {
          const deg = START_DEG + (pct / 100) * TOTAL_SWEEP;
          const outerPt = polarPoint(cx, cy, rTrack + 10, deg);
          const innerPt = polarPoint(cx, cy, rTrack + 4, deg);
          return (
            <line key={pct} x1={innerPt.x} y1={innerPt.y}
              x2={outerPt.x} y2={outerPt.y}
              stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />
          );
        })}

        {/* Needle */}
        <line x1={cx} y1={cy} x2={needleTip.x} y2={needleTip.y}
          stroke={color} strokeWidth="2.5" strokeLinecap="round"
          style={{ transition: 'all 0.9s cubic-bezier(.4,0,.2,1)' }}
        />
        {/* Needle base circle */}
        <circle cx={cx} cy={cy} r="7" fill={color} opacity="0.15" />
        <circle cx={cx} cy={cy} r="4" fill={color} />

        {/* Labels */}
        <text x={cx} y={cy + 25} textAnchor="middle" fill={color}
          fontSize="26" fontWeight="800" fontFamily="Inter, sans-serif">
          {safeProb}%
        </text>
        <text x={cx} y={cy + 40} textAnchor="middle" fill="#94a3b8"
          fontSize="9" fontWeight="500" fontFamily="Inter, sans-serif">
          Default Probability
        </text>

        {/* Scale labels */}
        {(() => {
          const lo = polarPoint(cx, cy, rTrack + 16, START_DEG);
          const hi = polarPoint(cx, cy, rTrack + 16, START_DEG + TOTAL_SWEEP);
          return (
            <>
              <text x={lo.x} y={lo.y + 3} textAnchor="middle" fill="#94a3b8" fontSize="8">0%</text>
              <text x={hi.x} y={hi.y + 3} textAnchor="middle" fill="#94a3b8" fontSize="8">100%</text>
            </>
          );
        })()}
      </svg>
    </div>
  );
}

function RiskFactorItem({ name, value, index }) {
  const isNegative = value < 0;
  return (
    <div className="risk-factor-item" style={{ animationDelay: `${index * 0.08}s` }}>
      <div className={`risk-factor__icon ${isNegative ? 'positive' : 'negative'}`}>
        {isNegative ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
        )}
      </div>
      <div className="risk-factor__info">
        <span className="risk-factor__name">{name}</span>
        <div className="risk-factor__bar-wrap">
          <div
            className={`risk-factor__bar ${isNegative ? 'risk-factor__bar--green' : 'risk-factor__bar--red'}`}
            style={{ width: `${Math.min(100, Math.abs(value) * 200)}%` }}
          />
        </div>
      </div>
      <span className={`risk-factor__val ${isNegative ? 'positive' : 'negative'}`}>
        {value > 0 ? '+' : ''}{value.toFixed(3)}
      </span>
    </div>
  );
}

export default function Result() {
  const { predictionResult, formData } = usePredictionContext();
  const navigate = useNavigate();
  const [planError, setPlanError] = useState(null);

  useEffect(() => {
    if (!predictionResult) {
      navigate('/predict');
    }
  }, [predictionResult, navigate]);

  if (!predictionResult) return null;

  const { probability, risk_level, prediction, shap_pairs } = predictionResult;

  const isHigh = risk_level === 'HIGH RISK';
  const isMed = risk_level === 'MEDIUM RISK';
  const isLow = risk_level === 'LOW RISK';

  const riskClass = isHigh ? 'high' : isMed ? 'medium' : 'low';
  const riskColor = isHigh ? '#ef4444' : isMed ? '#f59e0b' : '#10b981';
  const riskBg = isHigh ? 'rgba(239,68,68,0.08)' : isMed ? 'rgba(245,158,11,0.08)' : 'rgba(16,185,129,0.08)';

  const recommendation = isHigh
    ? 'High default risk detected. Consider increasing income documentation, reducing debt load, or seeking a co-signer before approving this loan.'
    : isMed
      ? 'Moderate risk detected. Review repayment history carefully. Additional collateral or reduced loan amount could mitigate risk.'
      : 'Low default risk. This borrower profile is favorable. Standard loan terms should be appropriate.';

  return (
    <div className="result-page">
      <Navbar />

      <div className="container result-container">
        {/* Risk Header Banner */}
        <div className={`risk-banner risk-banner--${riskClass}`}>
          <div className="risk-banner__left">
            <div className="risk-banner__icon">
              {isHigh || isMed ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              )}
            </div>
            <div>
              <div className="risk-banner__label">Prediction Result{predictionResult?.applicant_name ? ` — ${predictionResult.applicant_name}` : ''}</div>
              <h1 className="risk-banner__title">{risk_level}</h1>
              <p className="risk-banner__pred">Outcome: {prediction}</p>
            </div>
          </div>
          <div className="risk-banner__badge">{probability}% probability</div>
        </div>

        <div className="result-grid">
          {/* Left: Risk Factors */}
          <div className="result-card">
            <div className="result-card__header">
              <h3 className="result-card__title">Top Risk Factors</h3>
              <span className="result-card__tag">SHAP Analysis</span>
            </div>
            <div className="risk-factors-list">
              {shap_pairs && shap_pairs.map((item, i) => (
                <RiskFactorItem key={i} name={item.name} value={item.value} index={i} />
              ))}
            </div>
          </div>

          {/* Right: Gauge + Recommendation */}
          <div className="result-right">
            <div className="result-card gauge-card">
              <RiskGauge probability={probability} />
              <div className={`gauge-risk-label`} style={{ color: riskColor }}>
                {risk_level}
              </div>
            </div>

            <div className="result-card recommendation-card" style={{ background: riskBg, border: `1px solid ${riskColor}30` }}>
              <h4 className="rec-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                Recommendation
              </h4>
              <p className="rec-text">{recommendation}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="result-actions">
          <Link to="/predict" className="btn-result-back" id="result-back-btn">
            ← New Prediction
          </Link>
          <Link to="/history" className="btn-result-back" id="result-history-btn"
            style={{ background: 'rgba(26,86,232,0.08)', color: 'var(--primary)', border: '1.5px solid var(--primary)', textDecoration: 'none', padding: '10px 22px', borderRadius: 'var(--radius-full)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            View History
          </Link>
          <Link to="/explain" className="btn btn-primary" id="result-explain-btn">
            View SHAP Explanation
          </Link>
          <button className="btn-result-download"
            onClick={async () => {
              setPlanError(null);
              try {
                await downloadReport({
                  applicant_name: predictionResult?.applicant_name || 'Unknown',
                  prediction, probability, risk_level,
                  shap_pairs: predictionResult?.shap_pairs || [],
                  form_data: formData || {},
                  recommendation: predictionResult?.recommendation || ''
                });
              } catch (err) {
                if (err.planRequired) {
                  setPlanError(err.message);
                } else {
                  setPlanError('PDF generation failed. Please try again.');
                }
              }
            }}
            id="result-download-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download PDF
          </button>
        </div>

        {/* Plan restriction POPUP (shown when PDF blocked for free plan) */}
        {planError && (
          <UpgradeModal
            onClose={() => setPlanError(null)}
            featureName="PDF Report Download"
            requiredPlan="starter"
            message={planError}
          />
        )}

      </div>
    </div>
  );
}