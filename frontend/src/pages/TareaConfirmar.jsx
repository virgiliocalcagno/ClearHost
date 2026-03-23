import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function TareaConfirmar() {
  const { tareaId } = useParams();
  const [tarea, setTarea] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, success, error
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTarea = async () => {
      try {
        // Usamos un endpoint público que crearemos en el backend
        const res = await api.get(`/tareas/public/${tareaId}`);
        setTarea(res.data);
      } catch (err) {
        setError("No se pudo cargar la información de la tarea. Es posible que el enlace haya expirado o sea inválido.");
      } finally {
        setLoading(false);
      }
    };
    fetchTarea();
  }, [tareaId]);

  const handleAction = async (action) => {
    try {
      setLoading(true);
      if (action === 'aceptar') {
        // Reutilizamos el endpoint existente pero lo haremos público o crearemos uno nuevo sin auth obligatoria para este link
        await api.put(`/tareas/public/${tareaId}/aceptar`);
        setStatus('success');
      } else {
        await api.put(`/tareas/public/${tareaId}/rechazar`);
        setStatus('rejected');
      }
    } catch (err) {
      setError("Error al procesar la acción. Por favor intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !tarea) return <div className="loading-screen">Cargando detalles de tarea...</div>;
  if (error) return (
    <div className="confirm-container">
      <div className="confirm-card error">
        <h3>⚠️ Oops</h3>
        <p>{error}</p>
        <button onClick={() => navigate('/login')} className="btn-primary">Ir al Login</button>
      </div>
    </div>
  );

  if (status === 'success') return (
    <div className="confirm-container">
      <div className="confirm-card success">
        <div className="confirm-icon">✅</div>
        <h3>Tarea Aceptada</h3>
        <p>¡Gracias! La tarea <strong>T-{tarea?.id_secuencial}</strong> ha sido confirmada. Ya puedes verla en tu aplicación.</p>
        <button onClick={() => navigate('/dashboard')} className="btn-primary" style={{marginTop:20}}>Ir a mis tareas</button>
      </div>
    </div>
  );

  if (status === 'rejected') return (
    <div className="confirm-container">
      <div className="confirm-card error">
        <div className="confirm-icon">❌</div>
        <h3>Tarea Rechazada</h3>
        <p>Has rechazado la tarea. Por favor, contacta al administrador si fue un error.</p>
        <button onClick={() => navigate('/dashboard')} className="btn-outline" style={{marginTop:20}}>Cerrar</button>
      </div>
    </div>
  );

  const isYaAceptada = ['ACEPTADA', 'EN_PROGRESO', 'CLEAN_AND_READY', 'VERIFICADA', 'COMPLETADA'].includes(tarea?.estado);

  return (
    <div className="confirm-container">
      <div className="confirm-card">
        <div className="confirm-badge">
          {isYaAceptada ? 'Tarea Confirmada' : 'Nueva Tarea Asignada'}
        </div>
        <h1>{isYaAceptada ? 'Resumen de Tarea' : (tarea?.tipo_tarea || 'Limpieza')}</h1>
        
        {isYaAceptada && (
          <div style={{ marginTop: 15, color: '#16a34a', fontWeight: 600, fontSize: '15px' }}>
            ✨ Ya has aceptado esta tarea
          </div>
        )}

        <div className="confirm-details">
          <div className="detail-row">
            <span className="label">🏠 Propiedad:</span>
            <span className="value">{tarea?.nombre_propiedad}</span>
          </div>
          <div className="detail-row">
            <span className="label">📅 Fecha:</span>
            <span className="value">{new Date(tarea?.fecha_programada).toLocaleDateString('es-ES', {weekday: 'long', day:'numeric', month:'long'})}</span>
          </div>
          <div className="detail-row">
            <span className="label">🕒 Hora Inicio:</span>
            <span className="value">{tarea?.hora_inicio?.substring(0, 5) || '11:00'}</span>
          </div>
          {tarea?.nombre_huesped && (
            <div className="detail-row">
              <span className="label">👤 Huésped:</span>
              <span className="value">{tarea?.nombre_huesped}</span>
            </div>
          )}
          <div className="detail-row">
            <span className="label">📋 Estado:</span>
            <span className="value" style={{ color: isYaAceptada ? '#16a34a' : 'inherit' }}>
              {isYaAceptada ? 'Confirmada' : 'Esperando Confirmación'}
            </span>
          </div>
        </div>
        
        {!isYaAceptada ? (
          <div style={{marginTop:30, display:'flex', flexDirection:'column', gap:12}}>
            <button 
              className="btn-primary btn-large" 
              onClick={() => handleAction('aceptar')}
              disabled={loading}
            >
              {loading ? 'Procesando...' : '✓ Aceptar Tarea'}
            </button>
            <button 
              className="btn-outline btn-large" 
              onClick={() => handleAction('rechazar')}
              disabled={loading}
              style={{color:'#EF4444', borderColor:'#EF4444'}}
            >
              ✕ Rechazar Tarea
            </button>
          </div>
        ) : (
          <div style={{marginTop:30}}>
            <button onClick={() => navigate('/dashboard')} className="btn-primary btn-large">
              Ir a mis tareas
            </button>
          </div>
        )}
      </div>

      <style>{`
        .confirm-container {
          min-height: 100vh;
          background: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          font-family: 'Inter', sans-serif;
        }
        .confirm-card {
          background: white;
          width: 100%;
          max-width: 450px;
          border-radius: 20px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          padding: 40px;
          text-align: center;
        }
        .confirm-badge {
          display: inline-block;
          background: #EEF2FF;
          color: #4F46E5;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 20px;
        }
        .confirm-icon {
          font-size: 60px;
          margin-bottom: 20px;
        }
        .confirm-details {
          background: #f1f5f9;
          border-radius: 12px;
          padding: 20px;
          text-align: left;
          margin-top: 20px;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          font-size: 14px;
        }
        .detail-row:last-child { margin-bottom: 0; }
        .detail-row .label { color: #64748b; font-weight: 500; }
        .detail-row .value { color: #1e293b; font-weight: 600; }
        
        .btn-primary {
          background: #4F46E5;
          color: white;
          border: none;
          padding: 14px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-primary:hover { background: #4338CA; transform: translateY(-1px); }
        .btn-outline {
          background: transparent;
          border: 2px solid #e2e8f0;
          color: #475569;
          padding: 14px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 16px;
          cursor: pointer;
        }
        .btn-large { width: 100%; }
        h1 { margin: 0; font-size: 24px; color: #1e293b; }
      `}</style>
    </div>
  );
}
