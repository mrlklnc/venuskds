import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Analizler from "./pages/Analizler";
import Simulasyon from "./pages/Simulasyon";
import FinansalSenaryolar from "./pages/FinansalSenaryolar";
import HaritaPage from "./pages/HaritaPage";
import KararOzeti from "./pages/KararOzeti";
import AppLayout from "./layout/AppLayout";
import ProtectedRoute from "./routes/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      {/* Public route */}
      <Route path="/login" element={<Login />} />

      {/* Protected routes */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/analizler" element={<Analizler />} />
        <Route path="/simulasyon" element={<Simulasyon />} />
        <Route path="/finansal-senaryolar" element={<FinansalSenaryolar />} />
        <Route path="/harita" element={<HaritaPage />} />
        <Route path="/karar-ozeti" element={<KararOzeti />} />
      </Route>

      {/* Catch all - redirect to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
