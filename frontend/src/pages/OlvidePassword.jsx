import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Login.css';

export default function OlvidePassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await api.post('/staff/olvide-password', { email });
      setMessage(res.data.message);
    } catch (err) {
      setMessage('Ocurrió un error. Verifica que el servidor de correo esté configurado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="brand-title">Recuperar Contraseña</h1>
        <p className="login-subtitle">Ingresa tu correo para recibir un enlace seguro</p>

        {message && <div className="error-message" style={{backgroundColor: '#eef2ff', color: '#4f46e5'}}>{message}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label>👤 Correo Electrónico</label>
            <input
              type="email"
              required
              placeholder="Ej: juan@clearhost.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Enviando enlace...' : 'Enviar enlace'}
          </button>
        </form>
        <button onClick={() => navigate('/')} className="login-btn" style={{marginTop: 10, backgroundColor: 'transparent', color: '#4f46e5'}}>
          Volver a iniciar sesión
        </button>
      </div>
    </div>
  );
}
