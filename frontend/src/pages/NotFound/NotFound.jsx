import { Link } from "react-router-dom";
import "./NotFound.css";

export default function NotFound() {
    return (
        <div className="nf-page">
            <div className="nf-content">
                <div className="nf-code-wrap">
                    <div className="nf-blur-circle nf-blur-1" />
                    <div className="nf-blur-circle nf-blur-2" />
                    <span className="nf-code">404</span>
                </div>
                <h1 className="nf-title">Page Not Found</h1>
                <p className="nf-sub">
                    The page you're looking for doesn't exist or has been moved.
                    Let's get you back to your dashboard.
                </p>
                <div className="nf-actions">
                    <Link to="/" className="nf-btn nf-btn--primary">← Go to Home</Link>
                    <Link to="/predict" className="nf-btn nf-btn--secondary">Run a Prediction</Link>
                </div>
                <div className="nf-decoration">
                    <div className="nf-orbit nf-orbit--1" />
                    <div className="nf-orbit nf-orbit--2" />
                    <div className="nf-planet">🏦</div>
                </div>
            </div>
        </div>
    );
}
