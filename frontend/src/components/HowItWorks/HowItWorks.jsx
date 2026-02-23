import React, { useRef } from "react";
import "./HowItWorks.css";
import { motion, useInView } from "framer-motion";

const cardVariants = {
  hidden: { opacity: 0, y: 80 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.4,
      duration: 0.9,
      ease: "easeOut"
    }
  })
};

const connectorVariants = {
  hidden: { opacity: 0, scaleX: 0 },
  visible: (i) => ({
    opacity: 1,
    scaleX: 1,
    transition: {
      delay: 0.8 + i * 0.4,
      duration: 0.8,
      ease: "easeOut"
    }
  })
};

const NeuralNet = () => (
  <svg viewBox="0 0 300 150" className="neural-svg">
    {[
      [50, 30, 150, 40],
      [50, 75, 150, 75],
      [50, 120, 150, 110],
      [150, 40, 250, 30],
      [150, 75, 250, 75],
      [150, 110, 250, 120]
    ].map((line, i) => (
      <line
        key={i}
        x1={line[0]}
        y1={line[1]}
        x2={line[2]}
        y2={line[3]}
        className="neural-line"
      />
    ))}

    {[50, 75, 120].map((y, i) => (
      <circle key={`l-${i}`} cx="50" cy={y} r="8" className="neural-node" />
    ))}
    {[40, 75, 110].map((y, i) => (
      <circle key={`m-${i}`} cx="150" cy={y} r="8" className="neural-node" />
    ))}
    {[30, 75, 120].map((y, i) => (
      <circle key={`r-${i}`} cx="250" cy={y} r="8" className="neural-node" />
    ))}
  </svg>
);

const HowItWorks = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  return (
    <section className="how-section" ref={ref}>

      {/* Parallax Glow */}
      <div className="bg-glow"></div>

      <motion.h2
        className="how-title"
        initial={{ opacity: 0, y: -40 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8 }}
      >
        How It Works
      </motion.h2>

      <div className="how-grid">

        {/* STEP 1 */}
        <motion.div
          className="how-card"
          custom={0}
          variants={cardVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          <h3>1. Input Financial Data</h3>

          <div className="input-box">Income</div>
          <div className="input-box">Expenses</div>
          <div className="input-box">Assets</div>
          <div className="input-box">Liabilities</div>

          <button className="upload-btn">Upload Files</button>

          <p className="card-subtext">
            Secure data validation & preprocessing
          </p>
        </motion.div>

        {/* CONNECTOR 1 */}
        <motion.div
          className="connector"
          custom={0}
          variants={connectorVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          <span className="particle"></span>
        </motion.div>

        {/* STEP 2 */}
        <motion.div
          className="how-card highlight"
          custom={1}
          variants={cardVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          <h3>2. AI Risk Prediction</h3>

          <NeuralNet />

          <div className="risk-meter">
            <div className="meter-bar">
              <motion.div
                className="meter-fill"
                initial={{ width: 0 }}
                animate={inView ? { width: "82%" } : { width: 0 }}
                transition={{ duration: 1.5, delay: 1.2 }}
              />
            </div>
            <span className="risk-text">Risk Score: 0.82</span>
          </div>

          <p className="card-subtext">
            Probability-based ML inference
          </p>
        </motion.div>

        {/* CONNECTOR 2 */}
        <motion.div
          className="connector"
          custom={1}
          variants={connectorVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          <span className="particle"></span>
        </motion.div>

        {/* STEP 3 */}
        <motion.div
          className="how-card"
          custom={2}
          variants={cardVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          <h3>3. Explainable Results</h3>

          <div className="shap-bars">
            <div className="bar positive"></div>
            <div className="bar positive short"></div>
            <div className="bar negative"></div>
            <div className="bar negative short"></div>
          </div>

          <p className="card-subtext">
            SHAP-powered feature explanations
          </p>
        </motion.div>

      </div>
    </section>
  );
};

export default HowItWorks;