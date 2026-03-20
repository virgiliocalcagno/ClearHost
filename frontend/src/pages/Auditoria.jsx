import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTareaDetalle, actualizarAuditoria } from '../services/api';
import './Auditoria.css';

const ESTADOS = ['OK', 'FALTANTE', 'DAÑADO'];
const ESTADO_EMOJI = { OK: '✅', FALTANTE: '❌', DAÑADO: '⚠️' };
const ESTADO_CLS = { OK: 'aud-ok', FALTANTE: 'aud-faltante', DAÑADO: 'aud-dañado' };

export default function Auditoria() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadAuditoria(); }, [id]);

  const loadAuditoria = async () => {
    try {
      const tarea = await getTareaDetalle(id);
      setItems(tarea.auditoria_activos || [
        { activo: 'Toallas', cantidad_esperada: 6, cantidad_encontrada: 6, estado: 'OK' },
        { activo: 'Almohadas', cantidad_esperada: 4, cantidad_encontrada: 4, estado: 'OK' },
        { activo: 'Sábanas', cantidad_esperada: 2, cantidad_encontrada: 2, estado: 'OK' },
        { activo: 'Control remoto TV', cantidad_esperada: 1, cantidad_encontrada: 1, estado: 'OK' },
        { activo: 'Llaves', cantidad_esperada: 2, cantidad_encontrada: 2, estado: 'OK' },
        { activo: 'Utensilios cocina', cantidad_esperada: 1, cantidad_encontrada: 1, estado: 'OK' },
      ]);
    } catch { navigate(`/tarea/${id}`); }
    finally { setLoading(false); }
  };

  const cycleEstado = (index) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      const currentIdx = ESTADOS.indexOf(item.estado.toUpperCase());
      const nextIdx = (currentIdx + 1) % ESTADOS.length;
      return { ...item, estado: ESTADOS[nextIdx] };
    }));
  };

  const updateCantidad = (index, val) => {
    const num = parseInt(val) || 0;
    setItems(prev => prev.map((item, i) =>
      i === index ? { ...item, cantidad_encontrada: num } : item
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await actualizarAuditoria(id, items);
      navigate(`/tarea/${id}`);
    } catch { alert('Error al guardar'); }
    finally { setSaving(false); }
  };

  const problems = items.filter(i => i.estado.toUpperCase() !== 'OK').length;

  if (loading) return <div className="loading-screen"><div className="spinner" /><span>Cargando...</span></div>;

  return (
    <div className="app-container">
      <div className="screen-header">
        <button className="back-btn" onClick={() => navigate(`/tarea/${id}`)}>←</button>
        <span className="screen-title">Auditoría</span>
      </div>

      <div className="aud-content">
        {/* Stats */}
        <div className="aud-stats fade-in">
          <div className="stat-card stat-done">
            <span className="stat-num">{items.filter(i=>i.estado.toUpperCase()==='OK').length}</span>
            <span className="stat-label">OK</span>
          </div>
          <div className="stat-card stat-pending">
            <span className="stat-num">{items.filter(i=>i.estado.toUpperCase()==='FALTANTE').length}</span>
            <span className="stat-label">Faltante</span>
          </div>
          <div className="stat-card" style={{borderTopColor:'var(--error)'}}>
            <span className="stat-num">{items.filter(i=>i.estado.toUpperCase()==='DAÑADO').length}</span>
            <span className="stat-label">Dañado</span>
          </div>
        </div>

        {problems > 0 && (
          <div className="aud-warning fade-in">⚠️ {problems} problema{problems>1?'s':''} detectado{problems>1?'s':''}</div>
        )}

        {/* Items */}
        <div className="aud-list">
          {items.map((item, i) => (
            <div key={i} className={`aud-item card fade-in`} style={{animationDelay:`${i*50}ms`}}>
              <div className="aud-item-top">
                <h4>{item.activo}</h4>
                <button
                  className={`aud-estado-btn ${ESTADO_CLS[item.estado.toUpperCase()]}`}
                  onClick={() => cycleEstado(i)}
                >
                  {ESTADO_EMOJI[item.estado.toUpperCase()]} {item.estado.toUpperCase()}
                </button>
              </div>
              <div className="aud-qty">
                <span className="aud-qty-label">Cantidad:</span>
                <input
                  type="number"
                  className="aud-qty-input"
                  value={item.cantidad_encontrada}
                  onChange={(e) => updateCantidad(i, e.target.value)}
                  min="0"
                />
                <span className="aud-qty-expected">/ {item.cantidad_esperada}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bottom-bar">
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? <div className="spinner" style={{width:20,height:20,borderWidth:2,borderTopColor:'white'}} /> : '💾 Guardar Auditoría'}
        </button>
      </div>
    </div>
  );
}
