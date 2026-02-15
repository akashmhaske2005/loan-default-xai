import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <motion.nav 
      className="navbar"
      initial={{ y: -60 }}
      animate={{ y: 0 }}
    >
      <h2>Loan Insight</h2>

      <div>
        <Link to="/">Home</Link>
        <Link to="/predict">Predict</Link>
        <Link to="/explain">Explanation</Link>
      </div>
    </motion.nav>
  );
}