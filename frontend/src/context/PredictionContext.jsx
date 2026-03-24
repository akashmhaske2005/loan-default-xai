import React, { createContext, useContext, useState } from 'react';

const PredictionContext = createContext(null);

export function PredictionProvider({ children }) {
    const [predictionResult, setPredictionResult] = useState(null);
    const [formData, setFormData] = useState(null);

    return (
        <PredictionContext.Provider value={{ predictionResult, setPredictionResult, formData, setFormData }}>
            {children}
        </PredictionContext.Provider>
    );
}

export function usePredictionContext() {
    return useContext(PredictionContext);
}
