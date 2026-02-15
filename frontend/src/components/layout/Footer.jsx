import "../styles/global.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">

        <div>
          <h3>Loan Insight</h3>
          <p>Explainable AI Loan Risk Analysis Platform</p>
        </div>

        <div>
          <h4>Quick Links</h4>
          <p>Home</p>
          <p>Prediction</p>
          <p>Documentation</p>
        </div>

        <div>
          <h4>Contact</h4>
          <p>loaninsight@email.com</p>
        </div>

      </div>

      <div className="footer-bottom">
        © 2026 Loan Insight. All Rights Reserved.
      </div>
    </footer>
  );
}