import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTareaDetalle, actualizarChecklist } from '../services/api';
import './Checklist.css';

export default function Checklist() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadChecklist(); }, [id]);

  const loadChecklist = async () => {
    try {
      const tarea = await getTareaDetalle(id);
      setItems(tarea.checklist || [
        { item: 'Baños limpios', completado: false, requerido: true },
        { item: 'Cocina limpia', completado: false, requerido: true },
        { item: 'Sábanas limpias', completado: false, requerido: true },
        { item: 'Toallas nuevas', completado: false, requerido: true },
        { item: 'Piso aspirado/trapeado', completado: false, requerido: true },
        { item: 'Basura retirada', completado: false, requerido: true },
        { item: 'Espejos limpios', completado: false, requerido: false },
        { item: 'Amenidades repuestas', completado: false, requerido: false },
      ]);
    } catch { navigate(`/tarea/${id}`); }
    finally { setLoading(false); }
  };

  const toggleItem = (index) => {
    setItems(prev => prev.map((item, i) =>
      i === index ? { ...item, completado: !item.completado } : item
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await actualizarChecklist(id, items);
      navigate(`/tarea/${id}`);
    } catch (err) {
      alert('Error al guardar');
    } finally { setSaving(false); }
  };

  const completed = items.filter(i => i.completado).length;
  const total = items.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  if (loading) return <div className="loading-screen"><div className="spinner" /><span>Cargando...</span></div>;

  return (
    <div className="app-container">
      <div className="screen-header">
        <button className="back-btn" onClick={() => navigate(`/tarea/${id}`)}>←</button>
        <span className="screen-title">Checklist</span>
      </div>

      <div className="cl-content">
        {/* Progress card */}
        <div className="card cl-progress-card fade-in">
          <div className="cl-progress-circle">
            <svg viewBox="0 0 60 60" className="cl-circle-svg">
              <circle cx="30" cy="30" r="26" className="cl-circle-bg" />
              <circle cx="30" cy="30" r="26" className="cl-circle-fill"
                style={{ strokeDasharray: `${pct * 1.63} 163` }} />
            </svg>
            <span className="cl-circle-text">{pct}%</span>
          </div>
          <div className="cl-progress-info">
            <span className="cl-progress-count">{completed} de {total} completadas</span>
            <div className="progress-bar" style={{marginTop:8}}>
              <div className="progress-fill" style={{width:`${pct}%`}} />
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="cl-list">
          {items.map((item, i) => (
            <div
              key={i}
              className={`cl-item card fade-in ${item.completado ? 'cl-item-done' : ''}`}
              style={{animationDelay:`${i*50}ms`}}
              onClick={() => toggleItem(i)}
            >
              <div className={`cl-checkbox ${item.completado ? 'cl-checked' : ''}`}>
                {item.completado && '✓'}
              </div>
              <div className="cl-item-info">
                <span className={`cl-item-name ${item.completado ? 'cl-name-done' : ''}`}>
                  {item.item}
                </span>
                {item.requerido && !item.completado && (
                  <span className="badge badge-required">Obligatorio</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bottom-bar">
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? <div className="spinner" style={{width:20,height:20,borderWidth:2,borderTopColor:'white'}} /> : '💾 Guardar Checklist'}
        </button>
      </div>
    </div>
  );
}
