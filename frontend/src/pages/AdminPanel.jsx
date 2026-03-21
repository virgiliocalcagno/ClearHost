import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated, getStoredStaff, logout } from '../services/api';
import api from '../services/api';
import './AdminPanel.css';

// ─── API helpers ───
const fetchPropiedades = () => api.get('/propiedades/').then(r => r.data);
const fetchReservas = () => api.get('/reservas/').then(r => r.data);
const fetchTareas = () => api.get('/tareas/').then(r => r.data);
const fetchStaff = () => api.get('/staff/').then(r => r.data);
const fetchIncidencias = () => api.get('/incidencias/').then(r => r.data);

const crearPropiedad = (data) => api.post('/propiedades/', data).then(r => r.data);
const actualizarPropiedad = (id, data) => api.put(`/propiedades/${id}`, data).then(r => r.data);
const eliminarPropiedad = (id) => api.delete(`/propiedades/${id}`);

const crearReserva = (data) => api.post('/reservas/', data).then(r => r.data);
const cancelarReserva = (id) => api.delete(`/reservas/${id}`);
const reactivarReserva = (id) => api.put(`/reservas/${id}`, { estado: 'CONFIRMADA' });

const crearStaffMember = (data) => api.post('/staff/', data).then(r => r.data);
const actualizarStaff = (id, data) => api.put(`/staff/${id}`, data).then(r => r.data);

const verificarTarea = (id) => api.put(`/tareas/${id}/verificar`).then(r => r.data);
const generarLinkWhatsApp = (id) => api.get(`/tareas/${id}/whatsapp-link`).then(r => r.data);
const asignarTarea = (id, staffId, horaInicio) => {
  const params = {};
  if (staffId) params.staff_id = staffId;
  if (horaInicio) params.hora_inicio = horaInicio;
  return api.put(`/tareas/${id}/asignar`, null, { params }).then(r => r.data);
};
const autoAsignarTareas = () => api.post('/tareas/auto-asignar').then(r => r.data);
const syncIcal = (propId) => api.post(`/reservas/sync-ical/${propId}`).then(r => r.data);
const actualizarIncidencia = (id, data) => api.put(`/incidencias/${id}`, data).then(r => r.data);
const crearIncidencia = (data) => api.post('/incidencias/', data).then(r => r.data);

// ─── Tab config ───
const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'propiedades', label: 'Propiedades', icon: '🏠' },
  { id: 'reservas', label: 'Reservas', icon: '📅' },
  { id: 'tareas', label: 'Tareas', icon: '🧹' },
  { id: 'mantenimiento', label: 'Mantenimiento', icon: '🔧' },
  { id: 'staff', label: 'Staff', icon: '👥' },
];

