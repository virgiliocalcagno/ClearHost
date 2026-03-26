import React, { useState } from 'react';

/**
 * VistaSemanal_V2 - Visualización de Ocupación de alta densidad (7 Días).
 * Sigue estrictamente la regla "No-Line" de Architectural Precision.
 */
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-headline text-2xl font-black text-slate-900 tracking-tighter">Ocupación de Propiedades</h3>
          <p className="font-body text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Módulo de Reservas • Vista 7D</p>
        </div>
        <div className="flex gap-2 items-center bg-white/50 backdrop-blur-sm p-1.5 rounded-2xl shadow-sm border border-slate-200/50">
            <button onClick={handleMesAnterior} className="p-3 rounded-xl hover:bg-slate-100 transition-all hover:scale-110 active:scale-90">
              <span className="material-symbols-outlined text-slate-600">chevron_left</span>
            </button>
            <button onClick={() => setFechaInicio(new Date())} className="px-6 py-2.5 rounded-xl font-headline text-[10px] font-black uppercase tracking-widest bg-slate-900 text-teal-400 hover:opacity-90 transition-all shadow-lg active:scale-95">Esta Semana</button>
            <button onClick={handleMesSiguiente} className="p-3 rounded-xl hover:bg-slate-100 transition-all hover:scale-110 active:scale-90">
              <span className="material-symbols-outlined text-slate-600">chevron_right</span>
            </button>
        </div>
      </div>

      {/* Gantt Wrapper with Safe Scroll */}
      <div className="bg-surface-container-low rounded-[2.5rem] p-3 shadow-inner overflow-hidden border border-white/20">
        <div className="overflow-x-auto overflow-y-hidden custom-scrollbar pb-2">
          <div className="min-w-[1000px]"> {/* Garantiza densidad mínima */}
            <div className="grid grid-cols-[240px_1fr] gap-1">
              
              {/* Propiedades Header Column */}
              <div className="bg-white/80 p-6 flex items-center rounded-2xl mb-1">
                <span className="material-symbols-outlined text-slate-400 mr-3 text-xl">apartment</span>
                <p className="font-headline text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Portfolio</p>
              </div>
              
              {/* Days Header */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {currentDates.map((dateStr) => {
                  const d = new Date(dateStr + 'T12:00:00');
                  const isToday = dateStr === new Date().toLocaleDateString('en-CA');
                  return (
                    <div key={dateStr} className={`p-4 text-center rounded-2xl transition-all duration-500 flex flex-col justify-center ${isToday ? 'bg-slate-900 text-teal-400 shadow-xl scale-[1.02] ring-4 ring-teal-400/10' : 'bg-white/60 text-slate-900'}`}>
                      <p className="font-headline text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">{d.toLocaleDateString('es-ES', { weekday: 'short' })}</p>
                      <p className="font-headline text-3xl font-black tracking-tighter leading-none">{d.getDate()}</p>
                    </div>
                  );
                })}
              </div>

              {/* Table Content Rows */}
              {propiedades.map(p => {
                 const propReservas = data.filter(r => r.propiedad_id === p.id && r.estado !== 'CANCELADA');
                 return (
                   <React.Fragment key={p.id}>
                     {/* Property Info Cell */}
                     <div className="bg-white/40 p-5 flex items-center rounded-2xl min-h-[76px] transition-colors hover:bg-white/80 group">
                       <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg bg-slate-200/50 flex items-center justify-center text-slate-500 font-black text-xs group-hover:bg-teal-100 group-hover:text-teal-600 transition-colors uppercase">
                           {p.nombre_corto?.substring(0,2) || p.nombre?.substring(0,2)}
                         </div>
                         <div>
                           <h4 className="font-headline text-[12px] font-bold text-slate-900 truncate w-40 leading-tight uppercase tracking-tight">{p.nombre}</h4>
                           <p className="font-body text-[9px] text-slate-400 font-bold uppercase tracking-widest">{p.zona || 'Base'}</p>
                         </div>
                       </div>
                     </div>

                     {/* Grid Cells & Reservations */}
                     <div className="grid grid-cols-7 gap-1 h-[76px] relative">
                       {currentDates.map(dateStr => (
                         <div key={dateStr} className="bg-white/20 rounded-2xl transition-colors hover:bg-white/40" />
                       ))}
                       
                       {/* Floating Reservations Layer */}
                       <div className="absolute inset-0 pointer-events-none p-1.5 flex items-center">
                         {propReservas.map(r => {
                            const checkInStr = r.check_in;
                            const checkOutStr = r.check_out;
                            
                            const startIndex = currentDates.indexOf(checkInStr);
                            const endIndex = currentDates.indexOf(checkOutStr);

                            // Lógica de desbordamiento de fechas
                            if (startIndex === -1 && endIndex === -1) {
                               const startD = new Date(checkInStr);
                               const endD = new Date(checkOutStr);
                               const viewStart = new Date(currentDates[0]);
                               const viewEnd = new Date(currentDates[6]);
                               if (!(startD <= viewEnd && endD >= viewStart)) return null;
                            }

                            const effectiveStart = startIndex === -1 ? 0 : startIndex;
                            const effectiveEnd = endIndex === -1 ? 7 : endIndex;
                            const span = Math.max(effectiveEnd - effectiveStart, 0.4);

                            return (
                              <div 
                                key={r.id}
                                className={`absolute h-9 rounded-full px-5 flex items-center pointer-events-auto shadow-md border border-white/20 transition-all hover:scale-[1.02] hover:shadow-lg group/res ${r.fuente === 'AIRBNB' ? 'bg-[#FF5A5F] text-white' : 'bg-slate-900 text-teal-400'}`}
                                style={{
                                  left: `calc(${(effectiveStart / 7) * 100}% + 4px)`,
                                  width: `calc(${(span / 7) * 100}% - 8px)`,
                                  zIndex: 10
                                }}
                              >
                                <div className="flex flex-col truncate">
                                  <span className="font-headline text-[10px] font-black truncate uppercase tracking-tighter leading-tight">{r.nombre_huesped}</span>
                                  <span className="font-body text-[8px] opacity-70 font-bold uppercase tracking-widest">
                                    {r.num_huespedes} pax • {r.fuente}
                                  </span>
                                </div>
                                <div className="ml-auto opacity-0 group-hover/res:opacity-100 transition-opacity flex gap-1">
                                    <span className="material-symbols-outlined text-[10px]">info</span>
                                </div>
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
      </div>
    </div>
  );
}
