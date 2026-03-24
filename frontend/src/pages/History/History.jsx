import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import { useAuth } from '../../context/AuthContext';
import { getHistory, deletePrediction, userExportCsv } from '../../services/api';
import { usePredictionContext } from '../../context/PredictionContext';
import './History.css';

function RiskBadge({ level }) {
    const cls = level?.includes('HIGH') ? 'high' : level?.includes('MEDIUM') ? 'medium' : 'low';
    return <span className={`risk-badge risk-badge--${cls}`}>{level}</span>;
}

function DetailModal({ prediction, onClose }) {
    const { setPredictionResult } = usePredictionContext();
    if (!prediction) return null;

    const handleViewResult = () => {
        setPredictionResult(prediction);
        onClose();
    };

    const fmt = (val) => isNaN(val) ? val : Number(val).toLocaleString();

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <h2 className="modal-title">{prediction.applicant_name}</h2>
                        <p className="modal-date">{new Date(prediction.created_at).toLocaleString('en-IN')}</p>
                    </div>
                    <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
                </div>

                {/* Risk Summary */}
                <div className={`modal-risk-banner modal-risk-banner--${prediction.risk_level?.includes('HIGH') ? 'high' : prediction.risk_level?.includes('MEDIUM') ? 'medium' : 'low'}`}>
                    <div>
                        <div className="modal-risk-label">Prediction: {prediction.prediction}</div>
                        <div className="modal-risk-val">{prediction.risk_level}</div>
                    </div>
                    <div className="modal-prob">{prediction.probability}%</div>
                </div>

                {/* Top SHAP Factors */}
                {prediction.shap_pairs?.length > 0 && (
                    <div className="modal-section">
                        <h4 className="modal-section-title">Top Risk Factors</h4>
                        {prediction.shap_pairs.slice(0, 5).map((s, i) => (
                            <div className="modal-shap-row" key={i}>
                                <span className="modal-shap-name">{s.name}</span>
                                <span className={`modal-shap-val ${s.value > 0 ? 'red' : 'green'}`}>
                                    {s.value > 0 ? '+' : ''}{s.value?.toFixed(4)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Key Input Data */}
                {prediction.form_data && (
                    <div className="modal-section">
                        <h4 className="modal-section-title">Key Input Data</h4>
                        <div className="modal-data-grid">
                            {[
                                ['Credit Limit', `NT$ ${fmt(prediction.form_data.LIMIT_BAL)}`],
                                ['Age', prediction.form_data.AGE],
                                ['Pay Status Sep', prediction.form_data.PAY_0],
                                ['Bill Sep', `NT$ ${fmt(prediction.form_data.BILL_AMT1)}`],
                            ].map(([k, v], i) => (
                                <div className="modal-data-item" key={i}>
                                    <span className="modal-data-key">{k}</span>
                                    <span className="modal-data-val">{v}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recommendation */}
                {prediction.recommendation && (
                    <div className="modal-section modal-rec">
                        <h4 className="modal-section-title">Recommendation</h4>
                        <p>{prediction.recommendation}</p>
                    </div>
                )}

                <div className="modal-actions">
                    <Link to="/result" className="btn btn-primary modal-view-btn" onClick={handleViewResult}>
                        View Full Result
                    </Link>
                    <button className="modal-close-btn" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
}

export default function History() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [predictions, setPredictions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [toast, setToast] = useState('');
    const [csvError, setCsvError] = useState('');

    const plan = user?.plan || 'free';
    const canExportCsv = plan === 'professional' || plan === 'enterprise';

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3000);
    };

    const load = useCallback(async (q = '') => {
        setLoading(true);
        try {
            const data = await getHistory(q);
            setPredictions(data.predictions || []);
        } catch (_) { }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleSearch = (e) => {
        const val = e.target.value;
        setSearch(val);
        const timer = setTimeout(() => load(val), 350);
        return () => clearTimeout(timer);
    };

    const handleDelete = async (id) => {
        setDeleting(id);
        await deletePrediction(id);
        setPredictions(p => p.filter(x => x.id !== id));
        showToast('Record deleted successfully');
        setDeleting(null);
    };

    const stats = {
        total: predictions.length,
        high: predictions.filter(p => p.risk_level?.includes('HIGH')).length,
        med: predictions.filter(p => p.risk_level?.includes('MEDIUM')).length,
        low: predictions.filter(p => p.risk_level?.includes('LOW') && !p.risk_level?.includes('MEDIUM')).length,
    };

    return (
        <div className="history-page">
            <Navbar />

            <div className="container history-container">
                {/* Header */}
                <div className="history-header">
                    <div>
                        <h1 className="history-title">Prediction History</h1>
                        <p className="history-sub">All applicant assessments made by your account</p>
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                        {canExportCsv ? (
                            <button
                                className="btn-result-download"
                                style={{ padding: '10px 20px', borderRadius: 99, fontWeight: 600, fontSize: '0.88rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                                onClick={async () => {
                                    setCsvError('');
                                    try { await userExportCsv(); }
                                    catch (err) { setCsvError(err.message); }
                                }}
                                id="history-export-csv-btn"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                                Export CSV
                            </button>
                        ) : (
                            <button
                                className="btn-result-download"
                                style={{ padding: '10px 20px', borderRadius: 99, fontWeight: 600, fontSize: '0.88rem', display: 'inline-flex', alignItems: 'center', gap: 6, opacity: 0.6, cursor: 'not-allowed' }}
                                onClick={() => navigate('/pricing')}
                                title="CSV Export requires Professional plan"
                            >
                                🔒 Export CSV (Pro+)
                            </button>
                        )}
                        <Link to="/predict" className="btn btn-primary" id="history-new-prediction-btn">+ New Prediction</Link>
                    </div>
                </div>

                {csvError && (
                    <div style={{ padding: '12px 18px', background: 'rgba(239,68,68,0.08)', border: '1.5px solid #ef4444', borderRadius: 10, color: '#dc2626', fontSize: '0.88rem', marginBottom: 12 }}>
                        {csvError} — <Link to="/pricing" style={{ color: '#1a56e8', fontWeight: 600 }}>Upgrade Plan →</Link>
                    </div>
                )}

                {/* Stats Bar */}
                <div className="history-stats">
                    <div className="hstat hstat--blue">
                        <span className="hstat-val">{stats.total}</span>
                        <span className="hstat-label">Total</span>
                    </div>
                    <div className="hstat hstat--red">
                        <span className="hstat-val">{stats.high}</span>
                        <span className="hstat-label">High Risk</span>
                    </div>
                    <div className="hstat hstat--yellow">
                        <span className="hstat-val">{stats.med}</span>
                        <span className="hstat-label">Medium Risk</span>
                    </div>
                    <div className="hstat hstat--green">
                        <span className="hstat-val">{stats.low}</span>
                        <span className="hstat-label">Low Risk</span>
                    </div>
                </div>

                {/* Search */}
                <div className="history-search-wrap">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="search-icon">
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                        type="text"
                        className="history-search"
                        placeholder="Search by applicant name..."
                        value={search}
                        onChange={handleSearch}
                        id="history-search-input"
                    />
                    {search && (
                        <button className="search-clear" onClick={() => { setSearch(''); load(''); }}>✕</button>
                    )}
                </div>

                {/* Table */}
                {loading ? (
                    <div className="history-loading">
                        <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3, borderColor: '#e2e8f0', borderTopColor: 'var(--primary)' }} />
                        <span>Loading predictions...</span>
                    </div>
                ) : predictions.length === 0 ? (
                    <div className="history-empty">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 56, height: 56, color: '#94a3b8' }}>
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
                        </svg>
                        <h3>No predictions found</h3>
                        <p>{search ? `No results for "${search}"` : 'Start by making a prediction for a loan applicant.'}</p>
                        {!search && <Link to="/predict" className="btn btn-primary">Make First Prediction</Link>}
                    </div>
                ) : (
                    <div className="history-table-wrap">
                        <table className="history-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Applicant Name</th>
                                    <th>Prediction</th>
                                    <th>Risk Level</th>
                                    <th>Probability</th>
                                    <th>Date & Time</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {predictions.map((p, i) => (
                                    <tr key={p.id} className="history-row">
                                        <td className="row-num">{i + 1}</td>
                                        <td className="row-name">
                                            <div className="applicant-avatar">{p.applicant_name?.charAt(0).toUpperCase()}</div>
                                            <span>{p.applicant_name}</span>
                                        </td>
                                        <td>
                                            <span className={`pred-badge ${p.prediction === 'DEFAULT' ? 'pred-badge--default' : 'pred-badge--safe'}`}>
                                                {p.prediction}
                                            </span>
                                        </td>
                                        <td><RiskBadge level={p.risk_level} /></td>
                                        <td>
                                            <div className="prob-cell">
                                                <span className="prob-val">{p.probability}%</span>
                                                <div className="prob-bar-wrap">
                                                    <div className="prob-bar" style={{
                                                        width: `${p.probability}%`,
                                                        background: p.risk_level?.includes('HIGH') ? '#ef4444' : p.risk_level?.includes('MEDIUM') ? '#f59e0b' : '#10b981'
                                                    }} />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="row-date">
                                            {new Date(p.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            <br />
                                            <span className="row-time">{new Date(p.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                                        </td>
                                        <td>
                                            <div className="row-actions">
                                                <button className="action-btn action-btn--view" title="View details"
                                                    onClick={() => setSelected(p)} id={`history-view-${p.id}`}>
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                                                    </svg>
                                                    View
                                                </button>
                                                <button
                                                    className="action-btn action-btn--delete"
                                                    title="Delete" disabled={deleting === p.id}
                                                    onClick={() => handleDelete(p.id)}
                                                    id={`history-delete-${p.id}`}
                                                >
                                                    {deleting === p.id ? '...' : (
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
                                                            <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                                                        </svg>
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {selected && <DetailModal prediction={selected} onClose={() => setSelected(null)} />}

            {toast && <div className="history-toast">{toast}</div>}
        </div>
    );
}
