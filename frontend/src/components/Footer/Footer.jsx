import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">

      <div className="footer-grid">

        <div>
          <h4>Quick Links</h4>
          <p>Home</p>
          <p>Predict</p>
          <p>Docs</p>
        </div>

        <div>
          <h4>Resources</h4>
          <p>Blog</p>
          <p>FAQs</p>
        </div>

        <div>
          <h4>Company</h4>
          <p>About Us</p>
          <p>Privacy Policy</p>
        </div>

        <div>
          <h4>Contact</h4>
          <p>support@loanxai.com</p>
          <p>+1 800 123 4567</p>
        </div>

      </div>

      <p className="copyright">
        © 2026 LoanXAI
      </p>

    </footer>
  );
}