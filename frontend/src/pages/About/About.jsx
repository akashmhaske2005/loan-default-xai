import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import './About.css';

const TEAM = [
    {
        name: 'Akash Mhaske', role: 'Full-Stack Developer & ML Engineer', initials: 'AM',
        desc: 'Built the XAI pipeline, React frontend, Flask backend, and the loan default prediction model.'
    },
    {
        name: 'Shashikant Lanke', role: 'Project Co-Creator & System Architect', initials: 'SL',
        desc: 'Contributed to system design, feature planning, and end-to-end testing of the LoanXAI platform.'
    },
];

const TECH_STACK = [
    { cat: 'Machine Learning', items: ['Random Forest Classifier', 'SHAP Explainability', 'Scikit-learn', 'Pandas / NumPy'] },
    { cat: 'Backend', items: ['Python Flask', 'SQLite Database', 'ReportLab (PDF)', 'REST API'] },
    { cat: 'Frontend', items: ['React 18', 'React Router v6', 'Recharts', 'Vite'] },
    { cat: 'Dataset', items: ['UCI Credit Card Default Dataset', '30,000 Taiwanese borrowers', '23 features', 'Binary classification'] },
];

const HOW_STEPS = [
    { num: '01', title: 'Enter Applicant Data', desc: 'Bank officers fill in the applicant\'s credit limit, repayment history, bill amounts, and demographics — all in Indian Rupees (₹).' },
    { num: '02', title: 'AI Model Predicts', desc: 'Our Random Forest model (81% accuracy, AUC 0.86) analyzes 23 features and predicts the probability of loan default.' },
    { num: '03', title: 'SHAP Explains Why', desc: 'SHAP (SHapley Additive exPlanations) breaks down which factors drove the prediction — giving officers transparent, actionable insights.' },
    { num: '04', title: 'Download Full Report', desc: 'Generate a comprehensive PDF report with prediction outcome, risk factors, borrower data, and banking recommendations.' },
];

