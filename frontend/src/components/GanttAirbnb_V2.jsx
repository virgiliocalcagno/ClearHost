import React, { useState, useMemo } from 'react';
import { ExternalLink } from 'lucide-react';

/**
 * Componente GanttAirbnb_V2
 * Una visualización de alta densidad inspirada en el multicalendar de Airbnb.
 */
export default function GanttAirbnb_V2({ data, propiedades }) {
  const [fechaInicio, setFechaInicio] = useState(new Date());
  const numDias = 31; // Mostramos un mes completo aprox.

  // Colores por fuente siguiendo la estética de Airbnb y marcas
  const getFuenteColor = (fuente) => {
    switch (fuente) {
      case 'AIRBNB': return '#FF385C'; // El rosa clásico de Airbnb
      case 'BOOKING': return '#003580'; // Azul Booking
      case 'VRBO': return '#0067FF'; 
      case 'MANUAL': return '#484848'; // Gris oscuro elegante
      default: return '#717171';
    }
  };

  // Navegación
  const handleMesAnterior = () => {
    const d = new Date(fechaInicio);
    d.setMonth(d.getMonth() - 1);
    setFechaInicio(d);
  };

  const handleMesSiguiente = () => {
    const d = new Date(fechaInicio);
    d.setMonth(d.getMonth() + 1);
    setFechaInicio(d);
  };

  // Generar fechas
  const currentDates = useMemo(() => {
    return Array.from({ length: numDias }, (_, i) => {
      const d = new Date(fechaInicio);
      d.setDate(d.getDate() + i);
      return d.toISOString().split('T')[0];
    });
  }, [fechaInicio, numDias]);

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="airbnb-calendar-v2" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '600px', // Altura fija con scroll interno
      backgroundColor: '#fff',
      borderRadius: '12px',
      border: '1px solid #DDDDDD',
      overflow: 'hidden',
      fontFamily: 'Inter, -apple-system, system-ui, sans-serif'
    }}>
      {/* Selector de Fecha Superior */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 24px',
        borderBottom: '1px solid #EBEBEB'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#222222' }}>
            {fechaInicio.toLocaleString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase()}
          </h4>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button onClick={handleMesAnterior} style={navBtnStyle}>❮</button>
            <button onClick={handleMesSiguiente} style={navBtnStyle}>❯</button>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#717171' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#FF385C' }}></div> Airbnb
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#003580' }}></div> Booking
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#484848' }}></div> Manual
          </div>
        </div>
      </div>

      {/* Grid Principal */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        position: 'relative'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `220px repeat(${numDias}, 60px)`, // Celdas un poco mas anchas para mejor legibilidad
          minWidth: 'fit-content'
        }}>
          
          {/* Esquina superior izquierda vacía (sticky) */}
          <div style={{
            position: 'sticky',
            top: 0,
            left: 0,
            zIndex: 30,
            backgroundColor: '#fff',
            borderBottom: '1px solid #EBEBEB',
            borderRight: '1px solid #EBEBEB',
            height: '50px'
          }}></div>

          {/* Header de Fechas (sticky top) */}
          {currentDates.map(dateStr => {
            const d = new Date(dateStr + 'T12:00:00');
            const isToday = dateStr === todayStr;
            const isWeekend = d.getDay() === 0 || d.getDay() === 6;

            return (
              <div key={dateStr} style={{
                position: 'sticky',
                top: 0,
                zIndex: 20,
                backgroundColor: isToday ? '#F7F7F7' : '#fff',
                height: '50px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderBottom: '1px solid #EBEBEB',
                borderRight: '1px solid #F3F3F3',
                color: isToday ? '#FF385C' : (isWeekend ? '#717171' : '#222'),
                fontSize: '11px',
                fontWeight: isToday ? 700 : 500
              }}>
                <span style={{ textTransform: 'uppercase', fontSize: '9px', opacity: 0.7 }}>
                  {d.toLocaleDateString('es-ES', { weekday: 'short' })}
                </span>
                <span style={{ fontSize: '14px', marginTop: '2px' }}>{d.getDate()}</span>
                {isToday && <div style={{ position: 'absolute', bottom: 0, width: '100%', height: '2px', backgroundColor: '#FF385C' }} />}
              </div>
            );
          })}

          {/* Filas de Propiedades */}
          {propiedades.filter(p => p.activa).map(prop => {
            const propReservas = data.filter(r => r.propiedad_id === prop.id && r.estado !== 'CANCELADA');

            return (
              <React.Fragment key={prop.id}>
                {/* Nombre de la Propiedad (sticky left) */}
                <div style={{
                  position: 'sticky',
                  left: 0,
                  zIndex: 10,
                  backgroundColor: '#fff',
                  padding: '0 16px',
                  height: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  borderBottom: '1px solid #EBEBEB',
                  borderRight: '1px solid #EBEBEB',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#222',
                  boxShadow: '2px 0 5px rgba(0,0,0,0.02)'
                }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {prop.nombre}
                  </div>
                </div>

                {/* Celdas de la cuadrícula */}
                <div style={{
                  gridColumn: `2 / span ${numDias}`,
                  display: 'grid',
                  gridTemplateColumns: `repeat(${numDias}, 60px)`,
                  height: '60px',
                  position: 'relative',
                  backgroundColor: '#fff',
                  borderBottom: '1px solid #F3F3F3'
                }}>
                  {/* Líneas de fondo del grid */}
                  {currentDates.map(d => (
                    <div key={d} style={{ 
                      borderRight: '1px solid #F3F3F3', 
                      backgroundColor: d === todayStr ? 'rgba(255, 56, 92, 0.02)' : 'transparent' 
                    }} />
                  ))}

                  {/* Renderizado de Reservas */}
                  {propReservas.map(res => {
                    const startIdx = currentDates.indexOf(res.check_in);
                    const endIdx = currentDates.indexOf(res.check_out);

                    // Lógica para mostrar reservas que se salen del rango
                    if (startIdx === -1 && endIdx === -1) {
                        const sDate = new Date(res.check_in);
                        const eDate = new Date(res.check_out);
                        const winStart = new Date(currentDates[0]);
                        const winEnd = new Date(currentDates[numDias-1]);
                        if (!(sDate <= winEnd && eDate >= winStart)) return null;
                    }

                    const left = startIdx === -1 ? 0 : startIdx;
                    const right = endIdx === -1 ? numDias : endIdx;
                    const span = Math.max(right - left, 0.2);

                    const color = getFuenteColor(res.fuente);

                    return (
                      <div key={res.id} 
                        className="airbnb-res-bar"
                        title={`${res.nombre_huesped} - ${res.check_in} al ${res.check_out}`}
                        style={{
                        position: 'absolute',
                        top: '12px',
                        left: `${left * 60 + 4}px`,
                        width: `${span * 60 - 8}px`,
                        height: '36px',
                        backgroundColor: color,
                        borderRadius: '18px', // Píldora estilo Airbnb
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 12px',
                        color: '#fff',
                        fontSize: '11px',
                        fontWeight: 600,
                        zIndex: 5,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        transition: 'transform 0.1s ease',
                        border: '1px solid rgba(255,255,255,0.1)'
                      }}>
                        <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {res.nombre_huesped}
                        </div>
                        
                        {res.fuente === 'AIRBNB' && res.codigo_reserva_canal && (
                          <a 
                            href={`https://www.airbnb.com/hosting/reservations/details/${res.codigo_reserva_canal}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              marginLeft: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '20px',
                              height: '20px',
                              backgroundColor: 'rgba(255,255,255,0.2)',
                              borderRadius: '4px',
                              color: '#fff',
                              transition: 'background 0.2s'
                            }}
                            title={`Ver en Airbnb: ${res.codigo_reserva_canal}`}
                            className="external-link-btn"
                          >
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
      
      <style>{`
        .airbnb-calendar-v2 ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .airbnb-calendar-v2 ::-webkit-scrollbar-thumb {
          background: #DDD;
          border-radius: 10px;
        }
        .airbnb-calendar-v2 ::-webkit-scrollbar-track {
          background: #F7F7F7;
        }
        .airbnb-res-bar:hover {
          transform: scaleY(1.05);
          filter: brightness(1.1);
        }
      `}</style>
    </div>
  );
}

const navBtnStyle = {
  background: '#fff',
  border: '1px solid #DDDDDD',
  borderRadius: '50%',
  width: '32px',
  height: '32px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  fontSize: '12px',
  color: '#222',
  transition: 'box-shadow 0.2s',
  outline: 'none'
};
