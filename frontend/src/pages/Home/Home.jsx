import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import './Home.css';

// Icons as inline SVG components
const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const BrainIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.84A2.5 2.5 0 0 1 9.5 2Z" />
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.84A2.5 2.5 0 0 0 14.5 2Z" />
  </svg>
);
const PieIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
    <path d="M22 12A10 10 0 0 0 12 2v10z" />
  </svg>
);
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);

const features = [
  {
    icon: <ShieldIcon />,
    title: "Risk Analysis",
    desc: "Accurate default predictions powered by Random Forest ML model with 81% accuracy.",
    color: "#1a56e8"
  },
  {
    icon: <BrainIcon />,
    title: "Explainable Insights",
    desc: "Transparent AI explanations using SHAP values — know exactly why a decision was made.",
    color: "#7c3aed"
  },
  {
    icon: <PieIcon />,
    title: "Automated Reports",
    desc: "Download detailed financial risk reports instantly with one click.",
    color: "#0ea5e9"
  }
];

const steps = [
  { num: "1", title: "Upload Data", desc: "Import your borrower loan data." },
  { num: "2", title: "Analyze Risk", desc: "AI model assesses default risk." },
  { num: "3", title: "Get Insights", desc: "View explainable results." },
  { num: "4", title: "Make Decisions", desc: "Take informed actions." },
];

const techStack = [
  { name: "React", color: "#61dafb" },
  { name: "Flask", color: "#ffffff" },
  { name: "Machine Learning", color: "#f59e0b" },
  { name: "SHAP", color: "#a855f7" },
];

