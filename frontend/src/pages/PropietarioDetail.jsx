import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { isAuthenticated, getStoredStaff } from '../services/api';
import api from '../services/api';
import './PropietarioDetail.css';

const fetchDashboard = (id, mes, anio) =>
  api.get(`/propietarios/${id}/dashboard`, { params: { mes, anio } }).then(r => r.data);

const fetchStaff = () => api.get('/staff/').then(r => r.data);

const TABS = [
  { id: 'propiedades', label: 'Propiedades', icon: '🏠' },
  { id: 'reservas', label: 'Reservas', icon: '📅' },
  { id: 'tareas', label: 'Limpieza', icon: '🧹' },
  { id: 'incidencias', label: 'Reparaciones', icon: '🔧' },
  { id: 'inventario', label: 'Inventario', icon: '📦' },
  { id: 'liquidacion', label: 'Liquidación', icon: '💰' },
];

const ESTADOS_COLOR = {
  PENDIENTE: '#f59e0b',
  EN_PROGRESO: '#3b82f6',
  COMPLETADA: '#10b981',
  VERIFICADA: '#6366f1',
  CANCELADA: '#ef4444',
  CONFIRMADA: '#10b981',
  TENTATIVA: '#f59e0b',
  ABIERTO: '#ef4444',
  EN_REVISION: '#f59e0b',
  RESUELTO: '#10b981',
  ASIGNADA_NO_CONFIRMADA: '#f59e0b',
  ACEPTADA: '#3b82f6',
  CLEAN_AND_READY: '#10b981',
};

const PRIORIDADES = ['BAJA', 'MEDIA', 'ALTA', 'EMERGENCIA'];

