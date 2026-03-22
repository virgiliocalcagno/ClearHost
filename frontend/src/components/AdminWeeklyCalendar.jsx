import React from 'react';

export default function AdminWeeklyCalendar({ tareas, propiedades, getStaffName, handleAsignar, handleTimeChange, staffLimpieza, handleWhatsApp }) {
  const tasksByDate = {};
  tareas.forEach(t => {
    if (!tasksByDate[t.fecha_programada]) tasksByDate[t.fecha_programada] = [];
    tasksByDate[t.fecha_programada].push(t);
  });

  const getPriorityColor = (prio) => {
    switch (prio) {
      case 'EMERGENCIA': 
        return { 
          border: '2px solid #EF4444', 
          background: '#FFF5F5', 
          animation: 'pulse-emergency 2s infinite' 
        };
      case 'ALTA': return { borderLeft: '6px solid #EF4444', background: '#FFFDFD' };
      case 'MEDIA': return { borderLeft: '6px solid #F59E0B' };
      case 'BAJA': return { borderLeft: '6px solid #10B981' };
      default: return { borderLeft: '6px solid #E5E7EB' };
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'PENDIENTE':
        return { background: '#FEE2E2', color: '#B91C1C', border: '1px solid #FCA5A5' };
      case 'ASIGNADA_NO_CONFIRMADA':
        return { background: '#FEF3C7', color: '#92400E', border: '1px solid #FCD34D' };
      case 'EN_PROGRESO':
        return { background: '#D1FAE5', color: '#065F46', border: '1px solid #6EE7B7' };
      case 'ACEPTADA':
        return { background: '#E0E7FF', color: '#3730A3', border: '1px solid #A5B4FC' };
      case 'CLEAN_AND_READY':
        return { background: '#DBEAFE', color: '#1E40AF', border: '1px solid #93C5FD' };
      case 'VERIFICADA':
        return { background: '#EDE9FE', color: '#5B21B6', border: '1px solid #C4B5FD' };
      default:
        return { background: '#F3F4F6', color: '#374151', border: '1px solid #E5E7EB' };
    }
  };

  const dates = Object.keys(tasksByDate).sort();

  return (
    <div style={{display: 'flex', gap: '20px', overflowX: 'auto', padding: '10px 20px 20px'}}>
      {dates.map(dateStr => (
        <div key={dateStr} style={{minWidth: 280, background: '#f9f9f9', padding: 15, borderRadius: 12, border: '1px solid var(--border)'}}>
          <h4 style={{marginBottom: 15, borderBottom: '1px solid var(--border)', paddingBottom: 10}}>
            {new Date(dateStr + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
          </h4>
          <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
            {tasksByDate[dateStr]
             .sort((a,b) => (a.prioridad === 'EMERGENCIA' ? -1 : 1))
             .map(t => {
              const prop = propiedades.find(p => p.id === t.propiedad_id);
              const pColor = getPriorityColor(t.prioridad);
              return (
                <div key={t.id} style={{
                  padding: 12, borderRadius: 8, background: 'white',
                  boxShadow: 'var(--shadow-sm)', ...pColor
                }}>
                  <div style={{fontWeight: 800, fontSize: 14}}>{prop?.nombre || 'Propiedad'}</div>
                  <div style={{fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 5}}>Prioridad: {t.prioridad || 'BAJA'}</div>
                  <div style={{fontSize: 12}}>Huésped: {t.nombre_huesped}</div>
                  <div style={{fontSize: 12}}>Check-out: {t.check_out}</div>
                  <div style={{fontSize: 12, marginTop: 8, display: 'flex', gap: '5px', alignItems: 'center'}}>
                    <select
                      className="select-assign"
                      value={t.asignado_a || ''}
                      onChange={(e) => handleAsignar(t.id, e.target.value)}
                      style={{
                        padding: '4px', fontSize: '11px', flex: 1,
                        color: t.asignado_a ? 'var(--text)' : 'var(--error)',
                        borderColor: !t.asignado_a ? 'var(--error)' : 'var(--border)',
                        background: 'white'
                      }}
                    >
                      <option value="">⚠ Asignar Staff</option>
                      {staffLimpieza.map(s => (
                        <option key={s.id} value={s.id}>{s.nombre}</option>
                      ))}
                    </select>
                    <input 
                      type="time" 
                      value={(t.hora_inicio || '11:00').substring(0, 5)} 
                      onChange={(e) => handleTimeChange(t.id, e.target.value, t.asignado_a)}
                      style={{
                        border: '1px solid var(--border)', borderRadius: '4px',
                        padding: '2px 4px', fontSize: '11px', cursor: 'pointer'
                      }}
                    />
                  </div>
                  <div style={{fontSize: 12, marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <span style={{
                      ...getStatusStyle(t.estado),
                      padding: '4px 10px', 
                      borderRadius: 8, 
                      fontSize: '11px', 
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}>
                      {t.estado.replace(/_/g, ' ')}
                    </span>
                    <button
                      onClick={() => handleWhatsApp(t.id)}
                      style={{background:'#25D366', color:'white', border:'none', padding:'4px 8px', borderRadius:4, cursor:'pointer', fontSize:11, fontWeight:'bold'}}
                    >
                      WhatsApp
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
