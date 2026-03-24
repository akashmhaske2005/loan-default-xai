import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { predictLoan } from '../services/api';
import { usePredictionContext } from '../context/PredictionContext';

export default function usePrediction() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // planLimitReached: { used, limit, currentPlan } or null
  const [planLimitReached, setPlanLimitReached] = useState(null);
  const { setPredictionResult, setFormData } = usePredictionContext();
  const navigate = useNavigate();

  const predict = async (data) => {
    setLoading(true);
    setError(null);
    setPlanLimitReached(null);
    try {
      setFormData(data);
      const result = await predictLoan(data);
      if (result.error) throw new Error(result.error);
      setPredictionResult(result);
      navigate('/result');
    } catch (err) {
      if (err.message === 'UNAUTHORIZED') {
        navigate('/login');
      } else if (err.limitReached) {
        // Show upgrade modal instead of plain text error
        setPlanLimitReached({
          used: err.used,
          limit: err.limit,
          currentPlan: err.currentPlan,
        });
      } else {
        setError(err.message || 'Prediction failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return { predict, loading, error, planLimitReached, clearPlanLimit: () => setPlanLimitReached(null) };
}