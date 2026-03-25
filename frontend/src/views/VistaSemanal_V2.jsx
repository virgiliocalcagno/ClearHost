import React, { useState } from 'react';

export function VistaSemanal_V2({ data, propiedades }) {
  const [fechaInicio, setFechaInicio] = useState(new Date());
  const numDias = 7;

  const handleMesAnterior = () => {
    const d = new Date(fechaInicio);
    d.setDate(d.getDate() - 7);
    setFechaInicio(d);
  };

  const handleMesSiguiente = () => {
    const d = new Date(fechaInicio);
    d.setDate(d.getDate() + 7);
    setFechaInicio(d);
  };

  const currentDates = Array.from({ length: numDias }, (_, i) => {
    const d = new Date(fechaInicio);
    d.setDate(d.getDate() + i);
    return d.toLocaleDateString('en-CA');
  });

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-[#000000]">Vista Semanal (7D)</h2>
          <p className="text-[#545f73] font-medium mt-1 uppercase tracking-[0.2em] text-xs">Alta Densidad • No-Line Layers</p>
        </div>
        <div className="flex gap-2">
            <button onClick={handleMesAnterior} className="p-4 rounded-full bg-[#f6f3f5] hover:bg-[#e4e2e4] transition-all">←</button>
            <button onClick={() => setFechaInicio(new Date())} className="px-6 py-4 rounded-full font-bold text-sm bg-black text-[#62fae3]">Esta Semana</button>
            <button onClick={handleMesSiguiente} className="p-4 rounded-full bg-[#f6f3f5] hover:bg-[#e4e2e4] transition-all">→</button>
        </div>
      </div>

      <div className="bg-[#f6f3f5] rounded-[3rem] overflow-hidden p-2">
        <div className="grid grid-cols-[250px_1fr] gap-2">
          {/* Timeline Header */}
          <div className="bg-[#fcf8fa] p-8 flex items-center rounded-[2.5rem]">
            <p className="font-black text-[10px] text-[#545f73] uppercase tracking-[0.3em]">Propiedades</p>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {currentDates.map((dateStr, i) => {
              const d = new Date(dateStr + 'T12:00:00');
              const isToday = dateStr === new Date().toLocaleDateString('en-CA');
              return (
                <div key={dateStr} className={`p-6 text-center rounded-[2.5rem] ${isToday ? 'bg-black text-[#62fae3]' : 'bg-[#fcf8fa]'}`}>
                  <p className="text-[10px] font-black uppercase opacity-60 mb-1">{d.toLocaleDateString('es-ES', { weekday: 'short' })}</p>
                  <p className="text-2xl font-black tracking-tighter">{d.getDate()}</p>
                </div>
              );
            })}
          </div>

          {/* Body */}
          {propiedades.map(p => {
             const propReservas = data.filter(r => r.propiedad_id === p.id && r.estado !== 'CANCELADA');
             return (
               <React.Fragment key={p.id}>
                 <div className="bg-[#fcf8fa] p-8 flex items-center rounded-[2.5rem]">
                   <h4 className="font-bold text-sm truncate">{p.nombre}</h4>
                 </div>
                 <div className="grid grid-cols-7 gap-1 h-24 relative">
                   {currentDates.map(dateStr => (
                     <div key={dateStr} className="bg-[#fcf8fa] rounded-[2rem]" />
                   ))}
                   {/* Reservas Layer */}
                   <div className="absolute inset-0 pointer-events-none">
                     {propReservas.map(r => {
                        const sIdx = currentDates.indexOf(r.check_in);
                        const eIdx = currentDates.indexOf(r.check_out);
                        
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
                          <div 
                            key={r.id}
                            className="absolute h-10 top-7 rounded-full px-4 flex items-center text-[9px] font-black pointer-events-auto shadow-sm"
                            style={{
                              left: `${(start / 7) * 100}%`,
                              width: `${(span / 7) * 100}%`,
                              backgroundColor: r.fuente === 'AIRBNB' ? '#FF5A5F' : '#000',
                              color: '#fff',
                              marginLeft: '4px',
                              width: `calc(${(span / 7) * 100}% - 8px)`
                            }}
                          >
                            <span className="truncate">{r.nombre_huesped}</span>
                          </div>
                        );
                     })}
                   </div>
                 </div>
               </React.Fragment>
             );
          })}
        </div>
      </div>
    </div>
  );
}