export default function AdminPanel() {
  const navigate = useNavigate();
  const staff = getStoredStaff();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState({ propiedades: [], reservas: [], tareas: [], staff: [], incidencias: [] });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) { navigate('/'); return; }
    loadAll();

    // Auto-refresh cada 30 segundos
    const interval = setInterval(() => {
      loadAll(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadAll = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [propiedades, reservas, tareas, staffList, incidencias] = await Promise.all([
        fetchPropiedades(), fetchReservas(), fetchTareas(), fetchStaff(), fetchIncidencias()
      ]);
      setData({ propiedades, reservas, tareas, staff: staffList, incidencias });
    } catch (err) {
      console.error('Error cargando datos:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handleLogout = () => { logout(); navigate('/'); };

  // ─── Stats ───
  const stats = {
    propiedades: data.propiedades.length,
    reservasActivas: data.reservas.filter(r => r.estado === 'CONFIRMADA').length,
    tareasPendientes: data.tareas.filter(t => ['PENDIENTE', 'EN_PROGRESO'].includes(t.estado)).length,
    tareasCompletadas: data.tareas.filter(t => t.estado === 'COMPLETADA' || t.estado === 'VERIFICADA').length,
    staffDisponible: data.staff.filter(s => s.disponible).length,
  };

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner" />
      <span>Cargando panel admin...</span>
    </div>
  );

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <h1><span className="brand-icon">✦</span> <span>ClearHost</span></h1>
          <p>Panel Admin</p>
        </div>
        <nav className="sidebar-nav">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="nav-icon">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="nav-item" onClick={handleLogout}>
            <span className="nav-icon">🚪</span>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        {activeTab === 'dashboard' && <DashboardTab stats={stats} data={data} />}
        {activeTab === 'propiedades' && (
          <PropiedadesTab data={data.propiedades} onAction={setModal} onRefresh={loadAll} showToast={showToast} />
        )}
        {activeTab === 'reservas' && (
          <ReservasTab data={data.reservas} propiedades={data.propiedades} onAction={setModal} onRefresh={loadAll} showToast={showToast} />
        )}
        {activeTab === 'tareas' && (
          <TareasTab data={data.tareas} propiedades={data.propiedades} staffList={data.staff} onRefresh={loadAll} showToast={showToast} />
        )}

        {activeTab === 'staff' && (
          <StaffTab data={data.staff} onAction={setModal} onRefresh={loadAll} showToast={showToast} />
        )}
        {activeTab === 'mantenimiento' && (
          <MantenimientoTab 
            data={data.incidencias} 
            propiedades={data.propiedades} 
            onRefresh={loadAll} 
            showToast={showToast} 
            onAction={setModal}
          />
        )}

      </main>

      {/* Modal */}
      {modal && (
        <ModalForm
          config={modal}
          onClose={() => setModal(null)}
          onRefresh={loadAll}
          showToast={showToast}
          propiedades={data.propiedades}
        />
      )}

      {/* Toast */}
      {toast && <div className="admin-toast">✅ {toast}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════
// Dashboard Tab
// ═══════════════════════════════════════════
function DashboardTab({ stats, data }) {
  const today = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="admin-fade-in">
      <div className="admin-topbar">
        <div>
          <h2>Dashboard</h2>
          <div className="topbar-subtitle" style={{ textTransform: 'capitalize' }}>{today}</div>
        </div>
        <div className="topbar-actions">
          <button 
            className="btn-admin btn-admin-primary" 
            onClick={async () => {
              try {
                await api.post('/sync-ical-all');
                alert('Sincronización de todas las propiedades iniciada.');
              } catch (e) {
                alert('Error al iniciar sincronización global.');
              }
            }}
          >
            🔄 Sincronizar Todo
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card-admin stat-props">
          <div className="stat-icon">🏠</div>
          <div className="stat-value">{stats.propiedades}</div>
          <div className="stat-title">Propiedades</div>
        </div>
        <div className="stat-card-admin stat-reservations">
          <div className="stat-icon">📅</div>
          <div className="stat-value">{stats.reservasActivas}</div>
          <div className="stat-title">Reservas Activas</div>
        </div>
        <div className="stat-card-admin stat-tasks">
          <div className="stat-icon">⏳</div>
          <div className="stat-value">{stats.tareasPendientes}</div>
          <div className="stat-title">Tareas Pendientes</div>
        </div>
        <div className="stat-card-admin stat-completed">
          <div className="stat-icon">✅</div>
          <div className="stat-value">{stats.tareasCompletadas}</div>
          <div className="stat-title">Completadas</div>
        </div>
        <div className="stat-card-admin stat-staff-card">
          <div className="stat-icon">👥</div>
          <div className="stat-value">{stats.staffDisponible}</div>
          <div className="stat-title">Staff Disponible</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="dashboard-section">
          <h3>🧹 Tareas Recientes</h3>
          <div className="recent-list">
            {data.tareas.slice(0, 5).map(t => (
              <div key={t.id} className="recent-item">
                <div className="ri-icon ri-icon-tarea">🧹</div>
                <div className="ri-info">
                  <div className="ri-title">{t.fecha_programada}</div>
                  <div className="ri-sub">{t.estado}</div>
                </div>
                <EstadoBadge estado={t.estado} />
              </div>
            ))}
            {data.tareas.length === 0 && <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Sin tareas</p>}
          </div>
        </div>

        <div className="dashboard-section">
          <h3>📅 Próximas Reservas</h3>
          <div className="recent-list">
            {data.reservas.filter(r => r.estado === 'CONFIRMADA').slice(0, 5).map(r => (
              <div key={r.id} className="recent-item">
                <div className="ri-icon ri-icon-reserva">📅</div>
                <div className="ri-info">
                  <div className="ri-title">{r.nombre_huesped}</div>
                  <div className="ri-sub">{r.check_in} → {r.check_out}</div>
                </div>
                <FuenteBadge fuente={r.fuente} />
              </div>
            ))}
            {data.reservas.length === 0 && <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Sin reservas</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// Propiedades Tab
// ═══════════════════════════════════════════
function PropiedadesTab({ data, onAction, onRefresh, showToast }) {
  const [syncing, setSyncing] = useState(null);

  const handleSyncIcal = async (prop) => {
    setSyncing(prop.id);
    try {
      const res = await syncIcal(prop.id);
      showToast(res.message || 'Sincronización iCal iniciada');
      setTimeout(() => onRefresh(), 2000);
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al sincronizar iCal');
    } finally {
      setSyncing(null);
    }
  };

  return (
    <div className="admin-fade-in">
      <div className="admin-topbar">
        <div>
          <h2>Propiedades</h2>
          <div className="topbar-subtitle">Gestión de propiedades vacacionales</div>
        </div>
        <div className="topbar-actions">
          <button className="btn-admin btn-admin-primary" onClick={() => onAction({ type: 'propiedad' })}>
            ＋ Nueva Propiedad
          </button>
        </div>
      </div>

      <div className="admin-table-wrapper">
        <div className="admin-table-header">
          <h3>Listado de Propiedades</h3>
          <span className="table-count">{data.length} propiedades</span>
        </div>
        {data.length === 0 ? (
          <div className="admin-empty">
            <div className="empty-icon">🏠</div>
            <h4>Sin propiedades</h4>
            <p>Agrega tu primera propiedad para comenzar.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Propiedad</th>
                <th>Ciudad</th>
                <th>Habitaciones</th>
                <th>Estado</th>
                <th>iCal</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.map(p => (
                <tr key={p.id}>
                  <td>
                    <div className="table-name">{p.nombre}</div>
                    <div className="table-sub">{p.direccion}</div>
                  </td>
                  <td>{p.ciudad}</td>
                  <td>{p.num_habitaciones}</td>
                  <td>
                    <span className={`admin-badge ${p.activa ? 'admin-badge-success' : 'admin-badge-error'}`}>
                      {p.activa ? '✓ Activa' : '✕ Inactiva'}
                    </span>
                  </td>
                  <td>
                    {p.ical_url ? (
                      <button
                        className="btn-admin btn-admin-info btn-admin-sm"
                        onClick={() => handleSyncIcal(p)}
                        disabled={syncing === p.id}
                      >
                        {syncing === p.id ? '⏳ Sync...' : '🔄 Sincronizar'}
                      </button>
                    ) : (
                      <span className="admin-badge admin-badge-neutral">Sin URL</span>
                    )}
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="btn-admin btn-admin-outline btn-admin-sm" onClick={() => onAction({ type: 'propiedad', edit: p })}>✏️ Editar</button>
                      <button className="btn-admin btn-admin-danger btn-admin-sm" onClick={async () => { if (confirm('¿Desactivar esta propiedad?')) { try { await eliminarPropiedad(p.id); showToast('Propiedad desactivada'); onRefresh(); } catch(e) { alert('Error'); } } }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// Reservas Tab
// ═══════════════════════════════════════════
function ReservasTab({ data, propiedades, onAction, onRefresh, showToast }) {
  return (
    <div className="admin-fade-in">
      <div className="admin-topbar">
        <div>
          <h2>Reservas</h2>
          <div className="topbar-subtitle">Reservaciones de huéspedes</div>
        </div>
        <div className="topbar-actions">
          <button className="btn-admin btn-admin-primary" onClick={() => onAction({ type: 'reserva' })}>
            ＋ Nueva Reserva
          </button>
        </div>
      </div>

      <div className="admin-table-wrapper">
        <div className="admin-table-header">
          <h3>Listado de Reservas</h3>
          <span className="table-count">{data.length} reservas</span>
        </div>
        {data.length === 0 ? (
          <div className="admin-empty">
            <div className="empty-icon">📅</div>
            <h4>Sin reservas</h4>
            <p>Las reservas aparecerán aquí al crearlas o sincronizar iCal.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Huésped</th>
                <th>Propiedad</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Fuente</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.map(r => {
                const prop = propiedades.find(p => p.id === r.propiedad_id);
                return (
                  <tr key={r.id}>
                    <td>
                      <div className="table-name">{r.nombre_huesped}</div>
                      <div className="table-sub">{r.num_huespedes} huésped(es)</div>
                    </td>
                    <td>{prop?.nombre || '—'}</td>
                    <td>{r.check_in}</td>
                    <td>{r.check_out}</td>
                    <td><FuenteBadge fuente={r.fuente} /></td>
                    <td><EstadoReservaBadge estado={r.estado} /></td>
                    <td>
                      <div className="table-actions">
                        {r.estado === 'CONFIRMADA' && (
                          <button className="btn-admin btn-admin-danger btn-admin-sm" onClick={async () => { if (window.confirm('¿Cancelar esta reserva?')) { try { await cancelarReserva(r.id); showToast('Reserva cancelada'); onRefresh(); } catch(e) { alert('Error'); } } }}>✕ Cancelar</button>
                        )}
                        {r.estado === 'CANCELADA' && (
                          <button className="btn-admin btn-admin-success btn-admin-sm" onClick={async () => { if (window.confirm('¿Reactivar esta reserva?')) { try { await reactivarReserva(r.id); showToast('Reserva reactivada'); onRefresh(); } catch(e) { alert('Error'); } } }}>✓ Reactivar</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// Tareas Tab
// ═══════════════════════════════════════════
function TareasTab({ data, propiedades, staffList, onRefresh, showToast }) {
  const [assigning, setAssigning] = useState(null);
  const [autoAssigning, setAutoAssigning] = useState(false);
  const [evidencia, setEvidencia] = useState(null); // tarea seleccionada para ver evidencia
  const [vista, setVista] = useState('tabla'); // 'tabla' o 'calendario'

  const handleWhatsApp = async (id) => {
    try {
      const res = await generarLinkWhatsApp(id);
      window.open(res.link, '_blank');
    } catch(err) {
      alert("No se pudo generar link de WhatsApp");
    }
  };

  const getPropName = (t) => {
    const p = propiedades?.find(pr => pr.id === t.propiedad_id);
    return p?.nombre || '—';
  };

  const getStaffName = (t) => {
    if (t.nombre_asignado) return t.nombre_asignado;
    if (!t.asignado_a) return null;
    const s = staffList?.find(st => st.id === t.asignado_a);
    return s?.nombre || null;
  };

  const staffLimpieza = (staffList || []).filter(s => s.rol === 'LIMPIEZA' || s.rol === 'MANTENIMIENTO');

  const handleVerificar = async (id) => {
    try {
      await verificarTarea(id);
      showToast('Tarea verificada ✓');
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al verificar');
    }
  };

  const handleAsignar = async (tareaId, staffId, horaInicio) => {
    setAssigning(tareaId);
    try {
      await asignarTarea(tareaId, staffId || null, horaInicio);
      showToast('Tarea asignada');
      onRefresh();
    } catch (err) {
      alert('Error al asignar tarea');
    } finally {
      setAssigning(null);
    }
  };

  const handleTimeChange = (tareaId, hora, currentStaffId) => {
    handleAsignar(tareaId, currentStaffId, hora);
  };

  const handleAutoAsignar = async () => {
    setAutoAssigning(true);
    try {
      const res = await autoAsignarTareas();
      showToast(res.message);
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error en auto-asignación');
    } finally {
      setAutoAssigning(false);
    }
  };

  const sinAsignar = data.filter(t => !t.asignado_a && ['PENDIENTE', 'EN_PROGRESO'].includes(t.estado)).length;

  return (
    <div className="admin-fade-in">
      <div className="admin-topbar">
        <div>
          <h2>Tareas de Limpieza</h2>
          <div className="topbar-subtitle">Gestión, asignación y verificación de tareas</div>
        </div>
        <div className="topbar-actions">
          <div className="view-toggle" style={{display: 'inline-flex', gap: 5, marginRight: 15, background: 'var(--surface)', padding: 4, borderRadius: 8}}>
            <button className={`btn-admin btn-admin-sm ${vista === 'tabla' ? 'btn-admin-primary' : 'btn-admin-outline'}`} onClick={() => setVista('tabla')} style={{border: 'none'}}>📋 Tabla</button>
            <button className={`btn-admin btn-admin-sm ${vista === 'calendario' ? 'btn-admin-primary' : 'btn-admin-outline'}`} onClick={() => setVista('calendario')} style={{border: 'none'}}>📅 Semáforo Semanal</button>
          </div>
          {sinAsignar > 0 && (
            <button
              className="btn-admin btn-admin-primary"
              onClick={handleAutoAsignar}
              disabled={autoAssigning}
            >
              {autoAssigning ? '⏳ Asignando...' : `🎯 Auto-asignar (${sinAsignar})`}
            </button>
          )}
          <button className="btn-admin btn-admin-outline" onClick={onRefresh}>🔄 Actualizar</button>
        </div>
      </div>

      <div className="admin-table-wrapper">
        <div className="admin-table-header">
          <h3>{vista === 'tabla' ? 'Todas las Tareas' : 'Calendario de Urgencias'}</h3>
          <span className="table-count">{data.length} tareas</span>
        </div>
        {data.length === 0 ? (
          <div className="admin-empty">
            <div className="empty-icon">🧹</div>
            <h4>Sin tareas</h4>
            <p>Las tareas se crean automáticamente al crear reservas.</p>
          </div>
        ) : vista === 'tabla' ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Propiedad</th>
                <th>Huésped</th>
                <th>Fecha</th>
                <th>Asignado a</th>
                <th>Estado</th>
                <th>Checklist</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.map(t => {
                const checkItems = t.checklist || [];
                const checkDone = checkItems.filter(i => i.completado).length;
                const assignedName = getStaffName(t);
                return (
                  <tr key={t.id}>
                    <td>
                      <div className="table-name">{getPropName(t)}</div>
                    </td>
                    <td>
                      <div className="table-name">{t.nombre_huesped || '—'}</div>
                    </td>
                    <td>
                      <div className="table-name">{t.fecha_programada}</div>
                      <div className="table-sub">
                        <input 
                          type="time" 
                          value={(t.hora_inicio || '11:00').substring(0, 5)} 
                          onChange={(e) => handleTimeChange(t.id, e.target.value, t.asignado_a)}
                          style={{
                            border: '1px solid var(--border)',
                            borderRadius: '4px',
                            padding: '2px 4px',
                            fontSize: '11px',
                            marginTop: '4px',
                            cursor: 'pointer'
                          }}
                        />
                      </div>
                    </td>
                    <td>
                      <div className="assign-cell">
                        <select
                          className="select-assign"
                          value={t.asignado_a || ''}
                          onChange={(e) => handleAsignar(t.id, e.target.value)}
                          disabled={assigning === t.id || t.estado === 'VERIFICADA'}
                          style={{
                            color: t.asignado_a ? 'var(--text-primary)' : 'var(--text-tertiary)',
                            borderColor: !t.asignado_a && t.estado === 'PENDIENTE'
                              ? 'var(--color-warning)' : undefined,
                          }}
                        >
                          <option value="">⚠ Sin asignar</option>
                          {staffLimpieza.map(s => (
                            <option key={s.id} value={s.id}>
                              {s.nombre} ({s.rol === 'LIMPIEZA' ? '🧹' : '🔧'})
                            </option>
                          ))}
                        </select>
                        {assigning === t.id && <span className="assign-spinner">⏳</span>}
                      </div>
                    </td>
                    <td><EstadoBadge estado={t.estado} /></td>
                    <td>
                      <span className="admin-badge admin-badge-neutral">
                        {checkDone}/{checkItems.length}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="btn-admin btn-admin-outline btn-admin-sm"
                          onClick={() => setEvidencia(t)}
                          title="Ver evidencia"
                        >
                          👁 Ver
                        </button>
                        {['COMPLETADA', 'CLEAN_AND_READY'].includes(t.estado) && (
                          <button
                            className="btn-admin btn-admin-primary btn-admin-sm"
                            onClick={() => handleVerificar(t.id)}
                          >
                            ✓ Verificar
                          </button>
                        )}
                        <button
                          className="btn-admin btn-admin-sm"
                          style={{background:'#25D366', color:'white', border:'none', marginLeft:5}}
                          onClick={() => handleWhatsApp(t.id)}
                          title="Enviar a WhatsApp"
                        >
                          <i className="fab fa-whatsapp"></i> WhatsApp
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <AdminWeeklyCalendar 
            tareas={data} 
            propiedades={propiedades} 
            getStaffName={getStaffName} 
            handleAsignar={handleAsignar}
            handleTimeChange={handleTimeChange}
            staffLimpieza={staffLimpieza}
            handleWhatsApp={handleWhatsApp}
          />
        )}
      </div>

      {/* Modal de evidencia */}
      {evidencia && (
        <div className="modal-overlay" onClick={() => setEvidencia(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{maxWidth:700, maxHeight:'90vh', overflow:'auto'}}>
            <div className="modal-header">
              <h3>📋 Evidencia: {getPropName(evidencia)}</h3>
              <button className="modal-close" onClick={() => setEvidencia(null)}>✕</button>
            </div>
            <div className="modal-body" style={{padding: 20}}>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20}}>
                <div><strong>Fecha:</strong> {evidencia.fecha_programada}</div>
                <div><strong>Estado:</strong> <EstadoBadge estado={evidencia.estado} /></div>
                <div><strong>Asignado:</strong> {getStaffName(evidencia) || 'Sin asignar'}</div>
                <div><strong>Huésped:</strong> {evidencia.nombre_huesped || 'N/A'}</div>
              </div>

              <h4 style={{marginBottom:8}}>✅ Checklist ({(evidencia.checklist || []).filter(i=>i.completado).length}/{(evidencia.checklist || []).length})</h4>
              {(evidencia.checklist && evidencia.checklist.length > 0) ? (
                <div style={{display:'flex', flexDirection:'column', gap:6, marginBottom:20}}>
                  {evidencia.checklist.map((item, i) => (
                    <div key={i} style={{display:'flex', alignItems:'center', gap:8, padding:'6px 10px', borderRadius:8, background: item.completado ? '#e8f5e9' : '#fff3e0'}}>
                      <span>{item.completado ? '✅' : '⬜'}</span>
                      <span style={{flex:1}}>{item.item}</span>
                      {item.requerido && <span style={{fontSize:11, color:'#e65100', fontWeight:600}}>Obligatorio</span>}
                    </div>
                  ))}
                </div>
              ) : <p style={{color:'var(--text-tertiary)', marginBottom:20}}>Sin checklist registrado.</p>}

              <h4 style={{marginBottom:8}}>📸 Fotos ANTES</h4>
              {(evidencia.fotos_antes && evidencia.fotos_antes.length > 0) ? (
                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px,1fr))', gap:10, marginBottom:20}}>
                  {evidencia.fotos_antes.map((f, i) => (
                    <a key={i} href={f.url} target="_blank" rel="noreferrer">
                      <img src={f.url} alt={`antes-${i}`} style={{width:'100%', borderRadius:10, border:'2px solid #e0e0e0', cursor:'pointer'}} />
                    </a>
                  ))}
                </div>
              ) : <p style={{color:'var(--text-tertiary)', marginBottom:20}}>Sin fotos de antes.</p>}

              <h4 style={{marginBottom:8}}>📸 Fotos DESPUÉS</h4>
              {(evidencia.fotos_despues && evidencia.fotos_despues.length > 0) ? (
                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px,1fr))', gap:10, marginBottom:20}}>
                  {evidencia.fotos_despues.map((f, i) => (
                    <a key={i} href={f.url} target="_blank" rel="noreferrer">
                      <img src={f.url} alt={`despues-${i}`} style={{width:'100%', borderRadius:10, border:'2px solid #a5d6a7', cursor:'pointer'}} />
                    </a>
                  ))}
                </div>
              ) : <p style={{color:'var(--text-tertiary)', marginBottom:20}}>Sin fotos de después.</p>}

              {evidencia.notas_staff && (
                <div style={{marginTop:10}}>
                  <h4>📝 Notas del Staff</h4>
                  <p style={{background:'#f5f5f5', padding:12, borderRadius:8}}>{evidencia.notas_staff}</p>
                </div>
              )}

              {['COMPLETADA', 'CLEAN_AND_READY'].includes(evidencia.estado) && (
                <button
                  className="btn-admin btn-admin-primary"
                  style={{width:'100%', marginTop:16}}
                  onClick={async () => {
                    await handleVerificar(evidencia.id);
                    setEvidencia(null);
                  }}
                >
                  ✓ Verificar y Aprobar Tarea
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// AdminWeeklyCalendar
// ═══════════════════════════════════════════
function AdminWeeklyCalendar({ tareas, propiedades, getStaffName, handleAsignar, handleTimeChange, staffLimpieza, handleWhatsApp }) {
  const tasksByDate = {};
  tareas.forEach(t => {
    if (!tasksByDate[t.fecha_programada]) tasksByDate[t.fecha_programada] = [];
    tasksByDate[t.fecha_programada].push(t);
  });

  const getPriorityColor = (prio) => {
    switch (prio) {
      case 'EMERGENCIA': return { border: '3px solid var(--error)', background: '#fff0f0', animation: 'pulse-emergency 2s infinite' };
      case 'ALTA': return { borderLeft: '5px solid var(--error)' };
      case 'MEDIA': return { borderLeft: '5px solid var(--warning)' };
      case 'BAJA': return { borderLeft: '5px solid var(--success)' };
      default: return { borderLeft: '5px solid #ccc' };
    }
  };

  const dates = Object.keys(tasksByDate).sort();

  return (
    <div style={{display: 'flex', gap: '20px', overflowX: 'auto', padding: '10px 20px 20px'}}>
      {dates.map(dateStr => (
        <div key={dateStr} style={{minWidth: 280, background: '#f9f9f9', padding: 15, borderRadius: 12, border: '1px solid var(--border)'}}>
          <h4 style={{marginBottom: 15, borderBottom: '1px solid var(--border)', paddingBottom: 10}}>
            {new Date(dateStr + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
          </h4>
          <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
            {tasksByDate[dateStr]
             .sort((a,b) => (a.prioridad === 'EMERGENCIA' ? -1 : 1))
             .map(t => {
              const prop = propiedades.find(p => p.id === t.propiedad_id);
              const pColor = getPriorityColor(t.prioridad);
              return (
                <div key={t.id} style={{
                  padding: 12, borderRadius: 8, background: 'white',
                  boxShadow: 'var(--shadow-sm)', ...pColor
                }}>
                  <div style={{fontWeight: 800, fontSize: 14}}>{prop?.nombre || 'Propiedad'}</div>
                  <div style={{fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 5}}>Prioridad: {t.prioridad || 'BAJA'}</div>
                  <div style={{fontSize: 12}}>Huésped: {t.nombre_huesped}</div>
                  <div style={{fontSize: 12}}>Check-out: {t.check_out}</div>
                  <div style={{fontSize: 12, marginTop: 8, display: 'flex', gap: '5px', alignItems: 'center'}}>
                    <select
                      className="select-assign"
                      value={t.asignado_a || ''}
                      onChange={(e) => handleAsignar(t.id, e.target.value)}
                      style={{
                        padding: '4px', fontSize: '11px', flex: 1,
                        color: t.asignado_a ? 'var(--text-primary)' : 'var(--danger)',
                        borderColor: !t.asignado_a ? 'var(--danger)' : undefined,
                      }}
                    >
                      <option value="">⚠ Asignar Staff</option>
                      {staffLimpieza.map(s => (
                        <option key={s.id} value={s.id}>{s.nombre}</option>
                      ))}
                    </select>
                    <input 
                      type="time" 
                      value={(t.hora_inicio || '11:00').substring(0, 5)} 
                      onChange={(e) => handleTimeChange(t.id, e.target.value, t.asignado_a)}
                      style={{
                        border: '1px solid var(--border)', borderRadius: '4px',
                        padding: '2px 4px', fontSize: '11px', cursor: 'pointer'
                      }}
                    />
                  </div>
                  <div style={{fontSize: 12, marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <span style={{background: 'var(--bg)', padding: '2px 6px', borderRadius: 4, fontSize: '11px', fontWeight: 600}}>{t.estado.replace(/_/g, ' ')}</span>
                    <button
                      onClick={() => handleWhatsApp(t.id)}
                      style={{background:'#25D366', color:'white', border:'none', padding:'4px 8px', borderRadius:4, cursor:'pointer', fontSize:11, fontWeight:'bold'}}
                    >
                      WhatsApp
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════
// Mantenimiento Tab
// ═══════════════════════════════════════════
function MantenimientoTab({ data, propiedades, onRefresh, showToast, onAction }) {
  const [filterProp, setFilterProp] = useState('');
  
  const filtered = filterProp ? data.filter(i => i.propiedad_id === filterProp) : data;

  const handleUpdateEstado = async (id, nuevoEstado) => {
    try {
      await actualizarIncidencia(id, { estado: nuevoEstado });
      showToast('Estado actualizado');
      onRefresh();
    } catch (e) {
      alert('Error al actualizar estado');
    }
  };

  const getPublicLink = (token) => {
    if (!token) return null;
    return `${window.location.origin}/reparacion/aprobar/${token}`;
  };

  const copyLink = (token) => {
    const link = getPublicLink(token);
    navigator.clipboard.writeText(link);
    alert('Link de aprobación copiado. Envíalo al propietario.');
  };

  return (
    <div className="admin-fade-in">
      <div className="admin-topbar">
        <div>
          <h2>Mantenimiento y Reparaciones</h2>
          <div className="topbar-subtitle">Control de daños, compras y mantenimiento preventivo</div>
        </div>
        <div className="topbar-actions">
           <select 
            className="select-field" 
            style={{width: 200, marginRight: 10}}
            value={filterProp}
            onChange={e => setFilterProp(e.target.value)}
          >
            <option value="">Todas las propiedades</option>
            {propiedades.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
          <button className="btn-admin btn-admin-primary" onClick={() => onAction({ type: 'incidencia' })}>
            ＋ Reportar Incidencia
          </button>
        </div>
      </div>

      <div className="admin-table-wrapper">
        <div className="admin-table-header">
          <h3>Lista de Incidencias</h3>
          <span className="table-count">{filtered.length} reportes</span>
        </div>
        {filtered.length === 0 ? (
          <div className="admin-empty">
             <div className="empty-icon">🔧</div>
             <h4>Sin incidencias</h4>
             <p>Todo está al día en tus propiedades.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Ficha / Título</th>
                <th>Propiedad</th>
                <th>Tipo</th>
                <th>Urgencia</th>
                <th>Estado</th>
                <th>Presupuesto</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(i => (
                <tr key={i.id}>
                  <td>
                    <div className="table-name">{i.titulo}</div>
                    <div className="table-sub">{i.descripcion.substring(0, 40)}...</div>
                  </td>
                  <td>{i.nombre_propiedad || '—'}</td>
                  <td><span className="admin-badge admin-badge-neutral">{i.tipo}</span></td>
                  <td>
                    {i.urgente ? 
                      <span className="admin-badge admin-badge-error">🔥 URGENTE</span> 
                      : <span className="admin-badge admin-badge-neutral">Normal</span>
                    }
                  </td>
                  <td><EstadoIncidenciaBadge estado={i.estado} /></td>
                  <td>
                    {i.costo_estimado ? <strong>${i.costo_estimado}</strong> : '—'}
                  </td>
                  <td>
                    <div className="table-actions">
                      {i.token_aprobacion && i.estado === 'PENDIENTE' && (
                        <button 
                          className="btn-admin btn-admin-info btn-admin-sm"
                          onClick={() => copyLink(i.token_aprobacion)}
                        >
                          🔗 Link Dueño
                        </button>
                      )}
                      
                      {i.estado === 'APROBADO' && (
                         <button 
                          className="btn-admin btn-admin-success btn-admin-sm"
                          onClick={() => handleUpdateEstado(i.id, 'COMPLETADO')}
                         >
                           ✅ Reparado
                         </button>
                      )}

                      {i.estado === 'PENDIENTE' && (
                         <button 
                          className="btn-admin btn-admin-primary btn-admin-sm"
                          onClick={() => handleUpdateEstado(i.id, 'ENVIADO_A_DUENO')}
                         >
                           📤 Enviar
                         </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function EstadoIncidenciaBadge({ estado }) {
  const map = {
    PENDIENTE: { cls: 'admin-badge-warning', txt: 'Esperando Admin' },
    ENVIADO_A_DUENO: { cls: 'admin-badge-info', txt: 'Enviado al Dueño' },
    APROBADO: { cls: 'admin-badge-success', txt: 'Aprobado para Reparar' },
    RECHAZADO: { cls: 'admin-badge-error', txt: 'Rechazado' },
    COMPLETADO: { cls: 'admin-badge-purple', txt: 'Reparado / Terminado' },
    PAGADO: { cls: 'admin-badge-success', txt: 'Pagado' },
  };
  const s = map[estado] || map.PENDIENTE;
  return <span className={`admin-badge ${s.cls}`}>{s.txt}</span>;
}

function StaffTab({ data, onAction, onRefresh, showToast }) {
  const rolMap = {
    LIMPIEZA: { badge: 'admin-badge-info', label: '🧹 Limpieza' },
    MANTENIMIENTO: { badge: 'admin-badge-warning', label: '🔧 Mantenimiento' },
    ADMIN: { badge: 'admin-badge-purple', label: '👑 Admin' },
  };

  return (
    <div className="admin-fade-in">
      <div className="admin-topbar">
        <div>
          <h2>Staff</h2>
          <div className="topbar-subtitle">Gestión del personal</div>
        </div>
        <div className="topbar-actions">
          <button className="btn-admin btn-admin-primary" onClick={() => onAction({ type: 'staff' })}>
            ＋ Nuevo Miembro
          </button>
        </div>
      </div>

      <div className="admin-table-wrapper">
        <div className="admin-table-header">
          <h3>Equipo</h3>
          <span className="table-count">{data.length} miembros</span>
        </div>
        {data.length === 0 ? (
          <div className="admin-empty">
            <div className="empty-icon">👥</div>
            <h4>Sin personal</h4>
            <p>Agrega miembros del staff para asignar tareas.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Doc. Identidad</th>
                <th>Teléfono</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.map(s => {
                const rol = rolMap[s.rol] || rolMap.LIMPIEZA;
                return (
                  <tr key={s.id}>
                    <td><div className="table-name">{s.nombre}</div></td>
                    <td>
                      <div className="table-name">{s.documento}</div>
                      {s.email && <div className="table-sub">{s.email}</div>}
                    </td>
                    <td>{s.telefono || '—'}</td>
                    <td><span className={`admin-badge ${rol.badge}`}>{rol.label}</span></td>
                    <td>
                      <span className={`admin-badge ${s.disponible ? 'admin-badge-success' : 'admin-badge-error'}`}>
                        {s.disponible ? '✓ Disponible' : '✕ No disponible'}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="btn-admin btn-admin-outline btn-admin-sm" onClick={() => onAction({ type: 'staff-edit', edit: s })}>✏️ Editar</button>
                        <button className={`btn-admin btn-admin-sm ${s.disponible ? 'btn-admin-danger' : 'btn-admin-primary'}`} onClick={async () => { try { await actualizarStaff(s.id, { disponible: !s.disponible }); showToast(s.disponible ? 'Staff no disponible' : 'Staff disponible'); onRefresh(); } catch(e) { alert('Error'); } }}>{s.disponible ? '⏸️' : '▶️'}</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// Badges
// ═══════════════════════════════════════════
function EstadoBadge({ estado }) {
  const map = {
    PENDIENTE: { cls: 'admin-badge-warning', txt: '⏳ En Bolsa' },
    ASIGNADA_NO_CONFIRMADA: { cls: 'admin-badge-warning', txt: '🔔 Por Confirmar' },
    ACEPTADA: { cls: 'admin-badge-success', txt: '✅ Confirmada' },
    EN_PROGRESO: { cls: 'admin-badge-info', txt: '▶ En Progreso' },
    CLEAN_AND_READY: { cls: 'admin-badge-success', txt: '✓ Clean & Ready' },
    COMPLETADA: { cls: 'admin-badge-success', txt: '✓ Completada' },
    VERIFICADA: { cls: 'admin-badge-purple', txt: '✦ Verificada' },
  };
  const s = map[estado] || map.PENDIENTE;
  return <span className={`admin-badge ${s.cls}`}>{s.txt}</span>;
}

function EstadoReservaBadge({ estado }) {
  const map = {
    CONFIRMADA: { cls: 'admin-badge-success', txt: '✓ Confirmada' },
    CANCELADA: { cls: 'admin-badge-error', txt: '✕ Cancelada' },
    COMPLETADA: { cls: 'admin-badge-neutral', txt: '✓ Completada' },
  };
  const s = map[estado] || map.CONFIRMADA;
  return <span className={`admin-badge ${s.cls}`}>{s.txt}</span>;
}

function FuenteBadge({ fuente }) {
  const map = {
    AIRBNB: { cls: 'admin-badge-error', txt: 'Airbnb' },
    BOOKING: { cls: 'admin-badge-info', txt: 'Booking' },
    VRBO: { cls: 'admin-badge-purple', txt: 'VRBO' },
    MANUAL: { cls: 'admin-badge-neutral', txt: 'Manual' },
    OTRO: { cls: 'admin-badge-neutral', txt: 'Otro' },
  };
  const s = map[fuente] || map.MANUAL;
  return <span className={`admin-badge ${s.cls}`}>{s.txt}</span>;
}

// ═══════════════════════════════════════════
// Modal Form
// ═══════════════════════════════════════════
function ModalForm({ config, onClose, onRefresh, showToast, propiedades }) {
  const isEdit = !!config.edit;
  const [form, setForm] = useState(config.edit || {});
  const [saving, setSaving] = useState(false);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (config.type === 'propiedad' && isEdit) {
        await actualizarPropiedad(config.edit.id, {
          nombre: form.nombre,
          direccion: form.direccion,
          ciudad: form.ciudad,
          num_habitaciones: parseInt(form.num_habitaciones) || 1,
          ical_url: form.ical_url || null,
          hora_checkin: form.hora_checkin || '15:00',
          hora_checkout: form.hora_checkout || '11:00',
        });
        showToast('Propiedad actualizada');
      } else if (config.type === 'propiedad') {
        await crearPropiedad({
          nombre: form.nombre,
          direccion: form.direccion,
          ciudad: form.ciudad,
          num_habitaciones: parseInt(form.num_habitaciones) || 1,
          ical_url: form.ical_url || null,
          hora_checkin: form.hora_checkin || '15:00',
          hora_checkout: form.hora_checkout || '11:00',
        });
        showToast('Propiedad creada exitosamente');
      } else if (config.type === 'reserva') {
        await crearReserva({
          propiedad_id: form.propiedad_id,
          nombre_huesped: form.nombre_huesped,
          check_in: form.check_in,
          check_out: form.check_out,
          num_huespedes: parseInt(form.num_huespedes) || 1,
          fuente: form.fuente || 'MANUAL',
        });
        showToast('Reserva creada exitosamente');
      } else if (config.type === 'staff-edit' && isEdit) {
        const updatePayload = {
          nombre: form.nombre,
          documento: form.documento,
          telefono: form.telefono || null,
          rol: form.rol,
        };
        if (form.password) { updatePayload.password = form.password; }
        
        await actualizarStaff(config.edit.id, updatePayload);
        showToast('Staff actualizado');
      } else if (config.type === 'staff') {
        await crearStaffMember({
          nombre: form.nombre,
          documento: form.documento,
          email: form.email || null,
          password: form.password,
          telefono: form.telefono || null,
          rol: form.rol || 'LIMPIEZA',
        });
        showToast('Staff creado exitosamente');
      } else if (config.type === 'incidencia') {
        await crearIncidencia({
          propiedad_id: form.propiedad_id,
          titulo: form.titulo,
          descripcion: form.descripcion,
          tipo: form.tipo || 'REPARACION',
          costo_estimado: parseFloat(form.costo_estimado) || 0,
          urgente: !!form.urgente,
        });
        showToast('Incidencia reportada');
      }
      onRefresh();
      onClose();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            {config.type === 'propiedad' && (isEdit ? '✏️ Editar Propiedad' : '🏠 Nueva Propiedad')}
            {config.type === 'reserva' && '📅 Nueva Reserva'}
            {config.type === 'staff' && '👤 Nuevo Staff'}
            {config.type === 'staff-edit' && '✏️ Editar Staff'}
            {config.type === 'incidencia' && '🛠️ Nueva Incidencia / Reparación'}
          </h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Propiedad Form */}
            {config.type === 'propiedad' && (
              <>
                <div className="input-group">
                  <label>Nombre de la propiedad</label>
                  <input className="input-field" required placeholder="Ej: Casa Playa Norte"
                    value={form.nombre || ''} onChange={e => set('nombre', e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Dirección</label>
                  <input className="input-field" required placeholder="Calle, número, colonia"
                    value={form.direccion || ''} onChange={e => set('direccion', e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Ciudad</label>
                  <input className="input-field" required placeholder="Ej: Cancún"
                    value={form.ciudad || ''} onChange={e => set('ciudad', e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Número de habitaciones</label>
                  <input className="input-field" type="number" min="1" placeholder="1"
                    value={form.num_habitaciones || ''} onChange={e => set('num_habitaciones', e.target.value)} />
                </div>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <div className="input-group" style={{ flex: 1 }}>
                    <label>Hora de Check-in</label>
                    <input className="input-field" type="time"
                      value={(form.hora_checkin || '15:00').substring(0, 5)} onChange={e => set('hora_checkin', e.target.value)} />
                  </div>
                  <div className="input-group" style={{ flex: 1 }}>
                    <label>Hora de Check-out</label>
                    <input className="input-field" type="time"
                      value={(form.hora_checkout || '11:00').substring(0, 5)} onChange={e => set('hora_checkout', e.target.value)} />
                  </div>
                </div>
                <div className="input-group">
                  <label>URL iCal (Airbnb/Booking)</label>
                  <input className="input-field" placeholder="https://www.airbnb.com/calendar/ical/..."
                    value={form.ical_url || ''} onChange={e => set('ical_url', e.target.value)} />
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>
                    Pega la URL de exportación iCal de tu plataforma para sincronizar reservas automáticamente.
                  </div>
                </div>
              </>
            )}

            {/* Reserva Form */}
            {config.type === 'reserva' && (
              <>
                <div className="input-group">
                  <label>Propiedad</label>
                  <select className="select-field" required
                    value={form.propiedad_id || ''} onChange={e => set('propiedad_id', e.target.value)}>
                    <option value="">Selecciona una propiedad</option>
                    {propiedades.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre} — {p.ciudad}</option>
                    ))}
                  </select>
                </div>
                <div className="input-group">
                  <label>Nombre del huésped</label>
                  <input className="input-field" required placeholder="Nombre completo"
                    value={form.nombre_huesped || ''} onChange={e => set('nombre_huesped', e.target.value)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="input-group">
                    <label>Check-in</label>
                    <input className="input-field" type="date" required
                      value={form.check_in || ''} onChange={e => set('check_in', e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>Check-out</label>
                    <input className="input-field" type="date" required
                      value={form.check_out || ''} onChange={e => set('check_out', e.target.value)} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="input-group">
                    <label>Huéspedes</label>
                    <input className="input-field" type="number" min="1" placeholder="1"
                      value={form.num_huespedes || ''} onChange={e => set('num_huespedes', e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>Fuente</label>
                    <select className="select-field" value={form.fuente || 'MANUAL'} onChange={e => set('fuente', e.target.value)}>
                      <option value="MANUAL">Manual</option>
                      <option value="AIRBNB">Airbnb</option>
                      <option value="BOOKING">Booking</option>
                      <option value="VRBO">VRBO</option>
                      <option value="OTRO">Otro</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Staff Form (create) */}
            {config.type === 'staff' && (
              <>
                <div className="input-group">
                  <label>Nombre completo</label>
                  <input className="input-field" required placeholder="María García"
                    value={form.nombre || ''} onChange={e => set('nombre', e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Documento de Identidad (Obligatorio)</label>
                  <input className="input-field" required placeholder="Cédula, Pasaporte, Licencia..."
                    value={form.documento || ''} onChange={e => set('documento', e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Email (Opcional)</label>
                  <input className="input-field" type="email" placeholder="maria@clearhost.com"
                    value={form.email || ''} onChange={e => set('email', e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Contraseña</label>
                  <input className="input-field" type="password" required placeholder="••••••••"
                    value={form.password || ''} onChange={e => set('password', e.target.value)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="input-group">
                    <label>Teléfono</label>
                    <input className="input-field" placeholder="+52 998 123 4567"
                      value={form.telefono || ''} onChange={e => set('telefono', e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>Rol</label>
                    <select className="select-field" value={form.rol || 'LIMPIEZA'} onChange={e => set('rol', e.target.value)}>
                      <option value="LIMPIEZA">🧹 Limpieza</option>
                      <option value="MANTENIMIENTO">🔧 Mantenimiento</option>
                      <option value="ADMIN">👑 Admin</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Staff Form (edit) */}
            {config.type === 'staff-edit' && (
              <>
                <div className="input-group">
                  <label>Nombre completo</label>
                  <input className="input-field" required
                    value={form.nombre || ''} onChange={e => set('nombre', e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Documento de Identidad (Requerido)</label>
                  <input className="input-field" required placeholder="Cédula, Pasaporte..."
                    value={form.documento || ''} onChange={e => set('documento', e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Cambiar Contraseña (Opcional)</label>
                  <input className="input-field" type="password" placeholder="Escribe para cambiarla..."
                    value={form.password || ''} onChange={e => set('password', e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Email (Opcional, no editable)</label>
                  <input className="input-field" disabled value={form.email || ''} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="input-group">
                    <label>Teléfono</label>
                    <input className="input-field" placeholder="+52 998 123 4567"
                      value={form.telefono || ''} onChange={e => set('telefono', e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>Rol</label>
                    <select className="select-field" value={form.rol || 'LIMPIEZA'} onChange={e => set('rol', e.target.value)}>
                      <option value="LIMPIEZA">🧹 Limpieza</option>
                      <option value="MANTENIMIENTO">🔧 Mantenimiento</option>
                      <option value="ADMIN">👑 Admin</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Incidencia Form */}
            {config.type === 'incidencia' && (
              <>
                <div className="input-group">
                  <label>Propiedad</label>
                  <select className="select-field" required
                    value={form.propiedad_id || ''} onChange={e => set('propiedad_id', e.target.value)}>
                    <option value="">Selecciona una propiedad</option>
                    {propiedades.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="input-group">
                  <label>Título del reporte</label>
                  <input className="input-field" required placeholder="Ej: Fugas aire, Pintura recámara, Pilas..."
                    value={form.titulo || ''} onChange={e => set('titulo', e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Descripción detallada</label>
                  <textarea className="input-field" style={{height: 80}} required
                    placeholder="Explica qué se necesita hacer o comprar..."
                    value={form.descripcion || ''} onChange={e => set('descripcion', e.target.value)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="input-group">
                    <label>Tipo</label>
                    <select className="select-field" value={form.tipo || 'REPARACION'} onChange={e => set('tipo', e.target.value)}>
                      <option value="REPARACION">🔨 Reparación</option>
                      <option value="MANTENIMIENTO">🧹 Mantenimiento Profundo</option>
                      <option value="MISCELANEO">🛒 Compra / Misceláneo</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Costo Estimado ($)</label>
                    <input className="input-field" type="number" step="0.01" placeholder="0.00"
                      value={form.costo_estimado || ''} onChange={e => set('costo_estimado', e.target.value)} />
                  </div>
                </div>
                <div className="input-group" style={{flexDirection:'row', alignItems:'center', gap:10}}>
                  <input type="checkbox" id="urgente" checked={form.urgente || false} onChange={e => set('urgente', e.target.checked)} />
                  <label htmlFor="urgente" style={{marginBottom:0, cursor:'pointer'}}>🔥 Marcar como URGENTE</label>
                </div>
              </>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-admin btn-admin-outline" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-admin btn-admin-primary" disabled={saving}>
              {saving ? 'Guardando...' : '💾 Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
