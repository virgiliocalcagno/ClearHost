import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTareaDetalle, completarTarea } from '../services/api';
import './TareaDetalle.css';

export default function TareaDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tarea, setTarea] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completando, setCompletando] = useState(false);

  useEffect(() => { loadTarea(); }, [id]);

  const loadTarea = async () => {
    try {
      const data = await getTareaDetalle(id);
      setTarea(data);
    } catch { navigate('/dashboard'); }
    finally { setLoading(false); }
  };

  const handleCompletar = async () => {
    if (!window.confirm('¿Marcar como Clean & Ready?')) return;
    setCompletando(true);
    try {
      await completarTarea(id);
      navigate('/dashboard');
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al completar');
      setCompletando(false);
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /><span>Cargando...</span></div>;
  if (!tarea) return null;

  const statusMap = {
    pendiente: { cls: 'badge-pending', txt: '⏳ Pendiente', dot: 'var(--warning)' },
    en_progreso: { cls: 'badge-progress', txt: '🔄 En Progreso', dot: 'var(--info)' },
    completada: { cls: 'badge-done', txt: '✅ Completada', dot: 'var(--success)' },
  };
  const status = statusMap[tarea.estado] || statusMap.pendiente;

  return (
    <div className="app-container">
      <div className="screen-header">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>←</button>
        <span className="screen-title">Detalle de Tarea</span>
      </div>

      <div className="td-content">
        {/* Property card */}
        <div className="card td-prop-card fade-in">
          <div className="td-prop-top">
            <h3>{tarea.nombre_propiedad || 'Propiedad'}</h3>
            <span className={`badge ${status.cls}`}>{status.txt}</span>
          </div>
          {tarea.direccion_propiedad && <p className="td-address">📍 {tarea.direccion_propiedad}</p>}
          <div className="td-info-grid">
            <div className="td-info-item">
              <span className="td-info-label">👤 Huésped</span>
              <span className="td-info-value">{tarea.nombre_huesped || 'N/A'}</span>
            </div>
            <div className="td-info-item">
              <span className="td-info-label">🕐 Check-out</span>
              <span className="td-info-value">{tarea.check_out || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Action cards */}
        <div className="td-actions fade-in" style={{animationDelay:'100ms'}}>
          <div className="td-action-card card" onClick={() => navigate(`/tarea/${id}/checklist`)}>
            <div className="td-action-icon" style={{background:'var(--primary-light)',color:'var(--primary)'}}>📋</div>
            <div className="td-action-info">
              <h4>Checklist</h4>
              <p>Lista de verificación</p>
            </div>
            <span className="td-action-arrow">›</span>
          </div>

          <div className="td-action-card card" onClick={() => navigate(`/tarea/${id}/auditoria`)}>
            <div className="td-action-icon" style={{background:'var(--info-light)',color:'var(--info)'}}>🔍</div>
            <div className="td-action-info">
              <h4>Auditoría</h4>
              <p>Verificar activos</p>
            </div>
            <span className="td-action-arrow">›</span>
          </div>

          <div className="td-action-card card" onClick={() => navigate(`/tarea/${id}/fotos`)}>
            <div className="td-action-icon" style={{background:'var(--warning-light)',color:'var(--warning)'}}>📸</div>
            <div className="td-action-info">
              <h4>Evidencia</h4>
              <p>Fotos antes y después</p>
            </div>
            <span className="td-action-arrow">›</span>
          </div>
        </div>
      </div>

      {/* CTA fijo */}
      {tarea.estado !== 'completada' && (
        <div className="bottom-bar">
          <button className="btn btn-success" onClick={handleCompletar} disabled={completando}>
            {completando ? <div className="spinner" style={{width:20,height:20,borderWidth:2,borderTopColor:'white'}} /> : '✅ Clean & Ready'}
          </button>
        </div>
      )}
    </div>
  );
}
