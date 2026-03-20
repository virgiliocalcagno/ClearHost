import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, getStoredStaff } from '../services/api';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Completa todos los campos'); return; }
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      const staff = getStoredStaff();
      navigate(staff?.rol === 'ADMIN' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card card fade-in">
        <div className="login-logo">
          <div className="logo-icon">✦</div>
          <h1>ClearHost</h1>
          <p>Portal del Staff</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>📧 Email</label>
            <input
              className="input-field"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="input-group">
            <label>🔒 Contraseña</label>
            <input
              className="input-field"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <div className="login-error">⚠️ {error}</div>}

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? <div className="spinner" style={{width:20,height:20,borderWidth:2}} /> : '🔑 Entrar'}
          </button>
        </form>

        <p className="login-footer">ClearHost PMS v1.0</p>
      </div>
    </div>
  );
}
