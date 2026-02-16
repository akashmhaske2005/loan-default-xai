import React, { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import logo from "../../assets/logo/logo-icon.svg";
import "./Navbar.css";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`navbar ${scrolled ? "navbar-scroll" : ""}`}>
      <div className="nav-container">


        {/* Logo */}
        <Link to="/" className="logo">
          <img src={logo} alt="LoanXAI Logo" className="logo-img" />

          <span className="logo-text">
            <span className="logo-loan">Loan</span>
            <span className="logo-xai">XAI</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <nav className={`nav-links ${mobileOpen ? "open" : ""}`}>
          <NavLink to="/" onClick={() => setMobileOpen(false)}>Home</NavLink>
          <NavLink to="/predict" onClick={() => setMobileOpen(false)}>Predict</NavLink>
          <NavLink to="/about" onClick={() => setMobileOpen(false)}>About</NavLink>
          <NavLink to="/docs" onClick={() => setMobileOpen(false)}>Docs</NavLink>
          <NavLink to="/login" className="login-btn" onClick={() => setMobileOpen(false)}>
            Login
          </NavLink>
        </nav>

        {/* Mobile Toggle */}
        <div
          className={`hamburger ${mobileOpen ? "active" : ""}`}
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;