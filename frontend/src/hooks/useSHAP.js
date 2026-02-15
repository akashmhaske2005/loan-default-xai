import { useState } from "react";
import axios from "axios";

export default function useSHAP() {

  const [shapData, setShapData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchSHAP = async (payload) => {

    try {
      setLoading(true);

      const res = await axios.post(
        "http://localhost:5000/shap",
        payload
      );

      setShapData(res.data);

    } catch (err) {
      console.error("SHAP error", err);
    } finally {
      setLoading(false);
    }
  };

  return { shapData, loading, fetchSHAP };
}