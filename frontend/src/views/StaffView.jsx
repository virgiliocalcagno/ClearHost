import React from 'react';
import api from '../services/api';

const actualizarStaff = (id, data) => api.put(`/staff/${id}`, data).then(r => r.data);

export default function StaffView({ data, onAction, onRefresh, showToast }) {
  const rolMap = {
    SUPER_ADMIN: { badge: 'admin-badge-purple', label: '👑 Super Admin' },
    MANAGER_LOCAL: { badge: 'admin-badge-info', label: '📍 Manager Local' },
    STAFF: { badge: 'admin-badge-neutral', label: '🧹 Staff' },
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
                const rol = rolMap[s.rol] || rolMap.STAFF;
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
