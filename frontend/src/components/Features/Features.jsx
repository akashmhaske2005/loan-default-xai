import React, { useState } from "react";
import "./Features.css";
import { motion } from "framer-motion";
import { FaShieldAlt, FaBrain, FaChartLine } from "react-icons/fa";

const cardVariants = {
  hidden: { opacity: 0, y: 80 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.2,
      duration: 0.8,
      ease: "easeOut"
    }
  })
};

const Features = () => {
  const [activeCard, setActiveCard] = useState(null);

  return (
    <section className="features-section">

      <div className="features-container">

        <motion.h2
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="features-title"
        >
          What XAI Does
        </motion.h2>

        <p className="features-subtitle">Key Features</p>

        <div className="features-grid">

          {/* ================= CARD 1 ================= */}
          <motion.div
            custom={0}
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="feature-card"
            onMouseEnter={() => setActiveCard(1)}
            onMouseLeave={() => setActiveCard(null)}
          >
            <FaShieldAlt className="feature-icon" />
            <h3>Risk Analysis</h3>
            <p>Accurate default probability prediction</p>

            {/* Confidence Meter */}
            <div className="confidence-meter">
              <div className="circle">
                <span>82%</span>
              </div>
            </div>
          </motion.div>

          {/* ================= CARD 2 ================= */}
          <motion.div
            custom={1}
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="feature-card"
            onMouseEnter={() => setActiveCard(2)}
            onMouseLeave={() => setActiveCard(null)}
          >
            <FaBrain className="feature-icon" />
            <h3>Explainable Insights</h3>
            <p>Transparent feature-level explanations</p>

            {activeCard === 2 && (
              <motion.div
                className="shap-popup"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="waterfall positive">+ Income</div>
                <div className="waterfall negative">- Debt</div>
                <div className="waterfall positive">+ Credit Score</div>
              </motion.div>
            )}
          </motion.div>

          {/* ================= CARD 3 ================= */}
          <motion.div
            custom={2}
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="feature-card"
          >
            <FaChartLine className="feature-icon" />
            <h3>Automated Reports</h3>
            <p>Clear financial risk summaries</p>

            <div className="report-graph"></div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default Features;