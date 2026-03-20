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

const crearPropiedad = (data) => api.post('/propiedades/', data).then(r => r.data);
const actualizarPropiedad = (id, data) => api.put(`/propiedades/${id}`, data).then(r => r.data);
const eliminarPropiedad = (id) => api.delete(`/propiedades/${id}`);

const crearReserva = (data) => api.post('/reservas/', data).then(r => r.data);
const cancelarReserva = (id) => api.delete(`/reservas/${id}`);

const crearStaffMember = (data) => api.post('/staff/', data).then(r => r.data);
const actualizarStaff = (id, data) => api.put(`/staff/${id}`, data).then(r => r.data);

const verificarTarea = (id) => api.put(`/tareas/${id}/verificar`).then(r => r.data);
const asignarTarea = (id, staffId) => {
  const params = {};
  if (staffId) params.staff_id = staffId;
  return api.put(`/tareas/${id}/asignar`, null, { params }).then(r => r.data);
};
const autoAsignarTareas = () => api.post('/tareas/auto-asignar').then(r => r.data);
const syncIcal = (propId) => api.post(`/reservas/sync-ical/${propId}`).then(r => r.data);

// ─── Tab config ───
const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'propiedades', label: 'Propiedades', icon: '🏠' },
  { id: 'reservas', label: 'Reservas', icon: '📅' },
  { id: 'tareas', label: 'Tareas', icon: '🧹' },
  { id: 'staff', label: 'Staff', icon: '👥' },
];

export default function AdminPanel() {
  const navigate = useNavigate();
  const staff = getStoredStaff();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState({ propiedades: [], reservas: [], tareas: [], staff: [] });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) { navigate('/'); return; }
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [propiedades, reservas, tareas, staffList] = await Promise.all([
        fetchPropiedades(), fetchReservas(), fetchTareas(), fetchStaff(),
      ]);
      setData({ propiedades, reservas, tareas, staff: staffList });
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

  const handleAsignar = async (tareaId, staffId) => {
    setAssigning(tareaId);
    try {
      await asignarTarea(tareaId, staffId || null);
      showToast('Tarea asignada');
      onRefresh();
    } catch (err) {
      alert('Error al asignar tarea');
    } finally {
      setAssigning(null);
    }
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
          <h3>Todas las Tareas</h3>
          <span className="table-count">{data.length} tareas</span>
        </div>
        {data.length === 0 ? (
          <div className="admin-empty">
            <div className="empty-icon">🧹</div>
            <h4>Sin tareas</h4>
            <p>Las tareas se crean automáticamente al crear reservas.</p>
          </div>
        ) : (
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
                      <div className="table-sub">{t.hora_inicio || 'Sin hora'}</div>
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
                        {t.estado === 'COMPLETADA' && (
                          <button
                            className="btn-admin btn-admin-primary btn-admin-sm"
                            onClick={() => handleVerificar(t.id)}
                          >
                            ✓ Verificar
                          </button>
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

              {evidencia.estado === 'COMPLETADA' && (
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
// Staff Tab
// ═══════════════════════════════════════════
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
    PENDIENTE: { cls: 'admin-badge-warning', txt: '⏳ Pendiente' },
    EN_PROGRESO: { cls: 'admin-badge-info', txt: '▶ En Progreso' },
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
        });
        showToast('Propiedad actualizada');
      } else if (config.type === 'propiedad') {
        await crearPropiedad({
          nombre: form.nombre,
          direccion: form.direccion,
          ciudad: form.ciudad,
          num_habitaciones: parseInt(form.num_habitaciones) || 1,
          ical_url: form.ical_url || null,
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
