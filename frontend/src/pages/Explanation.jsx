import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, ReferenceLine
} from 'recharts';
import Navbar from '../components/Navbar/Navbar';
import { usePredictionContext } from '../context/PredictionContext';
import { getFeatureImportance } from '../services/api';
import './Explanation.css';

const TABS = ['Global', 'Local', 'Detailed Report'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  const val = payload[0].value;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__label">{label}</p>
      <p className="chart-tooltip__val" style={{ color: val > 0 ? '#ef4444' : '#10b981' }}>
        {val > 0 ? '+' : ''}{typeof val === 'number' ? val.toFixed(4) : val}
      </p>
    </div>
  );
};

const GlobalTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__label">{label}</p>
      <p className="chart-tooltip__val" style={{ color: 'var(--primary)' }}>
        Importance: {(payload[0].value * 100).toFixed(2)}%
      </p>
    </div>
  );
};

export default function Explanation() {
  const [activeTab, setActiveTab] = useState(0);
  const [globalData, setGlobalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState(null);
  const { predictionResult } = usePredictionContext();

  useEffect(() => {
    getFeatureImportance()
      .then(data => {
        const top10 = (data.features || []).slice(0, 10);
        setGlobalData(top10);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  // Local SHAP data from prediction result
  const localData = predictionResult?.shap_pairs
    ? predictionResult.shap_pairs.map(p => ({
      name: p.name,
      value: p.value,
    }))
    : [];

  const metrics = [
    { label: 'Accuracy', value: '81%', color: '#1a56e8' },
    { label: 'ROC-AUC', value: '0.86', color: '#7c3aed' },
    { label: 'Precision', value: '79%', color: '#0ea5e9' },
    { label: 'Recall', value: '75%', color: '#10b981' },
    { label: 'F1 Score', value: '0.77', color: '#f59e0b' },
  ];

  const getBarColor = (val) => {
    if (val > 0.06) return '#ef4444';
    if (val > 0.03) return '#f59e0b';
    return '#3b82f6';
  };

  const getLocalBarColor = (val) => val < 0 ? '#10b981' : '#ef4444';

  return (
    <div className="explain-page">
      <Navbar />

      <div className="container explain-container">
        {/* Header */}
        <div className="explain-header">
          <div className="explain-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <div>
            <h1 className="explain-header__title">SHAP Explanation</h1>
            <p className="explain-header__sub">Understand how each feature influences the model's prediction</p>
          </div>
          <div className="explain-header__actions">
            <button className="explain-action-btn" title="Download">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>
            <button className="explain-action-btn" title="Share">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
                <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="explain-tabs">
          {TABS.map((tab, i) => (
            <button
              key={i}
              className={`explain-tab ${activeTab === i ? 'active' : ''}`}
              onClick={() => setActiveTab(i)}
              id={`explain-tab-${tab.toLowerCase().replace(' ', '-')}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ==== GLOBAL TAB ==== */}
        {activeTab === 0 && (
          <div className="explain-content fadeInUp">
            <div className="explain-card">
              <div className="explain-card__top">
                <h3 className="explain-card__title">Feature Importance</h3>
                <button className="explain-card__collapse" onClick={() => setExpandedSection(s => s === 'global' ? null : 'global')}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16, transform: expandedSection === 'global' ? 'rotate(180deg)' : 'rotate(0)' }}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              </div>

              {loading ? (
                <div className="explain-loading">
                  <div className="spinner" style={{ borderColor: '#e2e8f0', borderTopColor: 'var(--primary)' }} />
                  <span>Loading feature data...</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={340}>
                  <BarChart data={globalData} layout="vertical" margin={{ left: 20, right: 40, top: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => (v * 100).toFixed(1) + '%'} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} width={145} />
                    <Tooltip content={<GlobalTooltip />} />
                    <Bar dataKey="importance" radius={[0, 4, 4, 0]} barSize={18}>
                      {globalData.map((entry, index) => (
                        <Cell key={index} fill={getBarColor(entry.importance)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}

              {/* Legend */}
              <div className="chart-legend">
                <div className="legend-item"><span className="legend-dot" style={{ background: '#ef4444' }} /><span>High Risk Factor</span></div>
                <div className="legend-item"><span className="legend-dot" style={{ background: '#f59e0b' }} /><span>Medium Risk</span></div>
                <div className="legend-item"><span className="legend-dot" style={{ background: '#3b82f6' }} /><span>Low Risk Factor</span></div>
              </div>
            </div>

            {/* Understanding box */}
            <div className="explain-info-card">
              <h4 className="explain-info__title">Understanding Global Feature Importance</h4>
              <p className="explain-info__text">
                This chart shows how much each feature contributes to the model's decisions on average across all predictions.
                Features with longer bars have a larger overall impact. Repayment status features (PAY_0, PAY_2, etc.) typically
                dominate because recent payment behavior is the strongest signal of default risk.
              </p>
            </div>
          </div>
        )}

        {/* ==== LOCAL TAB ==== */}
        {activeTab === 1 && (
          <div className="explain-content fadeInUp">
            <div className="explain-card">
              <div className="explain-card__top">
                <h3 className="explain-card__title">Local SHAP Values — Current Prediction</h3>
              </div>
              {localData.length === 0 ? (
                <div className="explain-empty">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 48, height: 48, color: '#94a3b8' }}>
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <p>No prediction data yet. <a href="/predict">Run a prediction first</a> to see local SHAP values.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={340}>
                  <BarChart data={localData} layout="vertical" margin={{ left: 20, right: 60, top: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} width={145} />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine x={0} stroke="#94a3b8" strokeWidth={1} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={18}>
                      {localData.map((entry, index) => (
                        <Cell key={index} fill={getLocalBarColor(entry.value)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
              <div className="chart-legend">
                <div className="legend-item"><span className="legend-dot" style={{ background: '#ef4444' }} /><span>Increases risk (positive SHAP)</span></div>
                <div className="legend-item"><span className="legend-dot" style={{ background: '#10b981' }} /><span>Decreases risk (negative SHAP)</span></div>
              </div>
            </div>

            <div className="explain-info-card">
              <h4 className="explain-info__title">Understanding the Local Impact</h4>
              <p className="explain-info__text">
                This analysis shows how each feature contributed to the model's decision for <strong>this specific prediction</strong>.
                Red bars push the probability toward default, while green bars push against it.
                Higher values of DTI and Credit Score critically affect the prediction.
              </p>
            </div>
          </div>
        )}

        {/* ==== DETAILED REPORT TAB ==== */}
        {activeTab === 2 && (
          <div className="explain-content fadeInUp">
            <div className="metrics-grid">
              {metrics.map((m, i) => (
                <div className="metric-card" key={i}>
                  <div className="metric-card__val" style={{ color: m.color }}>{m.value}</div>
                  <div className="metric-card__label">{m.label}</div>
                  <div className="metric-card__bar">
                    <div className="metric-card__fill" style={{ background: m.color, width: m.value.includes('%') ? m.value : '86%' }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="explain-card" style={{ marginTop: 24 }}>
              <h3 className="explain-card__title" style={{ marginBottom: 20 }}>Model Architecture & Methodology</h3>
              <div className="report-sections">
                <div className="report-section">
                  <h5>Model Type</h5>
                  <p>Random Forest Classifier (scikit-learn) trained on the UCI Default of Credit Card Clients dataset comprising 30,000 samples.</p>
                </div>
                <div className="report-section">
                  <h5>Explainability</h5>
                  <p>SHAP (SHapley Additive exPlanations) TreeExplainer is used to compute feature attribution values, providing both global feature importance and instance-level explanations.</p>
                </div>
                <div className="report-section">
                  <h5>Feature Engineering</h5>
                  <p>23 features used: credit limit, demographics, 6 months of repayment history (PAY_0 to PAY_6), bill amounts, and payment amounts.</p>
                </div>
                <div className="report-section">
                  <h5>Risk Thresholds</h5>
                  <p>Default probability below 30% = Low Risk | 30%–70% = Medium Risk | above 70% = High Risk.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}