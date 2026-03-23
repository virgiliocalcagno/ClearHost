import React, { useState } from 'react';
import { EstadoBadge } from './AdminCommon';

export default function AdminWeeklyCalendar({ 
  tareas, 
  propiedades, 
  getStaffName, 
  handleAsignar, 
  handleTimeChange, 
  staffLimpieza, 
  handleWhatsApp,
  handleDelete,
  handleEdit,
  numDays = 4
}) {
  const [dayOffset, setDayOffset] = useState(0);

  // Helper for consistent local YYYY-MM-DD
  const getTodayStr = () => {
    const d = new Date();
    return d.toLocaleDateString('en-CA'); // 'YYYY-MM-DD' local
  };

  const todayStr = getTodayStr();

  // Helper to get {numDays} days starting from Today + offset
  const getOperationalDates = (offset) => {
    const dates = [];
    const start = new Date();
    start.setHours(12, 0, 0, 0);
    start.setDate(start.getDate() + (offset * numDays));

    for (let i = 0; i < numDays; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      dates.push(d.toLocaleDateString('en-CA'));
    }
    return dates;
  };

  const currentDates = getOperationalDates(dayOffset);

  // Grouping
  const tasksByDate = {};
  tareas.forEach(t => {
    if (!tasksByDate[t.fecha_programada]) tasksByDate[t.fecha_programada] = [];
    tasksByDate[t.fecha_programada].push(t);
  });

  const getUrgency = (t) => {
    // Parseo robusto de fecha y hora local
    const [year, month, day] = t.fecha_programada.split('-').map(Number);
    const [hour, min] = (t.hora_inicio || '11:00').split(':').map(Number);
    const scheduled = new Date(year, month - 1, day, hour, min);
    
    const now = new Date();
    const diffHours = (scheduled - now) / (1000 * 60 * 60);

    // Prioridad por Estado (overrides)
    if (t.estado === 'VERIFICADA') {
      return { level: 'VERIFICADA', color: '#475569', bg: '#F8FAFC', border: '#CBD5E1' };
    }
    if (['COMPLETADA', 'CLEAN_AND_READY'].includes(t.estado)) {
      return { level: 'COMPLETADA', color: '#166534', bg: '#F0FDF4', border: '#4ADE80' };
    }

    // 🔴 URGENTE: Emergencia o 12h o menos
    if (t.prioridad === 'EMERGENCIA' || diffHours <= 12) {
      return { level: 'URGENTE', label: '🚨 PRIORIDAD MÁXIMA', color: '#991B1B', bg: '#FEF2F2', border: '#EF4444', pulse: true };
    }
    // 🔴 ALTA: 12h a 24h
    if (diffHours <= 24) {
      return { level: 'ALTA', label: '🔴 ALTA', color: '#B91C1C', bg: '#FEF2F2', border: '#EF4444' };
    }
    // 🟡 MEDIA: 24h a 48h
    if (diffHours <= 48) {
      return { level: 'MEDIA', label: '🟡 MEDIA', color: '#854D0E', bg: '#FEFCE8', border: '#FACC15' };
    }
    // 🟢 BAJA
    return { level: 'BAJA', label: '🟢 BAJA', color: '#166534', bg: '#F0FDF4', border: '#4ADE80' };
  };

  return (
    <div className="weekly-calendar-container" style={{ padding: '0 0 20px' }}>
      {/* Navegación de Operaciones */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '16px 32px',
        backgroundColor: '#F8FAFC',
        borderBottom: '1px solid var(--border)',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-admin btn-admin-outline" onClick={() => setDayOffset(prev => prev - 1)}>
            ← Anterior
          </button>
          <button className="btn-admin btn-admin-outline" onClick={() => setDayOffset(0)}>
            Hoy
          </button>
          <button className="btn-admin btn-admin-outline" onClick={() => setDayOffset(prev => prev + 1)}>
            Siguiente →
          </button>
        </div>
        <div style={{ fontWeight: 800, fontSize: '18px', color: 'var(--text)', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ color: 'var(--primary)' }}>⚡ {numDays === 4 ? 'VISTA OPERATIVA (4D)' : 'VISTA SEMANAL'}</span>
          <span>•</span>
          <span>{new Date(currentDates[0] + 'T12:00:00').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase()}</span>
        </div>
      </div>

      {/* Grid Dinámico */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: `repeat(${numDays}, minmax(${numDays === 4 ? '250px' : '150px'}, 1fr))`, 
        gap: '16px', 
        padding: '0 20px',
        overflowX: 'auto'
      }}>
        {currentDates.map(dateStr => {
          const dayTasks = tasksByDate[dateStr] || [];
          const d = new Date(dateStr + 'T12:00:00');
          const isToday = todayStr === dateStr;

          return (
            <div key={dateStr} style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '12px',
              minHeight: '400px',
              backgroundColor: isToday ? 'var(--primary-light)' : 'transparent', // Consistent light teal background
              border: isToday ? '2px solid var(--primary)' : '1px solid transparent',
              borderRadius: '16px',
              padding: '8px',
              transition: 'all 0.3s ease'
            }}>
              {/* Header del Día */}
              <div style={{ 
                padding: '12px', 
                textAlign: 'center', 
                borderRadius: '12px',
                backgroundColor: isToday ? 'var(--primary)' : 'white', // Consistent brand teal header
                color: isToday ? 'white' : 'var(--text)',
                boxShadow: isToday ? 'var(--shadow-primary)' : 'var(--shadow-sm)',
                border: isToday ? 'none' : '1px solid var(--border)',
                transform: isToday ? 'scale(1.02)' : 'scale(1)',
                position: 'relative'
              }}>
                {isToday && (
                  <div style={{ 
                    position: 'absolute', 
                    top: '-8px', 
                    left: '50%', 
                    transform: 'translateX(-50%)',
                    backgroundColor: 'var(--primary-dark)',
                    color: 'white',
                    fontSize: '9px',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontWeight: 800
                  }}>
                    HOY
                  </div>
                )}
                <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', opacity: 0.8 }}>
                  {d.toLocaleDateString('es-ES', { weekday: 'short' })}
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800 }}>
                  {d.getDate()}
                </div>
              </div>

              {/* Lista de Tareas */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {dayTasks.length === 0 ? (
                  <div style={{ 
                    padding: '20px 10px', 
                    textAlign: 'center', 
                    color: 'var(--text-tertiary)',
                    fontSize: '12px',
                    fontStyle: 'italic',
                    border: '1px dashed var(--border)',
                    borderRadius: '8px'
                  }}>
                    Sin tareas
                  </div>
                ) : (
                  dayTasks.map(t => {
                    const prop = propiedades.find(p => p.id === t.propiedad_id);
                    const urgency = getUrgency(t);

                    return (
                      <div key={t.id} style={{ 
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        border: `1px solid ${urgency.border}`,
                        borderTop: `6px solid ${urgency.border}`,
                        padding: '12px',
                        boxShadow: 'var(--shadow-sm)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        animation: urgency.pulse ? 'pulse-emergency 2s infinite' : 'none',
                        transition: 'transform 0.2s',
                        cursor: ['MANUAL', 'ADMIN'].includes(t.fuente_reserva) ? 'pointer' : 'default',
                        position: 'relative'
                      }} 
                      className="task-card-hover"
                      onClick={() => {
                        if (['MANUAL', 'ADMIN'].includes(t.fuente_reserva) && handleEdit) {
                          handleEdit(t);
                        }
                      }}
                      >
                        {/* Status Label (Urgency) & Source Badge */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            {urgency.label && (
                              <div style={{ 
                                fontSize: '9px', 
                                fontWeight: 800, 
                                color: urgency.color,
                                backgroundColor: urgency.bg,
                                padding: '2px 6px',
                                borderRadius: '4px'
                              }}>
                                {urgency.label}
                              </div>
                            )}
                            {t.fuente_reserva && t.fuente_reserva !== 'ADMIN' && (
                              <div className="badge-info-sm" style={{ fontSize: '9px', padding: '2px 6px' }}>
                                {t.fuente_reserva === 'MANUAL' ? 'MANUAL' : `⚡ ${t.fuente_reserva}`}
                              </div>
                            )}
                          </div>
                          {handleDelete && ['PENDIENTE', 'ASIGNADA_NO_CONFIRMADA'].includes(t.estado) && ['MANUAL', 'ADMIN'].includes(t.fuente_reserva) && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(t.id);
                              }}
                              style={{ border:'none', background:'none', cursor:'pointer', color:'#EF4444', fontSize:'14px', padding:'0 4px' }}
                              title="Eliminar tarea"
                            >
                              🗑
                            </button>
                          )}
                        </div>

                        {/* Info Propiedad */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text)', lineHeight: 1.2 }}>
                              {prop?.nombre || 'Propiedad'}
                            </div>
                            <div style={{ 
                              fontSize: '10px', 
                              fontWeight: 800, 
                              color: 'var(--primary)', 
                              backgroundColor: 'white', 
                              border: '1px solid var(--primary)',
                              padding: '1px 4px', 
                              borderRadius: '4px',
                              marginLeft: '4px'
                            }}>
                              T-{t.id_secuencial}
                            </div>
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 600 }}>
                            {t.tipo_tarea === 'OTRO' ? (t.notas_staff || 'OTRO') : t.tipo_tarea?.replace(/_/g, ' ')}
                          </div>
                        </div>

                        {/* Status Badge (The restored logic) */}
                        <div style={{ margin: '4px 0' }}>
                          <EstadoBadge estado={t.estado} />
                        </div>

                        {/* Info Huésped */}
                        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Huésped:</div>
                            <div style={{ fontSize: '12px', fontWeight: 600 }}>{t.nombre_huesped || '—'}</div>
                        </div>

                        {/* Asignación y Hora */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                          <select
                            className="select-assign"
                            value={t.asignado_a || ''}
                            onChange={(e) => handleAsignar(t.id, e.target.value)}
                            style={{ 
                              padding: '8px', 
                              fontSize: '12px', 
                              borderColor: !t.asignado_a ? '#EF4444' : '#E2E8F0',
                              backgroundColor: !t.asignado_a ? '#FEF2F2' : 'white',
                              borderRadius: '8px'
                            }}
                          >
                            <option value="">⚠ Sin asignar</option>
                            {staffLimpieza.map(s => (
                              <option key={s.id} value={s.id}>{s.nombre}</option>
                            ))}
                          </select>
                          
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <input 
                              type="time" 
                              value={(t.hora_inicio || '11:00').substring(0, 5)} 
                              onChange={(e) => handleTimeChange(t.id, e.target.value, t.asignado_a)}
                              style={{ 
                                border: '1px solid var(--border)', 
                                borderRadius: '8px',
                                padding: '6px', 
                                fontSize: '11px',
                                width: '75px', // Reduced width
                                flexShrink: 0
                              }}
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleWhatsApp(t.id);
                              }}
                              style={{ 
                                background: 'var(--primary)', 
                                color:'white', 
                                border:'none', 
                                padding:'8px', 
                                borderRadius:'8px', 
                                cursor:'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flex: 1, 
                                gap: '6px',
                                fontWeight: 700,
                                fontSize: '11px'
                              }}
                              title="Conectar por WhatsApp"
                            >
                              <i className="fab fa-whatsapp" style={{fontSize: '14px'}}></i>
                              {numDays <= 4 && <span>CONECTAR</span>}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
