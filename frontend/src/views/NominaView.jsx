import React, { useState, useEffect } from 'react';
import api, { getBilleteraStaff } from '../services/api';

export default function NominaView({ staffList = [], onRefresh, showToast, onAction }) {
  const [balances, setBalances] = useState({});
  const [loadingBalances, setLoadingBalances] = useState(false);

  const staffSoloLimpieza = staffList.filter(s => s.rol === 'STAFF');

  const fetchBalances = async () => {
    setLoadingBalances(true);
    const newBalances = {};
    try {
      await Promise.all(staffSoloLimpieza.map(async (s) => {
        const res = await getBilleteraStaff(s.id);
        newBalances[s.id] = res;
      }));
      setBalances(newBalances);
    } catch (err) {
      console.error("Error fetching balances:", err);
    } finally {
      setLoadingBalances(false);
    }
  };

  useEffect(() => {
    fetchBalances();
  }, [staffList]);

  return (
    <div className="admin-fade-in">
      <div className="admin-topbar">
        <div>
          <h2>Nómina y Pagos</h2>
          <div className="topbar-subtitle">Seguimiento de ganancias y adelantos del staff</div>
        </div>
        <div className="topbar-actions">
          <button className="btn-admin btn-admin-outline" onClick={fetchBalances} disabled={loadingBalances}>
            {loadingBalances ? '⏳ Actualizando...' : '🔄 Actualizar Saldos'}
          </button>
          <button className="btn-admin btn-admin-primary" onClick={() => onAction({ type: 'adelanto' })}>
            ＋ Registrar Adelanto
          </button>
        </div>
      </div>

      <div className="admin-table-wrapper">
        <div className="admin-table-header">
          <h3>Saldos de Personal</h3>
          <span className="table-count">{staffSoloLimpieza.length} personas</span>
        </div>
        
        {staffSoloLimpieza.length === 0 ? (
          <div className="admin-empty">
            <div className="empty-icon">💰</div>
            <h4>No hay personal de staff registrado</h4>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nombre del Staff</th>
                <th>Total Ganado</th>
                <th>Total Adelantos</th>
                <th>Saldo Pendiente</th>
                <th>Moneda</th>
                <th>Última Actividad</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {staffSoloLimpieza.map(s => {
                const b = balances[s.id] || { total_ganado: 0, total_adelantos: 0, saldo_neto: 0, moneda: 'MXN' };
                return (
                  <tr key={s.id}>
                    <td>
                      <div className="table-name">{s.nombre}</div>
                      <div className="table-sub">{s.email || 'Sin email'}</div>
                    </td>
                    <td style={{color: '#059669', fontWeight: 'bold'}}>
                      + {b.total_ganado.toLocaleString()}
                    </td>
                    <td style={{color: '#dc2626'}}>
                      - {b.total_adelantos.toLocaleString()}
                    </td>
                    <td style={{fontWeight: '900', fontSize: '1.1rem'}}>
                      {b.saldo_neto.toLocaleString()}
                    </td>
                    <td><span className="admin-badge admin-badge-neutral">{b.moneda}</span></td>
                    <td>{s.ultimo_login ? new Date(s.ultimo_login).toLocaleDateString() : '—'}</td>
                    <td>
                      <button 
                        className="btn-admin btn-admin-outline btn-admin-sm"
                        onClick={() => onAction({ type: 'adelanto', edit: { staff_id: s.id, moneda: b.moneda } })}
                      >
                        💸 Adelanto
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="admin-grid" style={{marginTop: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px'}}>
         <div className="admin-card">
            <h4>💡 Resumen Informativo</h4>
            <p style={{fontSize: '0.9rem', color: '#6b7280', marginTop: '10px'}}>
              El <strong>Saldo Pendiente</strong> refleja lo que se debe pagar al staff en la próxima liquidación. 
              Se calcula sumando todas las tareas marcadas como <strong>VERIFICADAS</strong> y restando los <strong>ADELANTOS</strong> registrados.
            </p>
         </div>
         <div className="admin-card">
            <h4>📈 Flujo de Caja Staff</h4>
            <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '15px'}}>
               <span>Total a Liquidar:</span>
               <span style={{fontWeight: 'bold'}}>
                  {Object.values(balances).reduce((acc, curr) => acc + curr.saldo_neto, 0).toLocaleString()}
               </span>
            </div>
         </div>
      </div>
    </div>
  );
}
