import React, { useState } from 'react';
import api from '../services/api';

const syncIcal = (propId) => api.post(`/reservas/sync-ical/${propId}`).then(r => r.data);
const eliminarPropiedad = (id) => api.delete(`/propiedades/${id}`);

export default function PropiedadesView({ data, propietarios, onAction, onRefresh, showToast }) {
  const [syncing, setSyncing] = useState(null);
  const [ownerFilter, setOwnerFilter] = useState('');

  const filteredProps = ownerFilter 
    ? data.filter(p => p.propietario_id === ownerFilter)
    : data;

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
          <div className="filter-group" style={{ marginRight: '15px' }}>
            <select 
              className="select-field select-field-sm" 
              value={ownerFilter} 
              onChange={e => setOwnerFilter(e.target.value)}
              style={{ minWidth: '180px' }}
            >
              <option value="">Todos los Propietarios</option>
              {propietarios.map(prop => (
                <option key={prop.id} value={prop.id}>{prop.nombre}</option>
              ))}
            </select>
          </div>
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
                <th>Propietario</th>
                <th>Ciudad</th>
                <th>Habitaciones</th>
                <th>Cobro / Pago</th>
                <th>Estado</th>
                <th>iCal</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProps.map(p => (
                <tr key={p.id}>
                  <td>
                    <div className="table-name">{p.nombre}</div>
                    <div className="table-sub">{p.direccion}</div>
                  </td>
                  <td>
                    <div className="table-name">{p.propietario_nombre || '—'}</div>
                  </td>
                  <td>{p.ciudad}</td>
                  <td>{p.num_habitaciones}</td>
                  <td>
                    <div style={{fontSize: '13px', fontWeight: '600', color: '#0EA5E9'}}>C: {p.cobro_propietario} {p.moneda_cobro}</div>
                    <div style={{fontSize: '11px', color: '#10B981'}}>P: {p.pago_staff} {p.moneda_pago}</div>
                  </td>
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
