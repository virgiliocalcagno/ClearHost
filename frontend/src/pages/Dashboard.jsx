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
  }, []);

  const loadTareas = async () => {
    try {
      // Traer TODAS las tareas asignadas a este staff (no solo las de hoy)
      const res = await api.get(`/tareas/`, { params: { asignado_a: staff.id } });
      // Filtrar solo las pendientes/en_progreso o completadas recientes
      const activas = res.data.filter(t => 
        ['PENDIENTE', 'EN_PROGRESO', 'COMPLETADA'].includes(t.estado)
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
    pendientes: tareas.filter(t => t.estado === 'PENDIENTE').length,
    enProgreso: tareas.filter(t => t.estado === 'EN_PROGRESO').length,
    completas: tareas.filter(t => t.estado === 'COMPLETADA' || t.estado === 'VERIFICADA').length,
  };

  const getStatusBadge = (estado) => {
    const map = {
      PENDIENTE: { cls: 'badge-pending', txt: 'Pendiente' },
      EN_PROGRESO: { cls: 'badge-progress', txt: 'En Progreso' },
      COMPLETADA: { cls: 'badge-done', txt: 'Completada' },
      VERIFICADA: { cls: 'badge-done', txt: 'Verificada' },
    };
    const s = map[estado] || map.PENDIENTE;
    return <span className={`badge ${s.cls}`}>{s.txt}</span>;
  };

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

        {tareas.length === 0 ? (
          <div className="empty-state card">
            <span style={{fontSize:48}}>🎉</span>
            <h4>¡Sin tareas hoy!</h4>
            <p>No tienes limpiezas asignadas.</p>
          </div>
        ) : (
          <div className="task-list">
            {tareas.map((tarea, i) => (
              <div key={tarea.id} className="task-card card fade-in" style={{animationDelay: `${i*80}ms`}}>
                <div className="task-top">
                  <h4 className="task-prop">{tarea.nombre_propiedad || 'Propiedad'}</h4>
                  {getStatusBadge(tarea.estado)}
                </div>
                {tarea.direccion_propiedad && (
                  <p className="task-address">📍 {tarea.direccion_propiedad}</p>
                )}
                <div className="task-pills">
                  <span className="pill">🕐 Check-in: {tarea.check_in || 'N/A'}</span>
                  <span className="pill">👤 {tarea.nombre_huesped || 'Sin huésped'}</span>
                </div>

                {/* Progress */}
                <div className="task-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: `${tarea.progreso || 0}%`}} />
                  </div>
                  <span className="progress-pct">{tarea.progreso || 0}%</span>
                </div>

                {tarea.estado !== 'COMPLETADA' && tarea.estado !== 'VERIFICADA' && (
                  <button
                    className="btn btn-primary task-cta"
                    onClick={() => navigate(`/tarea/${tarea.id}`)}
                  >
                    {tarea.estado === 'EN_PROGRESO' ? '▶ Continuar' : '🧹 Empezar Limpieza'}
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
