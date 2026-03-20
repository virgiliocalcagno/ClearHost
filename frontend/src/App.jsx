import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated, getStoredStaff } from './services/api';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TareaDetalle from './pages/TareaDetalle';
import Checklist from './pages/Checklist';
import Auditoria from './pages/Auditoria';
import Fotos from './pages/Fotos';
import AdminPanel from './pages/AdminPanel';
import OlvidePassword from './pages/OlvidePassword';
import RecuperarPassword from './pages/RecuperarPassword';
import AprobarReparacion from './pages/AprobarReparacion';

function ProtectedRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/" />;
}

function AdminRoute({ children }) {
  if (!isAuthenticated()) return <Navigate to="/" />;
  const staff = getStoredStaff();
  if (staff?.rol !== 'ADMIN') return <Navigate to="/dashboard" />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/olvide-password" element={<OlvidePassword />} />
        <Route path="/recuperar-password" element={<RecuperarPassword />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
        <Route path="/tarea/:id" element={<ProtectedRoute><TareaDetalle /></ProtectedRoute>} />
        <Route path="/tarea/:id/checklist" element={<ProtectedRoute><Checklist /></ProtectedRoute>} />
        <Route path="/tarea/:id/auditoria" element={<ProtectedRoute><Auditoria /></ProtectedRoute>} />
        <Route path="/tarea/:id/fotos" element={<ProtectedRoute><Fotos /></ProtectedRoute>} />
        <Route path="/reparacion/aprobar/:token" element={<AprobarReparacion />} />
      </Routes>
    </BrowserRouter>
  );
}