export default function PropietarioDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('propiedades');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [staffList, setStaffList] = useState([]);

  // Modales
  const [showTareaModal, setShowTareaModal] = useState(false);
  const [showInvModal, setShowInvModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form Tarea
  const [tareaForm, setTareaForm] = useState({
    propiedad_id: '',
    asignado_a: '',
    fecha_programada: new Date().toISOString().split('T')[0],
    hora_inicio: '11:00',
    prioridad: 'MEDIA',
    notas_staff: '',
    requiere_lavado_ropa: false,
  });

  // Form Inventario
  const [invForm, setInvForm] = useState({
    articulo: '',
    categoria: 'General',
    stock_actual: 0,
    stock_minimo: 0,
    propiedad_id: '',
    costo_unitario: 0,
  });

  // Filtros de mes
  const hoy = new Date();
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [anio, setAnio] = useState(hoy.getFullYear());

  useEffect(() => {
    if (!isAuthenticated()) { navigate('/'); return; }
    const staff = getStoredStaff();
    if (staff?.rol !== 'ADMIN') { navigate('/dashboard'); return; }
    load();
    loadStaff();
  }, [id, mes, anio]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchDashboard(id, mes, anio);
      setData(result);
    } catch (err) {
      setError('No se pudo cargar el dashboard del propietario');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadStaff = async () => {
    try {
      const list = await fetchStaff();
      setStaffList(list);
    } catch (e) {
      console.error('Error cargando staff', e);
    }
  };

  const handleCreateTarea = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/tareas/', tareaForm);
      setShowTareaModal(false);
      load(); // Recargar datos
    } catch (err) {
      alert('Error al crear tarea');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateInv = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/propietarios/${id}/inventario/`, invForm);
      setShowInvModal(false);
      load(); // Recargar datos
    } catch (err) {
      alert('Error al registrar insumo');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="owner-loading">
      <div className="owner-spinner" />
      <span>Cargando dashboard del propietario...</span>
    </div>
  );

  if (error || !data) return (
    <div className="owner-error">
      <div style={{ fontSize: 48 }}>⚠️</div>
      <h3>{error || 'Propietario no encontrado'}</h3>
      <button className="btn-back" onClick={() => navigate('/admin')}>← Volver al Panel</button>
    </div>
  );

  const { propietario, propiedades, reservas, tareas, incidencias, inventario, resumen } = data;
  const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  // Calcular cargos estimados
  const costoReparaciones = incidencias.reduce((sum, i) => sum + (i.costo_estimado || 0), 0);
  const tareasDelMes = tareas.filter(t => {
    if (!t.completada_at) return false;
    const d = new Date(t.completada_at);
    return d.getMonth() + 1 === mes && d.getFullYear() === anio;
  });
  const costoLimpieza = tareasDelMes.reduce((sum, t) => sum + (t.tarifa_limpieza || 0), 0);

  return (
    <div className="owner-detail">
      {/* ── Header ── */}
      <header className="owner-header">
        <button className="btn-back-arrow" onClick={() => navigate('/admin?tab=propietarios')}>
          ← Propietarios
        </button>
        <div className="owner-hero">
          <div className="owner-avatar">{propietario.nombre.charAt(0).toUpperCase()}</div>
          <div className="owner-info">
            <h1>{propietario.nombre}</h1>
            <div className="owner-meta">
              {propietario.email && <span>✉️ {propietario.email}</span>}
              {propietario.telefono && <span>📞 {propietario.telefono}</span>}
              <span>🏠 {resumen.total_propiedades} propiedad{resumen.total_propiedades !== 1 ? 'es' : ''}</span>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="owner-kpis">
          <div className="kpi-card kpi-blue">
            <div className="kpi-icon">🏠</div>
            <div className="kpi-val">{resumen.total_propiedades}</div>
            <div className="kpi-label">Propiedades</div>
          </div>
          <div className="kpi-card kpi-green">
            <div className="kpi-icon">📅</div>
            <div className="kpi-val">{resumen.reservas_activas}</div>
            <div className="kpi-label">Reservas Activas</div>
          </div>
          <div className="kpi-card kpi-orange">
            <div className="kpi-icon">🧹</div>
            <div className="kpi-val">{resumen.tareas_pendientes}</div>
            <div className="kpi-label">Tareas Pendientes</div>
          </div>
          <div className="kpi-card kpi-red">
            <div className="kpi-icon">🔧</div>
            <div className="kpi-val">{resumen.incidencias_abiertas}</div>
            <div className="kpi-label">Reparaciones Abiertas</div>
          </div>
          <div className="kpi-card kpi-purple">
            <div className="kpi-icon">🌙</div>
            <div className="kpi-val">{resumen.noches_mes}</div>
            <div className="kpi-label">Noches / {MESES[mes - 1]}</div>
          </div>
        </div>
      </header>

      {/* ── Navegación tabs ── */}
      <nav className="owner-tabs-nav">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`owner-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}

        <div className="month-selector">
          <select value={mes} onChange={e => setMes(Number(e.target.value))}>
            {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={anio} onChange={e => setAnio(Number(e.target.value))}>
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </nav>

      {/* ── Contenido ── */}
      <main className="owner-content">

        {/* ── Tab: Propiedades ── */}
        {activeTab === 'propiedades' && (
          <section className="owner-section">
            <div className="section-title">
              <h2>🏠 Propiedades del Propietario</h2>
              <span className="badge-count">{propiedades.length}</span>
            </div>
            {propiedades.length === 0 ? (
              <EmptyState icon="🏠" msg="Sin propiedades asignadas" />
            ) : (
              <div className="props-grid">
                {propiedades.map(p => {
                  const reservasActivas = (reservas || []).filter(r => r.propiedad_id === p.id && r.estado === 'CONFIRMADA');
                  const tareasPropiedad = (tareas || []).filter(t => t.propiedad_id === p.id && ['PENDIENTE', 'EN_PROGRESO'].includes(t.estado));
                  return (
                    <div key={p.id} className={`prop-card ${p.activa ? '' : 'prop-card-inactive'}`}>
                      <div className="prop-card-icon">🏠</div>
                      <div className="prop-card-body">
                        <h3>{p.nombre}</h3>
                        <p className="prop-city">{p.ciudad}</p>
                        <p className="prop-addr">{p.direccion}</p>
                        <div className="prop-chips">
                          <span>🛏 {p.num_habitaciones} hab</span>
                          {p.tarifa_limpieza && <span>🧹 ${p.tarifa_limpieza}/limpieza</span>}
                        </div>
                      </div>
                      <div className="prop-card-stats">
                        <span className={`pill ${reservasActivas.length > 0 ? 'pill-green' : 'pill-gray'}`}>
                          📅 {reservasActivas.length} reserva{reservasActivas.length !== 1 ? 's' : ''} activa{reservasActivas.length !== 1 ? 's' : ''}
                        </span>
                        <span className={`pill ${tareasPropiedad.length > 0 ? 'pill-orange' : 'pill-gray'}`}>
                          🧹 {tareasPropiedad.length} tarea{tareasPropiedad.length !== 1 ? 's' : ''} pendiente{tareasPropiedad.length !== 1 ? 's' : ''}
                        </span>
                        <span className={`pill ${p.activa ? 'pill-green' : 'pill-red'}`}>
                          {p.activa ? '✓ Activa' : '✕ Inactiva'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ── Tab: Reservas ── */}
        {activeTab === 'reservas' && (
          <section className="owner-section">
            <div className="section-title">
              <h2>📅 Reservas</h2>
              <span className="badge-count">{(reservas || []).length}</span>
            </div>
            {(reservas || []).length === 0 ? (
              <EmptyState icon="📅" msg="Sin reservas registradas" />
            ) : (
              <table className="owner-table">
                <thead>
                  <tr>
                    <th>Huésped</th>
                    <th>Propiedad</th>
                    <th>Check-in</th>
                    <th>Check-out</th>
                    <th>Fuente</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {reservas.map(r => (
                    <tr key={r.id}>
                      <td><span className="td-bold">{r.nombre_huesped}</span></td>
                      <td>{r.propiedad_nombre}</td>
                      <td>{r.check_in}</td>
                      <td>{r.check_out}</td>
                      <td><span className="badge-fuente">{r.fuente}</span></td>
                      <td>
                        <span className="status-pill" style={{ background: ESTADOS_COLOR[r.estado] + '22', color: ESTADOS_COLOR[r.estado], border: `1px solid ${ESTADOS_COLOR[r.estado]}44` }}>
                          {r.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}

        {/* ── Tab: Tareas de Limpieza ── */}
        {activeTab === 'tareas' && (
          <section className="owner-section">
            <div className="section-header-actions">
              <div className="section-title">
                <h2>🧹 Tareas de Limpieza</h2>
                <span className="badge-count">{(tareas || []).length}</span>
              </div>
              <button className="btn-add-manual" onClick={() => setShowTareaModal(true)}>
                <span>+</span> Nueva Tarea Manual
              </button>
            </div>
            {(tareas || []).length === 0 ? (
              <EmptyState icon="🧹" msg="Sin tareas registradas" />
            ) : (
              <table className="owner-table">
                <thead>
                  <tr>
                    <th>Propiedad</th>
                    <th>Fecha</th>
                    <th>Prioridad</th>
                    <th>Estado</th>
                    <th>Tarifa</th>
                    <th>Completada</th>
                  </tr>
                </thead>
                <tbody>
                  {tareas.map(t => (
                    <tr key={t.id}>
                      <td>{t.propiedad_nombre}</td>
                      <td>{t.fecha_programada}</td>
                      <td>
                        <span className="prioridad-badge" data-prioridad={t.prioridad}>{t.prioridad}</span>
                      </td>
                      <td>
                        <span className="status-pill" style={{ background: ESTADOS_COLOR[t.estado] + '22', color: ESTADOS_COLOR[t.estado], border: `1px solid ${ESTADOS_COLOR[t.estado]}44` }}>
                          {t.estado}
                        </span>
                      </td>
                      <td>{t.tarifa_limpieza ? `$${t.tarifa_limpieza}` : '—'}</td>
                      <td>{t.completada_at ? new Date(t.completada_at).toLocaleDateString('es-MX') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}

        {/* ── Tab: Reparaciones / Incidencias ── */}
        {activeTab === 'incidencias' && (
          <section className="owner-section">
            <div className="section-header-actions">
              <div className="section-title">
                <h2>🔧 Reparaciones e Incidencias</h2>
                <span className="badge-count">{(incidencias || []).length}</span>
              </div>
            </div>
            {(incidencias || []).length === 0 ? (
              <EmptyState icon="🔧" msg="Sin reparaciones registradas" />
            ) : (
              <table className="owner-table">
                <thead>
                  <tr>
                    <th>Título</th>
                    <th>Propiedad</th>
                    <th>Tipo</th>
                    <th>Estado</th>
                    <th>Urgente</th>
                    <th>Costo Est.</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {incidencias.map(i => (
                    <tr key={i.id}>
                      <td><span className="td-bold">{i.titulo}</span></td>
                      <td>{i.propiedad_nombre}</td>
                      <td><span className="badge-tipo">{i.tipo}</span></td>
                      <td>
                        <span className="status-pill" style={{ background: ESTADOS_COLOR[i.estado] + '22', color: ESTADOS_COLOR[i.estado], border: `1px solid ${ESTADOS_COLOR[i.estado]}44` }}>
                          {i.estado}
                        </span>
                      </td>
                      <td>{i.urgente ? '🔥 Sí' : '—'}</td>
                      <td>{i.costo_estimado ? `$${Number(i.costo_estimado).toLocaleString()}` : '—'}</td>
                      <td>{i.fecha_reporte ? new Date(i.fecha_reporte).toLocaleDateString('es-MX') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}

        {/* ── Tab: Inventario ── */}
        {activeTab === 'inventario' && (
          <section className="owner-section">
            <div className="section-header-actions">
              <div className="section-title">
                <h2>📦 Control de Stock e Insumos</h2>
                <span className="badge-count">{(inventario || []).length}</span>
              </div>
              <button className="btn-add-manual" onClick={() => setShowInvModal(true)}>
                <span>+</span> Registrar Insumo
              </button>
            </div>
            {(inventario || []).length === 0 ? (
              <EmptyState icon="📦" msg="Sin activos registrados" />
            ) : (
              <table className="owner-table">
                <thead>
                  <tr>
                    <th>Artículo</th>
                    <th>Propiedad / Ubicación</th>
                    <th>Stock Actual</th>
                    <th>Nivel Mínimo</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {inventario.map((a, idx) => {
                    const isLow = a.cantidad > 0 && a.cantidad <= a.stock_minimo;
                    const isCritical = a.cantidad <= 0;
                    return (
                      <tr key={idx} className={isCritical ? 'stock-alert-critical' : isLow ? 'stock-alert-low' : ''}>
                        <td><span className="td-bold">{a.activo}</span></td>
                        <td>{a.propiedad_nombre || 'Global'}</td>
                        <td><span className="qty-badge">{a.cantidad}</span></td>
                        <td>{a.stock_minimo || 0}</td>
                        <td>
                          {isCritical ? (
                            <span className="stock-badge stock-critical">⚠️ Sin Stock</span>
                          ) : isLow ? (
                            <span className="stock-badge stock-low">⚡ Reordenar</span>
                          ) : (
                            <span className="stock-badge stock-ok">✓ OK</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </section>
        )}

        {/* ── Tab: Liquidación ── */}
        {activeTab === 'liquidacion' && (
          <section className="owner-section">
            <div className="section-title">
              <h2>💰 Liquidación — {MESES[mes - 1]} {anio}</h2>
            </div>
            <div className="liquidacion-layout">
              <div className="liquidacion-card liquidacion-green">
                <div className="liq-header">
                  <span className="liq-icon">📈</span>
                  <h3>Ingresos Estimados</h3>
                </div>
                <div className="liq-items">
                  <div className="liq-item">
                    <span>Noches ocupadas</span>
                    <span className="liq-val">{resumen.noches_mes}</span>
                  </div>
                  <div className="liq-item liq-note">
                    <span>⚠️ El ingreso real depende de la tarifa por noche configurada.</span>
                  </div>
                </div>
              </div>

              <div className="liquidacion-card liquidacion-red">
                <div className="liq-header">
                  <span className="liq-icon">📉</span>
                  <h3>Gastos del Mes</h3>
                </div>
                <div className="liq-items">
                  <div className="liq-item">
                    <span>🧹 Costo de limpieza ({tareasDelMes.length} tareas)</span>
                    <span className="liq-val liq-expense">${costoLimpieza.toLocaleString()}</span>
                  </div>
                  <div className="liq-item">
                    <span>🔧 Reparaciones (costo est.)</span>
                    <span className="liq-val liq-expense">${costoReparaciones.toLocaleString()}</span>
                  </div>
                  <div className="liq-separator" />
                  <div className="liq-item liq-total">
                    <span>Total Gastos Estimados</span>
                    <span className="liq-val liq-expense liq-total-val">
                      ${(costoLimpieza + costoReparaciones).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="owner-bank-info">
              <h3>🏦 Datos para Transferencia</h3>
              {propietario.datos_bancarios ? (
                <pre className="bank-data">{propietario.datos_bancarios}</pre>
              ) : (
                <p className="bank-empty">Sin datos bancarios registrados.</p>
              )}
            </div>
          </section>
        )}
      </main>

      {/* ── MODAL: NUEVA TAREA ── */}
      {showTareaModal && (
        <div className="owner-modal-overlay">
          <div className="owner-modal">
            <h2>🧹 Crear Tarea Manual</h2>
            <form className="owner-form" onSubmit={handleCreateTarea}>
              <div className="form-group">
                <label>Propiedad</label>
                <select 
                  required 
                  value={tareaForm.propiedad_id} 
                  onChange={e => setTareaForm({...tareaForm, propiedad_id: e.target.value})}
                >
                  <option value="">Selecciona una propiedad...</option>
                  {propiedades.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Asignar a</label>
                <select 
                  required 
                  value={tareaForm.asignado_a} 
                  onChange={e => setTareaForm({...tareaForm, asignado_a: e.target.value})}
                >
                  <option value="">Selecciona personal...</option>
                  {(staffList || []).map(s => <option key={s.id} value={s.id}>{s.nombre} ({s.rol})</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Prioridad</label>
                <select 
                  value={tareaForm.prioridad} 
                  onChange={e => setTareaForm({...tareaForm, prioridad: e.target.value})}
                >
                  {PRIORIDADES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Fecha</label>
                <input 
                  type="date" 
                  required 
                  value={tareaForm.fecha_programada}
                  onChange={e => setTareaForm({...tareaForm, fecha_programada: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Notas</label>
                <textarea 
                  placeholder="Instrucciones adicionales..."
                  value={tareaForm.notas_staff}
                  onChange={e => setTareaForm({...tareaForm, notas_staff: e.target.value})}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowTareaModal(false)}>Cancelar</button>
                <button type="submit" className="btn-submit" disabled={submitting}>
                  {submitting ? 'Creando...' : 'Crear Tarea'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: REGISTRAR INSUMO ── */}
      {showInvModal && (
        <div className="owner-modal-overlay">
          <div className="owner-modal">
            <h2>📦 Registrar Insumo</h2>
            <form className="owner-form" onSubmit={handleCreateInv}>
              <div className="form-group">
                <label>Nombre del Artículo</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Ej. Detergente, Sábanas..."
                  value={invForm.articulo}
                  onChange={e => setInvForm({...invForm, articulo: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Propiedad Asignada (Opcional)</label>
                <select 
                  value={invForm.propiedad_id} 
                  onChange={e => setInvForm({...invForm, propiedad_id: e.target.value})}
                >
                  <option value="">Global (Tanto del dueño)</option>
                  {propiedades.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Stock Actual</label>
                  <input 
                    type="number" 
                    required 
                    value={invForm.stock_actual}
                    onChange={e => setInvForm({...invForm, stock_actual: Number(e.target.value)})}
                  />
                </div>
                <div className="form-group">
                  <label>Nivel Mínimo</label>
                  <input 
                    type="number" 
                    required 
                    value={invForm.stock_minimo}
                    onChange={e => setInvForm({...invForm, stock_minimo: Number(e.target.value)})}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowInvModal(false)}>Cancelar</button>
                <button type="submit" className="btn-submit" disabled={submitting}>
                  {submitting ? 'Guardando...' : 'Guardar Artículo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

function EmptyState({ icon, msg }) {
  return (
    <div className="owner-empty">
      <div className="empty-icon-large">{icon}</div>
      <p>{msg}</p>
    </div>
  );
}
