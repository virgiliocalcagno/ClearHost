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
