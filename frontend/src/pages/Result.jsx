import Navbar from "../components/layout/Navbar";
import Card from "../components/ui/Card";
import GaugeChart from "../components/ui/GaugeChart";

export default function Result() {

  const probability = 0.78;

  return (
    <>
      <Navbar />

      <div className="container">

        <Card>
          <h2 className="risk">High Risk</h2>

          <GaugeChart value={probability} />

          <p>
            Risk mainly due to high loan to income ratio.
          </p>

        </Card>

      </div>
    </>
  );
}