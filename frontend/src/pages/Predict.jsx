import { useState } from "react";
import Navbar from "../components/layout/Navbar";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import usePrediction from "../hooks/usePrediction";

export default function Predict() {

  const [form, setForm] = useState({});
  const { predict, loading } = usePrediction();

  const handleSubmit = () => {
    predict(form);
  };

  return (
    <>
      <Navbar />

      <div className="container">

        <Card>
          <h2>Borrower Data Input</h2>

          <input
            placeholder="Age"
            onChange={(e) =>
              setForm({ ...form, age: e.target.value })
            }
          />

          <input
            placeholder="Income"
            onChange={(e) =>
              setForm({ ...form, income: e.target.value })
            }
          />

          <Button onClick={handleSubmit}>
            Predict Risk
          </Button>

          {loading && <p>Analyzing borrower risk...</p>}

        </Card>
      </div>
    </>
  );
}