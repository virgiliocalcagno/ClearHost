import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoredStaff, logout } from '../services/api';
import api from '../services/api';
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(true);
  const staff = getStoredStaff();

  useEffect(() => {
    if (!staff) { navigate('/'); return; }
    loadTareas();

    // Polling cada 30 segundos
    const interval = setInterval(() => {
      loadTareas(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadTareas = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      // Traer TODAS las tareas asignadas a este staff (no solo las de hoy)
      const res = await api.get(`/tareas/`, { params: { asignado_a: staff.id } });
      // Filtrar solo las pendientes/en_progreso o completadas recientes
      const activas = res.data.filter(t => 
        ['PENDIENTE', 'ASIGNADA_NO_CONFIRMADA', 'ACEPTADA', 'EN_PROGRESO', 'COMPLETADA'].includes(t.estado)
      );
      setTareas(activas);
    } catch (err) {
      console.error('Error cargando tareas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => { logout(); navigate('/'); };

  const stats = {
    pendientes: tareas.filter(t => t.estado === 'PENDIENTE' || t.estado === 'ASIGNADA_NO_CONFIRMADA').length,
    enProgreso: tareas.filter(t => t.estado === 'ACEPTADA' || t.estado === 'EN_PROGRESO').length,
    completas: tareas.filter(t => t.estado === 'CLEAN_AND_READY' || t.estado === 'COMPLETADA' || t.estado === 'VERIFICADA').length,
  };

  const getStatusBadge = (estado) => {
    const map = {
      PENDIENTE: { cls: 'badge-pending', txt: 'Pendiente' },
      ASIGNADA_NO_CONFIRMADA: { cls: 'badge-pending', txt: 'Falta Aceptar' },
      ACEPTADA: { cls: 'badge-progress', txt: 'Aceptada' },
      EN_PROGRESO: { cls: 'badge-progress', txt: 'En Limpieza' },
      CLEAN_AND_READY: { cls: 'badge-done', txt: 'Clean & Ready' },
      COMPLETADA: { cls: 'badge-done', txt: 'Clean & Ready' },
      VERIFICADA: { cls: 'badge-done', txt: 'Verificada' },
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
                className={`task-card card fade-in priority-${tarea.prioridad || 'BAJA'}`} 
                style={{animationDelay: `${i*80}ms`}}
              >
                <div className="task-top">
                  <div>
                    <h4 className="task-prop">{tarea.nombre_propiedad || 'Propiedad'}</h4>
                    {getPriorityBadge(tarea.prioridad)}
                  </div>
                  {getStatusBadge(tarea.estado)}
                </div>
                {tarea.direccion_propiedad && (
                  <p className="task-address">📍 {tarea.direccion_propiedad}</p>
                )}
                <div className="task-pills">
                  <span className="pill">📅 {tarea.fecha_programada}</span>
                  <span className="pill">🕐 Checkout: {tarea.check_out || 'N/A'}</span>
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
