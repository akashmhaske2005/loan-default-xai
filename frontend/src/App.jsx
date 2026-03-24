import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PredictionProvider } from './context/PredictionContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';

import Home from './pages/Home/Home';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Predict from './pages/Predict';
import Result from './pages/Result';
import Explanation from './pages/Explanation';
import History from './pages/History/History';
import Admin from './pages/Admin/Admin';
import ForgotPassword from './pages/Auth/ForgotPassword';
import OtpVerify from './pages/Auth/OtpVerify';
import ResetPassword from './pages/Auth/ResetPassword';
import About from './pages/About/About';
import Pricing from './pages/Pricing/Pricing';
import NotFound from './pages/NotFound/NotFound';
import UpgradeConfirm from './pages/Upgrade/UpgradeConfirm';
import UpgradeSuccess from './pages/Upgrade/UpgradeSuccess';

// Apply saved theme on startup
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <PredictionProvider>
          <BrowserRouter>
            <Routes>
              {/* Public */}
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/verify-otp" element={<OtpVerify />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Protected */}
              <Route path="/predict" element={<ProtectedRoute><Predict /></ProtectedRoute>} />
              <Route path="/result" element={<ProtectedRoute><Result /></ProtectedRoute>} />
              <Route path="/explain" element={<ProtectedRoute><Explanation /></ProtectedRoute>} />
              <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
              <Route path="/upgrade-confirm" element={<ProtectedRoute><UpgradeConfirm /></ProtectedRoute>} />
              <Route path="/upgrade-success" element={<ProtectedRoute><UpgradeSuccess /></ProtectedRoute>} />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </PredictionProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
