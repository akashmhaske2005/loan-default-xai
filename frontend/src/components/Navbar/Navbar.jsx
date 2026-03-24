import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const dropRef = useRef(null);
  const isHome = location.pathname === '/';
  const isActive = (p) => location.pathname === p;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  return (
    <nav className={`navbar ${scrolled || !isHome ? 'navbar--scrolled' : ''}`}>
      <div className="container navbar__inner">
        {/* Logo */}
        <Link to="/" className="navbar__logo">
          <div className="navbar__logo-icon">
            <svg viewBox="0 0 36 36" fill="none">
              <circle cx="18" cy="18" r="18" fill="url(#nlg)" />
              <path d="M10 24l8-12 8 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="18" cy="14" r="2.5" fill="white" />
              <defs>
                <linearGradient id="nlg" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#1a56e8" /><stop offset="1" stopColor="#7c3aed" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="navbar__logo-text">LoanXAI</span>
        </Link>

        {/* Desktop Nav */}
        <ul className="navbar__links">
          <li><Link to="/" className={`navbar__link ${isActive('/') ? 'active' : ''}`}>Home</Link></li>
          <li><Link to="/about" className={`navbar__link ${isActive('/about') ? 'active' : ''}`}>About</Link></li>
          <li><Link to="/predict" className={`navbar__link ${isActive('/predict') ? 'active' : ''}`}>Predict</Link></li>
          <li><Link to="/explain" className={`navbar__link ${isActive('/explain') ? 'active' : ''}`}>Explainer</Link></li>
          <li><Link to="/pricing" className={`navbar__link ${isActive('/pricing') ? 'active' : ''}`}>Pricing</Link></li>
          {isAuthenticated && (
            <li><Link to="/history" className={`navbar__link ${isActive('/history') ? 'active' : ''}`}>History</Link></li>
          )}
        </ul>

        {/* Dark mode toggle */}
        <button className="navbar__theme-toggle" onClick={toggleTheme} title="Toggle dark mode" aria-label="Toggle dark mode">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {/* Right Side */}
        {isAuthenticated ? (
          <div className="navbar__user" ref={dropRef}>
            <button className="navbar__user-btn" onClick={() => setDropOpen(d => !d)}>
              <div className="navbar__avatar">
                {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <span className="navbar__user-name">{user?.full_name?.split(' ')[0]}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14, opacity: .7 }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {dropOpen && (
              <div className="navbar__dropdown">
                <div className="navbar__dropdown-user">
                  <div className="navbar__dropdown-avatar">
                    {user?.full_name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <div className="navbar__dropdown-name">{user?.full_name}</div>
                    <div className="navbar__dropdown-role">{user?.role}</div>
                    {user?.plan && (
                      <div className="navbar__dropdown-plan">
                        {user.plan === 'enterprise' ? '🏦' : user.plan === 'professional' ? '💼' : user.plan === 'starter' ? '🚀' : '🆓'}
                        {' '}{user.plan.charAt(0).toUpperCase() + user.plan.slice(1)} Plan
                      </div>
                    )}
                  </div>
                </div>
                <div className="navbar__dropdown-divider" />
                <Link to="/history" className="navbar__dropdown-item" onClick={() => setDropOpen(false)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
                    <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                  Prediction History
                </Link>
                {user?.role === 'admin' && (
                  <Link to="/admin" className="navbar__dropdown-item" onClick={() => setDropOpen(false)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
                      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                      <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                    </svg>
                    Admin Dashboard
                  </Link>
                )}
                <Link to="/predict" className="navbar__dropdown-item" onClick={() => setDropOpen(false)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                  New Prediction
                </Link>
                <div className="navbar__dropdown-divider" />
                <button className="navbar__dropdown-item navbar__dropdown-logout" onClick={handleLogout}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="navbar__auth-btns">
            <Link to="/login" className="navbar__link" style={{ marginLeft: 'auto' }}>Sign In</Link>
            <Link to="/register" className="btn btn-primary navbar__cta" id="navbar-start-prediction">Register</Link>
          </div>
        )}

        {/* Mobile Hamburger */}
        <button className={`navbar__hamburger ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
          <span /><span /><span />
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`navbar__mobile ${menuOpen ? 'navbar__mobile--open' : ''}`}>
        <Link to="/" className="navbar__mobile-link" onClick={() => setMenuOpen(false)}>Home</Link>
        <Link to="/about" className="navbar__mobile-link" onClick={() => setMenuOpen(false)}>About</Link>
        <Link to="/predict" className="navbar__mobile-link" onClick={() => setMenuOpen(false)}>Predict</Link>
        <Link to="/explain" className="navbar__mobile-link" onClick={() => setMenuOpen(false)}>Explainer</Link>
        {isAuthenticated && (
          <Link to="/history" className="navbar__mobile-link" onClick={() => setMenuOpen(false)}>History</Link>
        )}
        {isAuthenticated && user?.role === 'admin' && (
          <Link to="/admin" className="navbar__mobile-link" onClick={() => setMenuOpen(false)}>Admin</Link>
        )}
        {isAuthenticated ? (
          <button className="navbar__mobile-link" style={{ textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontFamily: 'inherit', fontSize: 'inherit', padding: '10px 14px', borderRadius: 'var(--radius-md)' }} onClick={() => { handleLogout(); setMenuOpen(false); }}>Sign Out</button>
        ) : (
          <>
            <Link to="/login" className="navbar__mobile-link" onClick={() => setMenuOpen(false)}>Sign In</Link>
            <Link to="/register" className="btn btn-primary" style={{ marginTop: '8px' }} onClick={() => setMenuOpen(false)}>Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}