import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoredStaff, logout } from '../services/api';
import api from '../services/api';
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const [tareas, setTareas] = useState([]);
  const [billetera, setBilletera] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWalletDetail, setShowWalletDetail] = useState(false);
  const staff = getStoredStaff();

  useEffect(() => {
    if (!staff) { navigate('/'); return; }
    loadData();

    // Polling cada 30 segundos
    const interval = setInterval(() => {
      loadData(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [tareasRes, billRes] = await Promise.all([
        api.get(`/tareas/`, { params: { asignado_a: staff.id } }),
        api.get(`/staff/${staff.id}/billetera`)
      ]);
      
      const activas = tareasRes.data.filter(t => 
        ['PENDIENTE', 'ASIGNADA_NO_CONFIRMADA', 'ACEPTADA', 'EN_PROGRESO', 'COMPLETADA', 'CLEAN_AND_READY', 'VERIFICADA'].includes(t.estado)
      );
      setTareas(activas);
      setBilletera(billRes.data);
    } catch (err) {
      console.error('Error cargando datos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => { logout(); navigate('/'); };

  const stats = {
    pendientes: tareas.filter(t => t.estado === 'PENDIENTE' || t.estado === 'ASIGNADA_NO_CONFIRMADA').length,
    enProgreso: tareas.filter(t => t.estado === 'ACEPTADA' || t.estado === 'EN_PROGRESO').length,
    completas: tareas.filter(t => 
      t.estado === 'CLEAN_AND_READY' || 
      t.estado === 'COMPLETADA' || 
      t.estado === 'VERIFICADA'
    ).length,
  };

  const getStatusBadge = (estado) => {
    const map = {
      PENDIENTE: { cls: 'badge-pending', txt: 'Pendiente' },
      ASIGNADA_NO_CONFIRMADA: { cls: 'badge-pending', txt: 'Falta Aceptar' },
      ACEPTADA: { cls: 'badge-progress', txt: 'Aceptada' },
      EN_PROGRESO: { cls: 'badge-progress', txt: 'En Limpieza' },
      CLEAN_AND_READY: { cls: 'badge-done', txt: 'Realizada' },
      COMPLETADA: { cls: 'badge-done', txt: 'Realizada' },
      VERIFICADA: { cls: 'badge-done', txt: 'Lista / Verificada' },
    };
    const s = map[estado] || map.PENDIENTE;
    return <span className={`badge ${s.cls}`}>{s.txt}</span>;
  };

  const getPriorityBadge = (prioridad) => {
    if (!prioridad) return null;
    const prioName = prioridad.toUpperCase();
    return <span className={`task-priority-badge badge-${prioName}`}>{prioName === 'EMERGENCIA' ? '🚨 URGENTE' : prioName}</span>;
  };

  // Ordenar tareas: Emergencias primero
  const sortedTareas = [...tareas].sort((a, b) => {
    if (a.prioridad === 'EMERGENCIA' && b.prioridad !== 'EMERGENCIA') return -1;
    if (a.prioridad !== 'EMERGENCIA' && b.prioridad === 'EMERGENCIA') return 1;
    return 0;
  });

  if (loading) return <div className="loading-screen"><div className="spinner" /><span>Cargando tareas...</span></div>;

  return (
    <div className="app-container">
      {/* Header */}
      <div className="dash-header fade-in">
        <div className="dash-avatar">{staff?.nombre?.[0] || 'S'}</div>
        <div className="dash-info">
          <h2>Hola, {staff?.nombre?.split(' ')[0] || 'Staff'} 👋</h2>
          <p>{new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <button className="dash-logout" onClick={handleLogout} title="Cerrar sesión">🚪</button>
      </div>

      {/* Billetera */}
      {billetera && (
        <div 
          className="billetera-card fade-in" 
          onClick={() => setShowWalletDetail(!showWalletDetail)}
          style={{flexDirection:'column', alignItems:'stretch', gap:10, cursor:'pointer'}}
        >
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div className="billetera-info">
              <h4>Saldo por cobrar</h4>
              <div className="monto">DOP {billetera.saldo_neto?.toLocaleString() || '0.00'}</div>
            </div>
            <div className="billetera-icon">{showWalletDetail ? '🔽' : '💰'}</div>
          </div>

          {showWalletDetail ? (
            <div className="wallet-detail-list">
              {billetera.historial_tareas && billetera.historial_tareas.length > 0 ? (
                billetera.historial_tareas.map((item, idx) => (
                  <div key={idx} className="wallet-detail-item">
                    <span className="detail-task">{item.id_secuencial ? `T-${item.id_secuencial}` : item.tipo}</span>
                    <span className="detail-date">{new Date(item.fecha).toLocaleDateString('es-ES', {day:'2-digit', month:'short'})}</span>
                    <span className="detail-amount">{item.moneda} {item.monto?.toLocaleString()}</span>
                    <span style={{fontWeight:700}}>DOP {item.monto?.toLocaleString()}</span>
                  </div>
                ))
              ) : (
                <p style={{fontSize:12, opacity:0.7}}>No hay tareas verificadas pendientes de pago.</p>
              )}
            </div>
          ) : (
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, paddingTop:10, borderTop:'1px solid rgba(255,255,255,0.1)', fontSize:12, opacity:0.9}}>
              <div>
                <span style={{display:'block', opacity:0.7}}>Total Ganado</span>
                <span style={{fontWeight:700}}>DOP {billetera.total_ganado?.toLocaleString() || '0'}</span>
              </div>
              <div style={{textAlign:'right'}}>
                <span style={{display:'block', opacity:0.7}}>Pagado/Adelantos</span>
                <span style={{fontWeight:700, color:'#fda4af'}}>- DOP {billetera.total_adelantos?.toLocaleString() || '0'}</span>
              </div>
            </div>
          )}
          <div style={{fontSize:10, textAlign:'center', opacity:0.5, marginTop:showWalletDetail ? 10 : 0}}>
            {showWalletDetail ? 'Toca para contraer' : 'Toca para ver detalle'}
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="dash-stats fade-in">
        <div className="stat-card stat-pending">
          <span className="stat-num">{stats.pendientes}</span>
          <span className="stat-label">Pendientes</span>
        </div>
        <div className="stat-card stat-progress">
          <span className="stat-num">{stats.enProgreso}</span>
          <span className="stat-label">En Progreso</span>
        </div>
        <div className="stat-card stat-done">
          <span className="stat-num">{stats.completas}</span>
          <span className="stat-label">Listas</span>
        </div>
      </div>

      {/* Task section */}
      <div className="dash-section fade-in">
        <div className="section-header">
          <h3>Tareas de hoy</h3>
          <span className="badge badge-pending">{tareas.length}</span>
        </div>

        {sortedTareas.length === 0 ? (
          <div className="empty-state card">
            <span style={{fontSize:48}}>🎉</span>
            <h4>¡Sin tareas hoy!</h4>
            <p>No tienes tareas pendientes o asignadas.</p>
          </div>
        ) : (
          <div className="task-list">
            {sortedTareas.map((tarea, i) => (
              <div 
                key={tarea.id} 
                className={`task-card card fade-in priority-${tarea.prioridad || 'BAJA'} ${['CLEAN_AND_READY', 'VERIFICADA', 'COMPLETADA'].includes(String(tarea.estado).trim().toUpperCase()) ? 'status-done' : ''}`} 
                style={{animationDelay: `${i*80}ms`}}
              >
                <div className="task-top">
                  <div>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <h4 classNAme="task-prop" style={{overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'180px'}}>{tarea.nombre_propiedad || 'Propiedad'}</h4>
                      <span style={{fontSize:11, fontWeight:800, color:'var(--primary)'}}>T-{tarea.id_secuencial}</span>
                    </div>
                    <div style={{display:'flex', gap:6, alignItems:'center', flexWrap:'wrap', marginTop:4}}>
                      {getPriorityBadge(tarea.prioridad)}
                      <span className="task-payment" style={{background: '#f0fdfa', padding: '2px 6px', borderRadius: '4px', border: '1px solid #99f6e4', fontSize: '12px'}}>
                        💵 DOP {tarea.pago_al_staff?.toLocaleString() || '0'}
                      </span>
                    </div>
                  </div>
                  {getStatusBadge(tarea.estado)}
                </div>
                {tarea.direccion_propiedad && (
                  <p className="task-address">📍 {tarea.direccion_propiedad}</p>
                )}
                <div className="task-pills">
                  <span className="pill" style={{background:'#fdf2f2', color:'#dc2626', fontWeight:700}}>🕐 Inicio: {tarea.hora_inicio ? tarea.hora_inicio.substring(0,5) : '11:00 AM'}</span>
                  <span className="pill">📅 {new Date(tarea.fecha_programada).toLocaleDateString('es-ES', {day:'numeric', month:'short'})}</span>
                  <span className="pill">👤 {tarea.nombre_huesped || 'S/Hu.'}</span>
                </div>

                {/* Progress */}
                <div className="task-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: `${tarea.progreso || 0}%`}} />
                  </div>
                  <span className="progress-pct">{tarea.progreso || 0}%</span>
                </div>

                {(!['CLEAN_AND_READY', 'COMPLETADA', 'VERIFICADA'].includes(tarea.estado)) && (
                  <button
                    className={`btn task-cta ${tarea.estado === 'ASIGNADA_NO_CONFIRMADA' ? 'btn-danger' : 'btn-primary'}`}
                    style={tarea.estado === 'ASIGNADA_NO_CONFIRMADA' ? { background: '#25D366', color: 'white', borderColor: '#25D366' } : {}}
                    onClick={() => navigate(`/tarea/${tarea.id}`)}
                  >
                    {tarea.estado === 'ASIGNADA_NO_CONFIRMADA' ? '⏳ VER PARA ACEPTAR' : 
                     (tarea.estado === 'EN_PROGRESO' ? '▶ Continuar' : '🧹 Empezar Limpieza')}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
