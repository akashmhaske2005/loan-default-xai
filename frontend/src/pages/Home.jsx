import Navbar from "../components/layout/Navbar";
import Button from "../components/ui/Button";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function Home() {

  const navigate = useNavigate();

  return (
    <>
      <Navbar />

      <section className="hero container">

        <motion.div
          initial={{ opacity: 0, x: -80 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1>Explainable Loan Default Prediction</h1>

          <p>
            Predict borrower risk using machine learning and
            transparent AI explanations.
          </p>

          <Button onClick={() => navigate("/predict")}>
            Start Prediction
          </Button>
        </motion.div>

      </section>
    </>
  );
}