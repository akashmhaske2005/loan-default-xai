import Navbar from "../components/layout/Navbar";
import Card from "../components/ui/Card";

export default function Explanation() {

  return (
    <>
      <Navbar />

      <div className="container">

        <Card>
          <h2>SHAP Explanation</h2>

          <p>
            Red increases risk. Blue decreases risk.
          </p>

          <div className="chart-placeholder">
            SHAP Chart Here
          </div>

        </Card>

      </div>
    </>
  );
}