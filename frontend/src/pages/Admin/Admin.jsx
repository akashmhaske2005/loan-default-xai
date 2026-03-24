import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import { useAuth } from '../../context/AuthContext';
import { getAdminStats, getAdminUsers, getAdminPredictions } from '../../services/api';
import './Admin.css';

function StatCard({ icon, label, value, sub, color }) {
    return (
        <div className={`admin-stat admin-stat--${color}`}>
            <div className="admin-stat__icon">{icon}</div>
            <div>
                <div className="admin-stat__val">{value}</div>
                <div className="admin-stat__label">{label}</div>
                {sub && <div className="admin-stat__sub">{sub}</div>}
            </div>
        </div>
    );
}

function RiskPie({ distribution }) {
    const COLORS = { 'HIGH RISK': '#ef4444', 'MEDIUM RISK': '#f59e0b', 'LOW RISK': '#10b981' };
    const total = distribution.reduce((s, d) => s + d.cnt, 0) || 1;
    let cumulative = 0;
    const slices = distribution.map(d => {
        const pct = d.cnt / total;
        const start = cumulative;
        cumulative += pct;
        return { ...d, pct, start };
    });

    // SVG donut
    const R = 60, CX = 80, CY = 80;
    const polarX = (pct) => CX + R * Math.cos((pct * 2 * Math.PI) - Math.PI / 2);
    const polarY = (pct) => CY + R * Math.sin((pct * 2 * Math.PI) - Math.PI / 2);

    return (
        <div className="risk-pie-wrap">
            <svg viewBox="0 0 160 160" width="160" height="160">
                {slices.map((s, i) => {
                    if (s.pct === 0) return null;
                    const x1 = polarX(s.start), y1 = polarY(s.start);
                    const x2 = polarX(s.start + s.pct), y2 = polarY(s.start + s.pct);
                    const large = s.pct > 0.5 ? 1 : 0;
                    return (
                        <path key={i}
                            d={`M ${CX} ${CY} L ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} Z`}
                            fill={COLORS[s.risk_level] || '#94a3b8'}
                            stroke="white" strokeWidth="2"
                        />
                    );
                })}
                <circle cx={CX} cy={CY} r="35" fill="white" />
                <text x={CX} y={CY - 4} textAnchor="middle" fontSize="11" fontWeight="800" fill="#1e293b">{total}</text>
                <text x={CX} y={CY + 10} textAnchor="middle" fontSize="8" fill="#64748b">Total</text>
            </svg>
            <div className="risk-pie-legend">
                {slices.map((s, i) => (
                    <div key={i} className="risk-pie-legend__item">
                        <div className="risk-pie-legend__dot" style={{ background: COLORS[s.risk_level] || '#94a3b8' }} />
                        <span>{s.risk_level}</span>
                        <strong>{s.cnt} ({Math.round(s.pct * 100)}%)</strong>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function Admin() {
    const { user } = useAuth();
    const [tab, setTab] = useState('overview');
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [preds, setPreds] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        Promise.all([getAdminStats(), getAdminUsers(), getAdminPredictions()])
            .then(([s, u, p]) => {
                setStats(s);
                setUsers(u.users || []);
                setPreds(p.predictions || []);
            })
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    const handleSearch = async (q) => {
        setSearch(q);
        if (tab === 'predictions') {
            const data = await getAdminPredictions(q);
            setPreds(data.predictions || []);
        } else if (tab === 'users') {
            const data = await getAdminUsers();
            setUsers((data.users || []).filter(u =>
                u.full_name?.toLowerCase().includes(q.toLowerCase()) ||
                u.username?.toLowerCase().includes(q.toLowerCase()) ||
                u.email?.toLowerCase().includes(q.toLowerCase())
            ));
        }
    };

    if (user?.role !== 'admin') {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                <Navbar />
                <h2 style={{ color: '#ef4444', fontSize: '1.5rem', fontWeight: 800 }}>Access Denied</h2>
                <p style={{ color: '#64748b' }}>This page is for admin users only.</p>
                <Link to="/" className="btn btn-primary">Go Home</Link>
            </div>
        );
    }

    return (
        <div className="admin-page">
            <Navbar />
            <div className="container admin-container">
                {/* Header */}
                <div className="admin-header">
                    <div>
                        <div className="admin-badge">Admin Dashboard</div>
                        <h1 className="admin-title">LoanXAI System Overview</h1>
                        <p className="admin-sub">Logged in as <strong>{user.full_name}</strong> &middot; {user.email}</p>
                    </div>
                    <Link to="/predict" className="btn btn-primary" id="admin-new-prediction-btn">+ New Prediction</Link>
                </div>

                {/* Tabs */}
                <div className="admin-tabs">
                    {[['overview', 'Overview'], ['users', 'Users'], ['predictions', 'All Predictions']].map(([k, l]) => (
                        <button key={k} className={`admin-tab ${tab === k ? 'active' : ''}`}
                            onClick={() => { setTab(k); setSearch(''); }}>
                            {l}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="admin-loading">
                        <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
                        Loading system data...
                    </div>
                ) : error ? (
                    <div className="admin-error">{error}</div>
                ) : (
                    <>
                        {tab === 'overview' && stats && (
                            <>
                                {/* Stats Grid */}
                                <div className="admin-stats-grid">
                                    <StatCard color="blue" label="Total Users" value={stats.total_users}
                                        sub="Registered officers"
                                        icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>}
                                    />
                                    <StatCard color="purple" label="Total Predictions" value={stats.total_predictions}
                                        sub={`${stats.predictions_last_7d} in last 7 days`}
                                        icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>}
                                    />
                                    <StatCard color="red" label="Default Predictions" value={stats.default_count}
                                        sub={`${stats.default_rate}% default rate`}
                                        icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>}
                                    />
                                    <StatCard color="green" label="Non-Default" value={stats.total_predictions - stats.default_count}
                                        sub={`${100 - stats.default_rate}% approved rate`}
                                        icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>}
                                    />
                                </div>

                                {/* Risk Distribution + Top Officers */}
                                <div className="admin-row">
                                    <div className="admin-card">
                                        <h3 className="admin-card-title">Risk Distribution</h3>
                                        {stats.risk_distribution.length > 0
                                            ? <RiskPie distribution={stats.risk_distribution} />
                                            : <p className="admin-empty-note">No predictions yet</p>
                                        }
                                    </div>
                                    <div className="admin-card admin-card--wide">
                                        <h3 className="admin-card-title">Top Officers by Activity</h3>
                                        <table className="admin-table">
                                            <thead>
                                                <tr><th>Officer</th><th>Username</th><th>Role</th><th>Predictions</th></tr>
                                            </thead>
                                            <tbody>
                                                {stats.user_activity.map((u, i) => (
                                                    <tr key={i}>
                                                        <td><strong>{u.full_name}</strong></td>
                                                        <td className="mono">{u.username}</td>
                                                        <td><span className="role-badge">{u.role}</span></td>
                                                        <td><strong>{u.pred_count}</strong></td>
                                                    </tr>
                                                ))}
                                                {stats.user_activity.length === 0 && (
                                                    <tr><td colSpan="4" className="admin-empty-note">No data yet</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}

                        {tab === 'users' && (
                            <div className="admin-card">
                                <div className="admin-card-header">
                                    <h3 className="admin-card-title">All Registered Users ({users.length})</h3>
                                    <input type="text" className="admin-search" placeholder="Search by name, username, email..."
                                        value={search} onChange={e => handleSearch(e.target.value)} />
                                </div>
                                <table className="admin-table">
                                    <thead>
                                        <tr><th>#</th><th>Full Name</th><th>Username</th><th>Email</th><th>Role</th><th>Predictions</th><th>Joined</th></tr>
                                    </thead>
                                    <tbody>
                                        {users.map((u, i) => (
                                            <tr key={u.id}>
                                                <td className="dim">{i + 1}</td>
                                                <td>
                                                    <div className="user-row">
                                                        <div className="user-avatar">{u.full_name?.charAt(0)?.toUpperCase()}</div>
                                                        <strong>{u.full_name}</strong>
                                                    </div>
                                                </td>
                                                <td className="mono">{u.username}</td>
                                                <td className="dim">{u.email}</td>
                                                <td><span className="role-badge">{u.role}</span></td>
                                                <td><strong>{u.prediction_count}</strong></td>
                                                <td className="dim">{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
                                            </tr>
                                        ))}
                                        {users.length === 0 && <tr><td colSpan="7" className="admin-empty-note">No users found</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {tab === 'predictions' && (
                            <div className="admin-card">
                                <div className="admin-card-header">
                                    <h3 className="admin-card-title">All Predictions ({preds.length})</h3>
                                    <input type="text" className="admin-search" placeholder="Search by applicant or officer name..."
                                        value={search} onChange={e => handleSearch(e.target.value)} />
                                </div>
                                <table className="admin-table">
                                    <thead>
                                        <tr><th>#</th><th>Applicant</th><th>Prediction</th><th>Risk</th><th>Prob%</th><th>Officer</th><th>Date</th></tr>
                                    </thead>
                                    <tbody>
                                        {preds.map((p, i) => (
                                            <tr key={p.id}>
                                                <td className="dim">{i + 1}</td>
                                                <td><strong>{p.applicant_name}</strong></td>
                                                <td>
                                                    <span className={`pred-badge pred-badge--${p.prediction === 'DEFAULT' ? 'default' : 'safe'}`}>
                                                        {p.prediction}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`risk-badge risk-badge--${p.risk_level?.includes('HIGH') ? 'high' : p.risk_level?.includes('MEDIUM') ? 'medium' : 'low'}`}>
                                                        {p.risk_level}
                                                    </span>
                                                </td>
                                                <td><strong>{p.probability}%</strong></td>
                                                <td className="dim">{p.officer_name}</td>
                                                <td className="dim">{new Date(p.created_at).toLocaleDateString('en-IN')}</td>
                                            </tr>
                                        ))}
                                        {preds.length === 0 && <tr><td colSpan="7" className="admin-empty-note">No predictions found</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
