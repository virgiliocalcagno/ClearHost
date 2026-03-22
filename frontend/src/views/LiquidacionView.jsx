import React from 'react';

export default function LiquidacionView({ gastos, propiedades, reservas, onRefresh, showToast, onAction }) {
  return (
    <div className="admin-fade-in">
      <div className="admin-topbar">
        <div>
          <h2>Liquidación y Gastos</h2>
          <div className="topbar-subtitle">Control financiero de propiedades</div>
        </div>
        <div className="topbar-actions">
          <button className="btn-admin btn-admin-primary" onClick={() => onAction({ type: 'gasto' })}>
            ＋ Registrar Gasto
          </button>
        </div>
      </div>

      <div className="admin-table-wrapper">
        <div className="admin-table-header">
          <h3>Lista de Gastos</h3>
          <span className="table-count">{gastos.length} registros</span>
        </div>
        {gastos.length === 0 ? (
          <div className="admin-empty">
             <div className="empty-icon">💸</div>
             <h4>Sin gastos registrados</h4>
             <p>Registra gastos para generar reportes a propietarios.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Propiedad</th>
                <th>Monto</th>
                <th>Categoría</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {gastos.map(g => (
                <tr key={g.id}>
                  <td>{g.fecha}</td>
                  <td>{propiedades.find(p => p.id === g.propiedad_id)?.nombre || '—'}</td>
                  <td><strong>${g.monto}</strong></td>
                  <td><span className="admin-badge admin-badge-neutral">{g.categoria_cargo}</span></td>
                  <td>
                    <div className="table-actions">
                      <button className="btn-admin btn-admin-outline btn-admin-sm" onClick={() => onAction({ type: 'gasto', edit: g })}>✏️ Editar</button>
                      {g.comprobante_url && (
                        <a href={g.comprobante_url} target="_blank" rel="noreferrer" className="btn-admin btn-admin-info btn-admin-sm">📎 Ver</a>
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
