import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import "../styles/home.css";

import { motion } from "framer-motion";

export default function Home() {
  return (
    <>
      <Navbar />

      {/* HERO SECTION */}
      <section className="hero">
        <div className="hero-content">

          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Explainable Loan Default Prediction
          </motion.h1>

          <p>
            Predict borrower risk using Machine Learning and understand
            financial decisions through transparent AI explanations.
          </p>

          <div className="hero-buttons">
            <button className="btn-primary">Start Prediction</button>
            <button className="btn-secondary">Learn More</button>
          </div>
        </div>
      </section>

      {/* PROBLEM SOLUTION */}
      <section className="section">
        <div className="two-col">

          <div className="card">
            <h2>Problem</h2>
            <ul>
              <li>Risky loan approvals</li>
              <li>Manual evaluation is slow</li>
              <li>Lack of transparency</li>
            </ul>
          </div>

          <div className="card">
            <h2>Solution</h2>
            <ul>
              <li>AI‑driven prediction</li>
              <li>SHAP explainability</li>
              <li>Fast financial decision support</li>
            </ul>
          </div>

        </div>
      </section>

      {/* FEATURES */}
      <section className="section">
        <h2 className="section-title">System Features</h2>

        <div className="features">

          <div className="feature-card">Risk Prediction</div>
          <div className="feature-card">Explainable AI Visualization</div>
          <div className="feature-card">Real‑time Decision Support</div>
          <div className="feature-card">Financial Data Analysis</div>

        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section dark">
        <h2 className="section-title">How It Works</h2>

        <div className="steps">
          <div>1️⃣ Enter Borrower Data</div>
          <div>2️⃣ Model Predicts Risk</div>
          <div>3️⃣ SHAP Explains Decision</div>
          <div>4️⃣ Generate Insight</div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <h2>Ready to Analyze Loan Risk?</h2>
        <button className="btn-primary">Start Prediction</button>
      </section>

      <Footer />
    </>
  );
}