import React from 'react';
import api from '../services/api';
import { EstadoReservaBadge, FuenteBadge } from '../components/AdminCommon';

const cancelarReserva = (id) => api.delete(`/reservas/${id}`);
const reactivarReserva = (id) => api.put(`/reservas/${id}`, { estado: 'CONFIRMADA' });

export default function ReservasView({ data, propiedades, onAction, onRefresh, showToast }) {
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
                // Colores de fila según estado para "Wow" factor
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
        )}
      </div>
    </div>
  );
}
