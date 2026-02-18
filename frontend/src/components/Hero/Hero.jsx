import React, { useRef } from "react";
import "./Hero.css";
import dashboard from "../../assets/images/dashboard-1.png";

const Hero = () => {

  const cardRef = useRef(null);

  // 3D Tilt Effect
  const handleMouseMove = (e) => {
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const rotateX = ((y / rect.height) - 0.5) * 12;
    const rotateY = ((x / rect.width) - 0.5) * -12;

    card.style.transform =
      `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  };

  const resetTilt = () => {
    cardRef.current.style.transform = "rotateX(0) rotateY(0)";
  };

  return (
    <section className="hero">

      {/* Glow Background */}
      <div className="hero-bg-glow glow1"></div>
      <div className="hero-bg-glow glow2"></div>

      {/* Spark Particles */}
      <div className="particles"></div>

      <div className="hero-container">

        {/* LEFT SIDE */}
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

        {/* RIGHT SIDE DASHBOARD */}
        <div className="hero-image-wrapper">

          <div
            className="dashboard-card"
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={resetTilt}
          >

            <div className="dashboard-glow"></div>

            <img
              src={dashboard}
              alt="Dashboard"
              className="hero-dashboard"
            />
          </div>

          {/* Floating UI Cards */}
          <div className="floating-card card1">💲</div>
          <div className="floating-card card2">✔</div>
          <div className="floating-card card3">📊</div>

        </div>

      </div>
    </section>
  );
};

export default Hero;
