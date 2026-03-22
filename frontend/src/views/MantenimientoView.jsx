import React, { useState } from 'react';
import api from '../services/api';
import { EstadoIncidenciaBadge } from '../components/AdminCommon';

const actualizarIncidencia = (id, data) => api.put(`/incidencias/${id}`, data).then(r => r.data);

export default function MantenimientoView({ data, propiedades, onRefresh, showToast, onAction }) {
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