export default function Home() {
  return (
    <div className="home">
      <Navbar />

      {/* ===== HERO ===== */}
      <section className="hero dark-section">
        <div className="hero__bg-glow" />
        <div className="hero__bg-glow hero__bg-glow--2" />

        <div className="container hero__content">
          <div className="hero__left">
            <div className="hero__badge">
              <span className="badge-dot" />
              AI-Powered Risk Intelligence
            </div>
            <h1 className="hero__title">
              Explainable Loan Default
              <span className="hero__title-gradient"> Prediction System</span>
            </h1>
            <p className="hero__sub">
              AI-powered risk prediction with full transparency and actionable insights.
              Know not just <em>what</em> the risk is, but <em>why</em>.
            </p>
            <div className="hero__ctas">
              <Link to="/predict" className="btn btn-primary" id="hero-start-prediction">
                Start Prediction <ArrowIcon />
              </Link>
              <Link to="/explain" className="btn btn-outline" id="hero-learn-more">
                Learn More
              </Link>
            </div>
            <div className="hero__stats">
              <div className="hero__stat">
                <span className="hero__stat-val">81%</span>
                <span className="hero__stat-label">Accuracy</span>
              </div>
              <div className="hero__stat-divider" />
              <div className="hero__stat">
                <span className="hero__stat-val">0.86</span>
                <span className="hero__stat-label">ROC-AUC</span>
              </div>
              <div className="hero__stat-divider" />
              <div className="hero__stat">
                <span className="hero__stat-val">SHAP</span>
                <span className="hero__stat-label">Explainability</span>
              </div>
            </div>
          </div>

          <div className="hero__right animate-float">
            <div className="hero__dashboard-card glass-card">
              <div className="dash-card__header">
                <div className="dash-card__dot red" /><div className="dash-card__dot yellow" /><div className="dash-card__dot green" />
                <span className="dash-card__title">Credit Risk Dashboard</span>
              </div>
              <div className="dash-card__gauge-wrap">
                <svg viewBox="0 0 200 120" className="dash-gauge-svg">
                  <defs>
                    <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="50%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                  </defs>
                  <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="14" strokeLinecap="round" />
                  <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#gaugeGrad)" strokeWidth="14" strokeLinecap="round" strokeDasharray="251" strokeDashoffset="63" />
                  <text x="100" y="88" textAnchor="middle" fill="white" fontSize="26" fontWeight="bold">68%</text>
                  <text x="100" y="108" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="11">Default Probability</text>
                </svg>
              </div>
              <div className="dash-card__badges">
                <span className="dash-tag dash-tag--blue">AI Insights</span>
                <span className="dash-tag dash-tag--purple">SHAP Values</span>
                <span className="dash-tag dash-tag--green">Real-Time</span>
              </div>
              <div className="dash-card__mini-bars">
                {[80, 55, 70, 40, 90, 60].map((h, i) => (
                  <div key={i} className="dash-bar" style={{ height: `${h}%`, opacity: 0.5 + i * 0.08 }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PROBLEM / SOLUTION ===== */}
      <section className="prob-sol">
        <div className="container prob-sol__grid">
          <div className="prob-sol__card prob-sol__card--problem" id="problem-card">
            <h3 className="prob-sol__heading">The Problem</h3>
            <ul className="prob-sol__list">
              <li><CheckIcon /> Unclear risk assessments</li>
              <li><CheckIcon /> Lack of transparency in lending</li>
              <li><CheckIcon /> Black-box ML models</li>
              <li><CheckIcon /> Delayed decision-making</li>
            </ul>
          </div>
          <div className="prob-sol__card prob-sol__card--solution" id="solution-card">
            <h3 className="prob-sol__heading">Our Solution</h3>
            <ul className="prob-sol__list prob-sol__list--blue">
              <li><CheckIcon /> Explainable AI models (SHAP)</li>
              <li><CheckIcon /> Clear, interpretable results</li>
              <li><CheckIcon /> Real-time predictions</li>
              <li><CheckIcon /> Automated risk reports</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ===== KEY FEATURES ===== */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">Key Features</h2>
          <p className="section-sub">Everything you need for transparent loan risk assessment</p>
          <div className="features-grid">
            {features.map((f, i) => (
              <div className="feature-card" key={i} id={`feature-card-${i}`}>
                <div className="feature-card__icon" style={{ color: f.color, background: f.color + '18' }}>
                  {f.icon}
                </div>
                <h4 className="feature-card__title">{f.title}</h4>
                <p className="feature-card__desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="how-section dark-section">
        <div className="container">
          <h2 className="section-title" style={{ color: 'white' }}>How It Works</h2>
          <p className="section-sub" style={{ color: 'var(--text-light)' }}>Four simple steps to confident lending decisions</p>
          <div className="how-steps">
            {steps.map((s, i) => (
              <div className="how-step" key={i} id={`how-step-${i}`}>
                <div className="how-step__num">{s.num}</div>
                {i < steps.length - 1 && <div className="how-step__connector" />}
                <h4 className="how-step__title">{s.title}</h4>
                <p className="how-step__desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TECH STACK ===== */}
      <section className="tech-section">
        <div className="container tech-section__inner">
          {techStack.map((t, i) => (
            <div className="tech-badge" key={i} id={`tech-badge-${i}`}>
              <div className="tech-badge__dot" style={{ background: t.color }} />
              <span>{t.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ===== CTA BANNER ===== */}
      <section className="cta-banner dark-section">
        <div className="cta-banner__glow" />
        <div className="container cta-banner__inner">
          <h2 className="cta-banner__title">Ready to Predict Loan Defaults with Confidence?</h2>
          <p className="cta-banner__sub">Join thousands of lenders using AI-driven insights for smarter decisions</p>
          <Link to="/predict" className="btn btn-light" id="cta-get-started">
            Get Started with LoanXAI Today!
          </Link>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="footer">
        <div className="container footer__inner">
          <div className="footer__col">
            <h5>Quick Links</h5>
            <Link to="/">Home</Link>
            <Link to="/predict">Predict</Link>
            <Link to="/explain">Explainer</Link>
            <Link to="/result">Results</Link>
          </div>
          <div className="footer__col">
            <h5>Resources</h5>
            <a href="#">Blog</a>
            <a href="#">FAQs</a>
            <a href="#">Support</a>
            <a href="#">API Docs</a>
          </div>
          <div className="footer__col">
            <h5>Company</h5>
            <a href="#">About Us</a>
            <a href="#">Careers</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
          <div className="footer__col">
            <h5>Contact</h5>
            <a href="mailto:support@loanxai.com">support@loanxai.com</a>
            <a href="tel:+18001234567">+1 (800) 123-4567</a>
            <div className="footer__socials">
              <a href="#" aria-label="Twitter"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" /></svg></a>
              <a href="#" aria-label="LinkedIn"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg></a>
              <a href="#" aria-label="GitHub"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" /></svg></a>
            </div>
          </div>
        </div>
        <div className="footer__bottom">
          <p>© 2024 LoanXAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}