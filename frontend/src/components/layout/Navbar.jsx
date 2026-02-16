import { Link } from "react-router-dom";
import "../../styles/navbar.css";

export default function Navbar() {
  return (
    <nav className="navbar">
      <h2 className="logo">LoanXAI</h2>

      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/predict">Predict</Link>
        <Link to="/docs">Docs</Link>
        <Link to="/about">About</Link>
      </div>
    </nav>
  );
}