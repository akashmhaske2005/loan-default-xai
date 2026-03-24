import { useState } from "react";

const getToken = () => localStorage.getItem('loanxai_token') || '';

export default function useSHAP() {
  const [shapData, setShapData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchSHAP = async (payload) => {
    try {
      setLoading(true);
      const res = await fetch("/shap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        setShapData(data);
      }
    } catch (err) {
      console.error("SHAP error", err);
    } finally {
      setLoading(false);
    }
  };

  return { shapData, loading, fetchSHAP };
}