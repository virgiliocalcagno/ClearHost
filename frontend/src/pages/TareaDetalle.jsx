import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTareaDetalle, completarTarea, aceptarTarea } from '../services/api';
import './TareaDetalle.css';

export default function TareaDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tarea, setTarea] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completando, setCompletando] = useState(false);
  const [aceptando, setAceptando] = useState(false);

  useEffect(() => { loadTarea(); }, [id]);

  const loadTarea = async () => {
    try {
      const data = await getTareaDetalle(id);
      setTarea(data);
    } catch { navigate('/dashboard'); }
    finally { setLoading(false); }
  };

  const handleAceptar = async () => {
    setAceptando(true);
    try {
      const updated = await aceptarTarea(id);
      setTarea(updated);
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al aceptar');
    } finally {
      setAceptando(false);
    }
  };

  const handleCompletar = async () => {
    if (!window.confirm('¿Deseas marcar esta tarea como Clean & Ready? (El administrador lo verificará)')) return;
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
    PENDIENTE: { cls: 'badge-pending', txt: 'Pendiente', dot: 'var(--warning)' },
    ASIGNADA_NO_CONFIRMADA: { cls: 'badge-pending', txt: 'Falta Aceptar', dot: 'var(--warning)' },
    ACEPTADA: { cls: 'badge-progress', txt: 'Aceptada', dot: 'var(--info)' },
    EN_PROGRESO: { cls: 'badge-progress', txt: 'En Progreso', dot: 'var(--info)' },
    CLEAN_AND_READY: { cls: 'badge-done', txt: 'Clean & Ready ✅', dot: 'var(--success)' },
    COMPLETADA: { cls: 'badge-done', txt: 'Clean & Ready ✅', dot: 'var(--success)' },
    VERIFICADA: { cls: 'badge-done', txt: 'Verificada ✅', dot: 'var(--success)' },
  };
  const status = statusMap[tarea.estado] || statusMap.PENDIENTE;

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

        {/* Action cards - Only if accepted/progressing */}
        {tarea.estado === 'ASIGNADA_NO_CONFIRMADA' ? (
          <div className="card fade-in" style={{animationDelay:'100ms', textAlign: 'center', padding: '30px 20px'}}>
            <h4 style={{marginBottom: 10}}>⚠️ Confirmar Asignación</h4>
            <p style={{color: 'var(--text-secondary)', marginBottom: 20, fontSize: 13}}>
              Debes aceptar esta tarea para ver checklist y evidencias.
            </p>
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', fontSize: '18px', padding: '16px', fontWeight: 800, background: '#25D366', borderColor: '#25D366' }}
              onClick={handleAceptar}
              disabled={aceptando}
            >
              {aceptando ? <div className="spinner" style={{width:20,height:20,borderWidth:2,borderTopColor:'white'}} /> : 'ACEPTAR TAREA'}
            </button>
          </div>
        ) : (
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
        )}
      </div>

      {/* CTA fijo (Clean & Ready) */}
      {(!['ASIGNADA_NO_CONFIRMADA', 'CLEAN_AND_READY', 'COMPLETADA', 'VERIFICADA'].includes(tarea.estado)) && (
        <div className="bottom-bar fade-in">
          <button className="btn" style={{background: 'var(--text)', color: 'white', fontWeight: 700}} onClick={handleCompletar} disabled={completando}>
            {completando ? <div className="spinner" style={{width:20,height:20,borderWidth:2,borderTopColor:'white'}} /> : '✅ Marcar Clean & Ready'}
          </button>
        </div>
      )}
    </div>
  );
}
