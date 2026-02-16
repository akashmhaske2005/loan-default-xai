const Footer = () => {
  return (
    <footer className="bg-slate-900 text-gray-300 px-10 py-12 mt-20">
      <div className="grid md:grid-cols-3 gap-8">

        <div>
          <h2 className="text-lg font-semibold text-white">LoanXAI</h2>
          <p className="mt-2">
            Explainable AI system for predicting loan default risk
            with transparent decision insights.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white">Quick Links</h2>
          <ul className="mt-2 space-y-2">
            <li>Home</li>
            <li>Prediction</li>
            <li>Documentation</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white">Team</h2>
          <p className="mt-2">Final Year AI Research Project</p>
        </div>

      </div>

      <p className="text-center mt-8 text-sm">
        © 2026 LoanXAI Project
      </p>
    </footer>
  );
};

export default Footer;