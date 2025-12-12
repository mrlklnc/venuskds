import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './layouts/AdminLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MusteriPage from './pages/MusteriPage';
import RandevuPage from './pages/RandevuPage';
import HizmetPage from './pages/HizmetPage';
import KampanyaPage from './pages/KampanyaPage';
import RakipPage from './pages/RakipPage';
import MasrafPage from './pages/MasrafPage';
import DSSPage from './pages/DSSPage';
import Analizler from './pages/Analizler';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="analizler" element={<Analizler />} />
          <Route path="musteri" element={<MusteriPage />} />
          <Route path="randevu" element={<RandevuPage />} />
          <Route path="hizmet" element={<HizmetPage />} />
          <Route path="kampanya" element={<KampanyaPage />} />
          <Route path="rakip" element={<RakipPage />} />
          <Route path="masraf" element={<MasrafPage />} />
          <Route path="dss" element={<DSSPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
