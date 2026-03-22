import React from 'react';

export default function PropietariosView({ data, propiedades, onAction, onRefresh, showToast, navigate }) {
  return (
    <div className="admin-fade-in">
      <div className="admin-topbar">
        <div>
          <h2>Propietarios</h2>
          <div className="topbar-subtitle">Gestión de dueños de propiedades</div>
        </div>
        <div className="topbar-actions">
          <button className="btn-admin btn-admin-primary" onClick={() => onAction({ type: 'propietario' })}>
            ＋ Nuevo Propietario
          </button>
        </div>
      </div>

      <div className="admin-table-wrapper">
        <div className="admin-table-header">
          <h3>Contactos</h3>
          <span className="table-count">{data.length} propietarios</span>
        </div>
        {data.length === 0 ? (
          <div className="admin-empty">
            <div className="empty-icon">🤝</div>
            <h4>Sin propietarios</h4>
            <p>Registra a los dueños para vincularlos a sus propiedades.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Contacto</th>
                <th>Propiedades</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.map(p => {
                const props = propiedades.filter(pr => pr.propietario_id === p.id);
                return (
                  <tr key={p.id}>
                    <td>
                      <div className="table-name">{p.nombre}</div>
                    </td>
                    <td>
                      <div className="table-name">{p.email || '—'}</div>
                      <div className="table-sub">{p.telefono || '—'}</div>
                    </td>
                    <td>
                      <div className="props-list-badges">
                        {props.map(pr => (
                          <span key={pr.id} className="admin-badge admin-badge-neutral" style={{marginRight:4, marginBottom:4, display:'inline-block'}}>
                            {pr.nombre}
                          </span>
                        ))}
                        {props.length === 0 && <span className="table-sub">Ninguna</span>}
                      </div>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="btn-admin btn-admin-outline btn-admin-sm" onClick={() => onAction({ type: 'propietario', edit: p })}>✏️ Editar</button>
                        <button className="btn-admin btn-admin-info btn-admin-sm" onClick={() => navigate(`/propietario/${p.id}/dashboard`)}>📊 Ver Reporte</button>
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
