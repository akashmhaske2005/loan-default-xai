import React from "react";
import "./Hero.css";
import dashboard from "../../assets/images/dashboard.png";

const Hero = () => {
  return (
    <section className="hero">

      {/* Background glow circles */}
      <div className="hero-bg-glow glow1"></div>
      <div className="hero-bg-glow glow2"></div>

      <div className="hero-container">

        {/* LEFT CONTENT */}
        <div className="hero-content">

          <h1 className="hero-title">
            Explainable Loan Default <br />
            Prediction System
          </h1>

          <p className="hero-subtitle">
            AI‑powered risk prediction with full transparency
            and actionable insights.
          </p>

          <div className="hero-buttons">
            <button className="btn-primary">
              Start Prediction
            </button>

            <button className="btn-secondary">
              Learn More →
            </button>
          </div>

        </div>

        {/* RIGHT DASHBOARD IMAGE */}
        <div className="hero-image-wrapper">

          <img
            src={dashboard}
            alt="Dashboard"
            className="hero-dashboard"
          />

          {/* Floating Cards */}
          <div className="floating-card card1">
            💲
          </div>

          <div className="floating-card card2">
            ✔
          </div>

          <div className="floating-card card3">
            📊
          </div>

        </div>

      </div>
    </section>
  );
};

export default Hero;