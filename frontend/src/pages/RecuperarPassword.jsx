import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import './Login.css';

export default function RecuperarPassword() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setError('Enlace inválido o expirado. Vuelve a solicitar el cambio.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (password.length < 6) {
      setError('Debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const res = await api.post('/staff/reset-password', {
        token: token,
        new_password: password
      });
      setSuccess('¡Contraseña actualizada exitosamente!');
      setTimeout(() => navigate('/'), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cambiar la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="brand-title">Nueva Contraseña</h1>
        <p className="login-subtitle">Escribe tu nueva clave y confírmala</p>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="error-message" style={{backgroundColor: '#eef2ff', color: '#4f46e5'}}>{success} Redirigiendo...</div>}

        {!success && token && (
          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-group">
              <label>🔒 Nueva Contraseña</label>
              <input
                type="password"
                required
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
              />
            </div>
            
            <div className="input-group">
              <label>🔒 Confirmar Contraseña</label>
              <input
                type="password"
                required
                placeholder="Repite la clave"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="input-field"
              />
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Guardando...' : 'Cambiar Contraseña'}
            </button>
          </form>
        )}
        
        <button onClick={() => navigate('/')} className="login-btn" style={{marginTop: 10, backgroundColor: 'transparent', color: '#4f46e5'}}>
          Volver al Login
        </button>
      </div>
    </div>
  );
}
