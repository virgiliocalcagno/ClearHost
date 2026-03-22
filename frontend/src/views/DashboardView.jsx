import React from 'react';
import api from '../services/api';
import { EstadoBadge, FuenteBadge } from '../components/AdminCommon';

export default function DashboardView({ stats, data }) {
  const today = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="admin-fade-in">
      <div className="admin-topbar">
        <div>
          <h2>Dashboard</h2>
          <div className="topbar-subtitle" style={{ textTransform: 'capitalize' }}>{today}</div>
        </div>
        <div className="topbar-actions">
          <button 
            className="btn-admin btn-admin-primary" 
            onClick={async () => {
              try {
                await api.post('/sync-ical-all');
                alert('Sincronización de todas las propiedades iniciada.');
              } catch (e) {
                alert('Error al iniciar sincronización global.');
              }
            }}
          >
            🔄 Sincronizar Todo
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card-admin stat-props">
          <div className="stat-icon">🏠</div>
          <div className="stat-value">{stats.propiedades}</div>
          <div className="stat-title">Propiedades</div>
        </div>
        <div className="stat-card-admin stat-reservations">
          <div className="stat-icon">📅</div>
          <div className="stat-value">{stats.reservasActivas}</div>
          <div className="stat-title">Reservas Activas</div>
        </div>
        <div className="stat-card-admin stat-tasks">
          <div className="stat-icon">⏳</div>
          <div className="stat-value">{stats.tareasPendientes}</div>
          <div className="stat-title">Tareas Pendientes</div>
        </div>
        <div className="stat-card-admin stat-completed">
          <div className="stat-icon">✅</div>
          <div className="stat-value">{stats.tareasCompletadas}</div>
          <div className="stat-title">Completadas</div>
        </div>
        <div className="stat-card-admin stat-staff-card">
          <div className="stat-icon">👥</div>
          <div className="stat-value">{stats.staffDisponible}</div>
          <div className="stat-title">Staff Disponible</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="dashboard-section">
          <h3>🧹 Tareas Recientes</h3>
          <div className="recent-list">
            {data.tareas.slice(0, 5).map(t => (
              <div key={t.id} className="recent-item">
                <div className="ri-icon ri-icon-tarea">🧹</div>
                <div className="ri-info">
                  <div className="ri-title">{t.fecha_programada}</div>
                  <div className="ri-sub">{t.estado}</div>
                </div>
                <EstadoBadge estado={t.estado} />
              </div>
            ))}
            {data.tareas.length === 0 && <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Sin tareas</p>}
          </div>
        </div>

        <div className="dashboard-section">
          <h3>📅 Próximas Reservas</h3>
          <div className="recent-list">
            {data.reservas.filter(r => r.estado === 'CONFIRMADA').slice(0, 5).map(r => (
              <div key={r.id} className="recent-item">
                <div className="ri-icon ri-icon-reserva">📅</div>
                <div className="ri-info">
                  <div className="ri-title">{r.nombre_huesped}</div>
                  <div className="ri-sub">{r.check_in} → {r.check_out}</div>
                </div>
                <FuenteBadge fuente={r.fuente} />
              </div>
            ))}
            {data.reservas.length === 0 && <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Sin reservas</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
