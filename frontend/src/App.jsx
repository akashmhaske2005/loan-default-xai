import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home/Home";
import Predict from "./pages/Predict";
import Result from "./pages/Result";
import Explanation from "./pages/Explanation";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/predict" element={<Predict />} />
        <Route path="/result" element={<Result />} />
        <Route path="/explain" element={<Explanation />} />
      </Routes>
    </BrowserRouter>
  );
}