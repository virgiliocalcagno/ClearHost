import React, { useState } from 'react';
import api from '../services/api';
import { EstadoReservaBadge, FuenteBadge } from '../components/AdminCommon';
import GanttReservas from '../components/GanttReservas';

const cancelarReserva = (id) => api.delete(`/reservas/${id}`);
const reactivarReserva = (id) => api.put(`/reservas/${id}`, { estado: 'CONFIRMADA' });

export default function ReservasView({ data, propiedades, onAction, onRefresh, showToast }) {
  const [filtroPropiedad, setFiltroPropiedad] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Todas');
  const [filtroFuente, setFiltroFuente] = useState('Todas');

  const [vistaActiva, setVistaActiva] = useState('calendario');

  const nombresPropiedades = [...new Set(data.map(r => {
    const p = propiedades.find(prop => prop.id === r.propiedad_id);
    return p?.nombre;
  }).filter(Boolean))];

  const filteredData = data.filter(r => {
    const prop = propiedades.find(p => p.id === r.propiedad_id);
    const matchesProp = !filtroPropiedad || prop?.nombre === filtroPropiedad;
    const matchesEstado = filtroEstado === 'Todas' || r.estado === filtroEstado;
    const matchesFuente = filtroFuente === 'Todas' || r.fuente === filtroFuente;
    return matchesProp && matchesEstado && matchesFuente;
  });

  return (
    <div className="admin-fade-in">
      <div className="admin-topbar">
        <div>
          <h2>Reservas</h2>
          <div className="topbar-subtitle">Reservaciones de huéspedes</div>
        </div>
        <div className="topbar-actions">
          <div className="view-toggle" style={{display: 'inline-flex', gap: 5, marginRight: 15, background: 'var(--surface)', padding: 4, borderRadius: 8, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)'}}>
            <button className={`btn-admin btn-admin-sm ${vistaActiva === 'tabla' ? 'btn-admin-primary' : 'btn-admin-outline'}`} onClick={() => setVistaActiva('tabla')} style={{border: 'none'}}>📋 Listado</button>
            <button className={`btn-admin btn-admin-sm ${vistaActiva === 'calendario' ? 'btn-admin-primary' : 'btn-admin-outline'}`} onClick={() => setVistaActiva('calendario')} style={{border: 'none'}}>📊 Cronograma (Gantt)</button>
          </div>
          <button className="btn-admin btn-admin-primary" style={{marginRight: 10}} onClick={() => onAction({ type: 'reserva' })}>
            ＋ Nueva Reserva
          </button>
          <button className="btn-admin btn-admin-outline" onClick={onRefresh}>🔄 Actualizar</button>
        </div>
      </div>

      <div className="admin-table-wrapper">
        <div className="admin-table-header">
          <h3>{vistaActiva === 'tabla' ? 'Listado de Reservas' : 'Ocupación de Propiedades'}</h3>
          <span className="table-count">{filteredData.length} de {data.length} reservas</span>
        </div>

        <div className="filter-bar" style={{ display: 'flex', gap: '15px', padding: '15px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <select 
            className="select-field select-field-sm" 
            value={filtroPropiedad} 
            onChange={e => setFiltroPropiedad(e.target.value)}
          >
            <option value="">Todas las propiedades</option>
            {nombresPropiedades.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>

          <select 
            className="select-field select-field-sm" 
            value={filtroEstado} 
            onChange={e => setFiltroEstado(e.target.value)}
          >
            <option value="Todas">Todos los estados</option>
            <option value="CONFIRMADA">CONFIRMADA</option>
            <option value="CANCELADA">CANCELADA</option>
            <option value="COMPLETADA">COMPLETADA</option>
          </select>

          <select 
            className="select-field select-field-sm" 
            value={filtroFuente} 
            onChange={e => setFiltroFuente(e.target.value)}
          >
            <option value="Todas">Todas las fuentes</option>
            <option value="AIRBNB">AIRBNB</option>
            <option value="BOOKING">BOOKING</option>
            <option value="VRBO">VRBO</option>
            <option value="MANUAL">MANUAL</option>
            <option value="OTRO">OTRO</option>
          </select>
        </div>

        {filteredData.length === 0 ? (
          <div className="admin-empty">
            <div className="empty-icon">📅</div>
            <h4>Sin resultados</h4>
            <p>No hay reservas que coincidan con los filtros aplicados.</p>
          </div>
        ) : vistaActiva === 'tabla' ? (
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
              {filteredData.map(r => {
                const prop = propiedades.find(p => p.id === r.propiedad_id);
                const rowStyle = r.estado === 'CANCELADA' ? { opacity: 0.6, backgroundColor: '#FEF2F2' } : 
                                r.estado === 'COMPLETADA' ? { backgroundColor: '#F8FAFC' } : {};
                
                return (
                  <tr key={r.id} style={rowStyle}>
                    <td>
                      <div className="table-name">{r.nombre_huesped}</div>
                      <div className="table-sub">{r.num_huespedes} huésped(es)</div>
                    </td>
                    <td><span style={{ fontWeight: 600, color: 'var(--text)' }}>{prop?.nombre || '—'}</span></td>
                    <td style={{ fontWeight: 500 }}>{r.check_in}</td>
                    <td style={{ fontWeight: 500 }}>{r.check_out}</td>
                    <td><FuenteBadge fuente={r.fuente} /></td>
                    <td><EstadoReservaBadge estado={r.estado} /></td>
                    <td>
                      <div className="table-actions">
                        {r.fuente === 'MANUAL' && r.estado === 'CONFIRMADA' ? (
                          <>
                            <button 
                              className="btn-admin btn-admin-outline btn-admin-sm" 
                              onClick={() => onAction({ type: 'reserva', edit: r })}
                            >
                              ✏️ Editar
                            </button>
                            <button 
                              className="btn-admin btn-admin-danger btn-admin-sm" 
                              onClick={async () => { 
                                if (window.confirm('¿Cancelar esta reserva manual?')) { 
                                  try { 
                                    await cancelarReserva(r.id); 
                                    showToast('Reserva cancelada'); 
                                    onRefresh(); 
                                  } catch(e) { 
                                    alert('Error al cancelar'); 
                                  } 
                                } 
                              }}
                            >
                              ✕
                            </button>
                          </>
                        ) : r.fuente === 'MANUAL' && r.estado === 'CANCELADA' ? (
                          <span className="table-sub grey">Historial</span>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span className="badge-info-sm" style={{ backgroundColor: '#e0f2fe', color: '#0369a1', border: '1px solid #7dd3fc' }}>
                              SINC ⚡
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <GanttReservas data={filteredData} propiedades={propiedades} />
        )}
      </div>
    </div>
  );
}
