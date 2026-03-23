import React, { useState } from 'react';

export default function GanttReservas({ data, propiedades }) {
  const [fechaInicio] = useState(new Date().toLocaleDateString('en-CA'));
  const numDias = 30;

  // Generar array de fechas consecutivas para el timeline
  const currentDates = Array.from({ length: numDias }, (_, i) => {
    const d = new Date(fechaInicio + 'T12:00:00');
    d.setDate(d.getDate() + i);
    return d.toLocaleDateString('en-CA');
  });

  const isToday = (d) => d === new Date().toLocaleDateString('en-CA');

  return (
    <div className="gantt-view-container" style={{ 
      overflowX: 'auto', 
      backgroundColor: '#fff', 
      borderRadius: '16px', 
      marginTop: '10px',
      boxShadow: 'var(--shadow-card)',
      border: '1px solid var(--border)'
    }}>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: `200px repeat(${numDias}, 45px)`, 
        backgroundColor: '#f1f5f9', 
        gap: '1px',
        minWidth: 'fit-content'
      }}>
        {/* Cabecera de Propiedades y Días */}
        <div style={{ 
          padding: '16px', 
          fontWeight: 800, 
          backgroundColor: '#f8fafc', 
          position: 'sticky', 
          left: 0, 
          zIndex: 10, 
          borderRight: '2px solid #e2e8f0',
          color: 'var(--text-secondary)',
          fontSize: '13px',
          textTransform: 'uppercase'
        }}>
          Propiedades
        </div>
        {currentDates.map((d, i) => {
          const dateObj = new Date(d + 'T12:00:00');
          const isWeekend = [0, 6].includes(dateObj.getDay());
          const today = isToday(d);
          
          return (
            <div key={i} style={{ 
              backgroundColor: today ? '#f0fdfa' : (isWeekend ? '#f8fafc' : '#fff'), 
              textAlign: 'center', 
              padding: '10px 0', 
              fontSize: '11px', 
              fontWeight: 800,
              color: today ? 'var(--primary)' : 'var(--text-secondary)',
              borderBottom: today ? '4px solid var(--primary)' : 'none',
              transition: 'all 0.2s ease'
            }}>
              <div style={{ opacity: 0.7, fontSize: '10px' }}>
                {dateObj.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase()}
              </div>
              <div style={{ fontSize: '16px', marginTop: '2px' }}>{d.split('-')[2]}</div>
            </div>
          );
        })}

        {/* Filas por Propiedad */}
        {propiedades.map(p => {
          const propReservas = data.filter(r => r.propiedad_id === p.id && r.estado !== 'CANCELADA');
          
          return (
            <React.Fragment key={p.id}>
              <div style={{ 
                padding: '14px 16px', 
                fontSize: '13px', 
                fontWeight: 700, 
                backgroundColor: '#fff', 
                position: 'sticky', 
                left: 0, 
                zIndex: 5, 
                borderRight: '2px solid #e2e8f0',
                display: 'flex', 
                alignItems: 'center',
                color: 'var(--text)'
              }}>
                {p.nombre}
              </div>
              <div style={{ 
                  gridColumn: `2 / span ${numDias}`, 
                  position: 'relative', 
                  height: '56px',
                  backgroundColor: '#fff',
                  backgroundImage: 'linear-gradient(90deg, #f1f5f9 1px, transparent 1px)',
                  backgroundSize: '45px 100%',
                  borderBottom: '1px solid #f1f5f9'
              }}>
                {propReservas.map(r => {
                  const sIdx = currentDates.indexOf(r.check_in);
                  const eIdx = currentDates.indexOf(r.check_out);
                  
                  // Si no empieza ni termina en el rango, verificar si lo atraviesa
                  if (sIdx === -1 && eIdx === -1) {
                    const startD = new Date(r.check_in);
                    const endD = new Date(r.check_out);
                    const minD = new Date(currentDates[0]);
                    const maxD = new Date(currentDates[numDias-1]);
                    if (!(startD <= maxD && endD >= minD)) return null;
                  }
                  
                  const start = sIdx === -1 ? 0 : sIdx;
                  const end = eIdx === -1 ? numDias : eIdx;
                  const span = Math.max(end - start, 0.5);

                  return (
                    <div key={r.id} style={{
                      position: 'absolute', 
                      left: `${start * 45 + 3}px`, 
                      width: `${span * 45 - 6}px`,
                      top: '10px', 
                      height: '36px', 
                      borderRadius: '10px', 
                      padding: '0 12px',
                      display: 'flex', 
                      alignItems: 'center', 
                      color: '#fff', 
                      fontSize: '11px', 
                      fontWeight: 800,
                      backgroundColor: r.fuente === 'AIRBNB' ? '#3B82F6' : '#10B981',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', 
                      zIndex: 2,
                      whiteSpace: 'nowrap', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis',
                      border: '1px solid rgba(255,255,255,0.2)',
                      cursor: 'default',
                      transition: 'transform 0.2s ease'
                    }} 
                    className="gantt-bar-hover"
                    title={`${r.nombre_huesped} (${r.check_in} → ${r.check_out})`}
                    >
                      {r.nombre_huesped}
                    </div>
                  );
                })}
              </div>
            </React.Fragment>
          );
        })}
      </div>
      
      {/* Leyenda */}
      <div style={{ padding: '16px', display: 'flex', gap: '20px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', borderTop: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#3B82F6' }}></div> Airbnb
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#10B981' }}></div> Manual
          </div>
          <div style={{ marginLeft: 'auto', fontStyle: 'italic', opacity: 0.8 }}>
              Mostrando ventana de 30 días desde hoy
          </div>
      </div>
    </div>
  );
}
