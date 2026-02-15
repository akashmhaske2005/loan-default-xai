import { useState } from "react";
import { predictLoan } from "../services/api";

export default function usePrediction() {

  const [loading, setLoading] = useState(false);

  const predict = async (data) => {
    setLoading(true);
    await predictLoan(data);
    setLoading(false);
  };

  return { predict, loading };
}