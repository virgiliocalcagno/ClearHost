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

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      showToast('URL iCal copiada al portapapeles');
    }).catch(() => {
      alert('Error al copiar URL');
    });
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
                <tr key={p.id} style={{ backgroundColor: 'white' }}>
                  <td style={{ width: '25%' }}>
                    <div className="table-name" style={{ fontSize: '15px' }}>{p.nombre}</div>
                    <div className="table-sub" style={{ color: '#64748b' }}>{p.direccion}</div>
                    {p.zona_nombre && (
                      <div style={{ fontSize: '10px', color: 'var(--primary)', fontWeight: '700', marginTop: '4px', textTransform: 'uppercase' }}>
                        📍 {p.zona_nombre}
                      </div>
                    )}
                  </td>
                  <td style={{ width: '15%' }}>
                    <div style={{ 
                      fontSize: '13px', 
                      fontWeight: '700', 
                      color: p.propietario_nombre ? 'var(--text)' : 'var(--text-tertiary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      {p.propietario_nombre ? (
                        <>👤 {p.propietario_nombre}</>
                      ) : (
                        <span style={{ fontStyle: 'italic', fontWeight: '400' }}>Sin asignar</span>
                      )}
                    </div>
                  </td>
                  <td style={{ width: '12%', fontWeight: '500' }}>{p.ciudad}</td>
                  <td style={{ textAlign: 'center', fontWeight: '600' }}>{p.num_habitaciones}</td>
                  <td style={{ minWidth: '120px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                        <span style={{ color: '#64748b', fontWeight: '600' }}>Dueño:</span> 
                        <span style={{ color: '#0369a1', fontWeight: '700', marginLeft: '4px' }}>{p.cobro_propietario} {p.moneda_cobro}</span>
                      </div>
                      <div style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                        <span style={{ color: '#64748b', fontWeight: '600' }}>Staff:</span> 
                        <span style={{ color: '#059669', fontWeight: '700', marginLeft: '4px' }}>{p.pago_staff} {p.moneda_pago}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`admin-badge ${p.activa ? 'admin-badge-success' : 'admin-badge-error'}`} style={{ width: '100%', justifyContent: 'center' }}>
                      {p.activa ? '✓ Activa' : '✕ Inactiva'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {p.ical_url ? (
                        <button
                          className="btn-admin btn-admin-info btn-admin-sm"
                          onClick={() => handleSyncIcal(p)}
                          disabled={syncing === p.id}
                          style={{ width: '100%', fontSize: '11px' }}
                        >
                          {syncing === p.id ? '⏳ Sync...' : '🔄 Sincronizar'}
                        </button>
                      ) : (
                        <span className="admin-badge admin-badge-neutral" style={{ textAlign: 'center' }}>Sin Import</span>
                      )}
                      
                      {p.ical_url && (
                        <div style={{ fontSize: '10px', color: '#64748b', textAlign: 'center', marginTop: '-2px', marginBottom: '4px' }}>
                          Última: {p.ultima_sincronizacion_ical ? new Date(p.ultima_sincronizacion_ical).toLocaleString() : 'Nunca'}
                        </div>
                      )}
                      
                      <button 
                        className="btn-admin btn-admin-outline btn-admin-sm"
                        onClick={() => copyToClipboard(`https://clearhost-c8919.web.app/api/reservas/ical/export/${p.id}`)}
                        style={{ width: '100%', fontSize: '11px', whiteSpace: 'nowrap' }}
                        title="Copiar URL para exportar a Airbnb"
                      >
                        🔗 Copiar Export
                      </button>
                    </div>
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
