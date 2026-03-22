import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { isAuthenticated, getStoredStaff } from '../services/api';
import api from '../services/api';
import './PropietarioDetail.css';

const fetchDashboard = (id, mes, anio) =>
  api.get(`/propietarios/${id}/dashboard`, { params: { mes, anio } }).then(r => r.data);

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
};

export default function PropietarioDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('propiedades');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtros de mes
  const hoy = new Date();
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [anio, setAnio] = useState(hoy.getFullYear());

  useEffect(() => {
    if (!isAuthenticated()) { navigate('/'); return; }
    const staff = getStoredStaff();
    if (staff?.rol !== 'ADMIN') { navigate('/dashboard'); return; }
    load();
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

  // Calcular cargos estimados (de incidencias con costo)
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

        {/* Selector de mes (visible en todas las tabs) */}
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
                  const reservasActivas = reservas.filter(r => r.propiedad_id === p.id && r.estado === 'CONFIRMADA');
                  const tareasPropiedad = tareas.filter(t => t.propiedad_id === p.id && ['PENDIENTE', 'EN_PROGRESO'].includes(t.estado));
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
              <span className="badge-count">{reservas.length}</span>
            </div>
            {reservas.length === 0 ? (
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
            <div className="section-title">
              <h2>🧹 Tareas de Limpieza</h2>
              <span className="badge-count">{tareas.length}</span>
            </div>
            {tareas.length === 0 ? (
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
            <div className="section-title">
              <h2>🔧 Reparaciones e Incidencias</h2>
              <span className="badge-count">{incidencias.length}</span>
            </div>
            {incidencias.length === 0 ? (
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
            <div className="section-title">
              <h2>📦 Inventario de Activos</h2>
              <span className="badge-count">{inventario.length}</span>
            </div>
            {inventario.length === 0 ? (
              <EmptyState icon="📦" msg="Sin activos registrados en las propiedades" />
            ) : (
              <div className="inventory-grid">
                {propiedades.map(p => {
                  const activosProp = inventario.filter(a => a.propiedad_id === p.id);
                  if (activosProp.length === 0) return null;
                  return (
                    <div key={p.id} className="inventory-card">
                      <div className="inventory-card-title">
                        <span>🏠</span>
                        <h3>{p.nombre}</h3>
                      </div>
                      <table className="owner-table owner-table-sm">
                        <thead>
                          <tr>
                            <th>Activo</th>
                            <th>Cantidad</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activosProp.map((a, idx) => (
                            <tr key={idx}>
                              <td>{a.activo}</td>
                              <td><span className="qty-badge">{a.cantidad}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>
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
              {/* Columna izquierda: Ingresos estimados */}
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
                    <span>⚠️ El ingreso real depende de la tarifa por noche configurada. Configura tarifas en cada propiedad para calcular automáticamente.</span>
                  </div>
                </div>
              </div>

              {/* Columna derecha: Gastos */}
              <div className="liquidacion-card liquidacion-red">
                <div className="liq-header">
                  <span className="liq-icon">📉</span>
                  <h3>Gastos del Mes</h3>
                </div>
                <div className="liq-items">
                  <div className="liq-item">
                    <span>🧹 Costo de limpieza ({tareasDelMes.length} tareas completadas)</span>
                    <span className="liq-val liq-expense">${costoLimpieza.toLocaleString()}</span>
                  </div>
                  <div className="liq-item">
                    <span>🔧 Reparaciones (costo estimado)</span>
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

            {/* Resumen del propietario */}
            <div className="owner-bank-info">
              <h3>🏦 Datos para Transferencia</h3>
              {propietario.datos_bancarios ? (
                <pre className="bank-data">{propietario.datos_bancarios}</pre>
              ) : (
                <p className="bank-empty">Sin datos bancarios registrados. Edita el propietario para agregarlos.</p>
              )}
            </div>

            {/* Detalle de tareas completadas del mes */}
            <div className="liq-detail-section">
              <h3>🧹 Tareas Completadas en {MESES[mes - 1]}</h3>
              {tareasDelMes.length === 0 ? (
                <EmptyState icon="🧹" msg={`Sin tareas completadas en ${MESES[mes - 1]} ${anio}`} />
              ) : (
                <table className="owner-table">
                  <thead>
                    <tr><th>Propiedad</th><th>Fecha</th><th>Tarifa</th></tr>
                  </thead>
                  <tbody>
                    {tareasDelMes.map(t => (
                      <tr key={t.id}>
                        <td>{t.propiedad_nombre}</td>
                        <td>{t.completada_at ? new Date(t.completada_at).toLocaleDateString('es-MX') : '—'}</td>
                        <td>{t.tarifa_limpieza ? `$${t.tarifa_limpieza}` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        )}

      </main>
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