export default function About() {
    return (
        <div className="about-page">
            <Navbar />

            {/* Hero */}
            <section className="about-hero">
                <div className="container about-hero-inner">
                    <div className="about-hero-left">
                        <div className="about-badge">About LoanXAI</div>
                        <h1 className="about-hero-title">
                            Explainable AI for<br />
                            <span className="about-gradient-text">Smarter Lending Decisions</span>
                        </h1>
                        <p className="about-hero-sub">
                            LoanXAI is an AI-powered loan default prediction platform built for Indian banking officials.
                            It combines a Random Forest ML model with SHAP explainability to help loan officers make
                            faster, fairer, and more transparent credit decisions.
                        </p>
                        <div className="about-hero-btns">
                            <Link to="/predict" className="btn btn-primary" id="about-try-btn">Try a Prediction</Link>
                            <Link to="/pricing" className="about-hero-link">View Pricing →</Link>
                        </div>
                    </div>

                    <div className="about-hero-right">
                        <div className="about-hero-card">
                            <div className="about-hero-card-header">
                                <div className="about-hero-card-dot about-hero-card-dot--red" />
                                <div className="about-hero-card-dot about-hero-card-dot--yellow" />
                                <div className="about-hero-card-dot about-hero-card-dot--green" />
                                <span className="about-hero-card-title">AI Prediction Engine</span>
                            </div>
                            <div className="about-hero-card-body">
                                <div className="about-hero-metric">
                                    <div className="about-hero-metric-label">Model Accuracy</div>
                                    <div className="about-hero-metric-bar">
                                        <div className="about-hero-metric-fill" style={{ width: "81%" }} />
                                    </div>
                                    <div className="about-hero-metric-val">81%</div>
                                </div>
                                <div className="about-hero-metric">
                                    <div className="about-hero-metric-label">ROC-AUC Score</div>
                                    <div className="about-hero-metric-bar">
                                        <div className="about-hero-metric-fill about-hero-metric-fill--purple" style={{ width: "86%" }} />
                                    </div>
                                    <div className="about-hero-metric-val">0.86</div>
                                </div>
                                <div className="about-hero-metric">
                                    <div className="about-hero-metric-label">Features Analysed</div>
                                    <div className="about-hero-metric-bar">
                                        <div className="about-hero-metric-fill about-hero-metric-fill--green" style={{ width: "92%" }} />
                                    </div>
                                    <div className="about-hero-metric-val">23</div>
                                </div>
                            </div>
                            <div className="about-hero-card-footer">
                                <div className="about-hero-pill">🧠 SHAP Explainable</div>
                                <div className="about-hero-pill">📊 30K Samples</div>
                                <div className="about-hero-pill">₹ INR Focused</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Bar */}
            <section className="about-stats">
                <div className="container about-stats-inner">
                    {[
                        { val: '81%', label: 'Model Accuracy' },
                        { val: '0.86', label: 'ROC-AUC Score' },
                        { val: '23', label: 'Features Analysed' },
                        { val: '30K', label: 'Training Samples' },
                        { val: '₹ INR', label: 'India Focused' },
                    ].map(s => (
                        <div key={s.val} className="about-stat">
                            <div className="about-stat__val">{s.val}</div>
                            <div className="about-stat__label">{s.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* How It Works */}
            <section className="about-section">
                <div className="container">
                    <div className="about-section-header">
                        <h2>How It Works</h2>
                        <p>Four simple steps from data entry to decision</p>
                    </div>
                    <div className="how-grid">
                        {HOW_STEPS.map(s => (
                            <div key={s.num} className="how-card">
                                <div className="how-card__num">{s.num}</div>
                                <h3 className="how-card__title">{s.title}</h3>
                                <p className="how-card__desc">{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Tech Stack */}
            <section className="about-section about-section--alt">
                <div className="container">
                    <div className="about-section-header">
                        <h2>Technology Stack</h2>
                        <p>Built with modern, production-grade tools</p>
                    </div>
                    <div className="tech-grid">
                        {TECH_STACK.map(t => (
                            <div key={t.cat} className="tech-card">
                                <h3 className="tech-card__cat">{t.cat}</h3>
                                <ul className="tech-card__list">
                                    {t.items.map(item => (
                                        <li key={item}>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 13, height: 13, flexShrink: 0 }}>
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Database Note */}
            <section className="about-section">
                <div className="container">
                    <div className="about-section-header">
                        <h2>Database</h2>
                        <p>Current vs. recommended setup</p>
                    </div>
                    <div className="db-cards">
                        <div className="db-card db-card--current">
                            <div className="db-card__badge db-card__badge--current">Currently Using</div>
                            <h3>SQLite</h3>
                            <p>Built into Python — zero setup, file-based, great for development and demos. All user data, sessions, and predictions stored in <code>backend/data/loanxai.db</code>.</p>
                            <div className="db-card__pros">
                                <div>✅ Zero configuration</div>
                                <div>✅ No server needed</div>
                                <div>✅ Perfect for a single-server deployment</div>
                            </div>
                        </div>
                        <div className="db-card db-card--recommended">
                            <div className="db-card__badge db-card__badge--recommended">Recommended for Production</div>
                            <h3>PostgreSQL</h3>
                            <p>Open-source, enterprise-grade relational database. Perfect when multiple bank branches use the system simultaneously.</p>
                            <div className="db-card__pros">
                                <div>✅ Handles concurrent users</div>
                                <div>✅ ACID compliant</div>
                                <div>✅ Cloud-ready (Supabase, AWS RDS)</div>
                                <div>✅ Better audit trail support</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Team */}
            <section className="about-section about-section--alt">
                <div className="container">
                    <div className="about-section-header">
                        <h2>Project Creator</h2>
                        <p>Built with passion for explainable AI in Indian banking</p>
                    </div>
                    <div className="team-cards">
                        {TEAM.map(m => (
                            <div key={m.name} className="team-card">
                                <div className="team-card__avatar">{m.initials}</div>
                                <h3 className="team-card__name">{m.name}</h3>
                                <div className="team-card__role">{m.role}</div>
                                <p className="team-card__desc">{m.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="about-cta">
                <div className="container about-cta-inner">
                    <h2>Ready to start assessing loans?</h2>
                    <p>Register your bank account and start making AI-powered credit decisions in minutes.</p>
                    <div className="about-hero-btns" style={{ justifyContent: 'center' }}>
                        <Link to="/register" className="btn btn-primary" id="about-register-btn">Create Account</Link>
                        <Link to="/login" className="about-hero-link">Already have an account? Sign In →</Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
