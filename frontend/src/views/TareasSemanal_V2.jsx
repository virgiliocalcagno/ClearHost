import React from 'react';
import { EstadoBadge_V2, getUrgencyTier, UrgencyBadge_V2 } from './TareasView_V2';

/**
 * TareasSemanal_V2 - Calendario Operativo de 7 Días (Semanal).
 * Extiende la lógica de la Vista Operativa 4D a una ventana de alta densidad.
 */
export function TareasSemanal_V2({ 
    tareas, 
    propiedades, 
    handleAsignar, 
    handleTimeChange, 
    staffLimpieza, 
    handleWhatsApp,
    dayOffset,
    setDayOffset
}) {
  const numDays = 7; // Vista estrictamente semanal
  
  const getTodayStr = () => new Date().toLocaleDateString('en-CA');
  const todayStr = getTodayStr();

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

  const tasksByDate = {};
  tareas.forEach(t => {
    if (!tasksByDate[t.fecha_programada]) tasksByDate[t.fecha_programada] = [];
    tasksByDate[t.fecha_programada].push(t);
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-headline text-2xl font-black text-slate-900 tracking-tighter uppercase">Planificación Semanal (7D)</h3>
          <p className="font-body text-xs font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
            <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
            Control de Operaciones y Limpieza
          </p>
        </div>
        
        <div className="flex gap-2 items-center bg-white/50 backdrop-blur-sm p-1.5 rounded-2xl shadow-sm border border-slate-200/50">
            <button onClick={() => setDayOffset(prev => prev - 1)} className="p-3 rounded-xl hover:bg-slate-100 transition-all hover:scale-110 active:scale-90">
              <span className="material-symbols-outlined text-slate-600">chevron_left</span>
            </button>
            <button onClick={() => setDayOffset(0)} className="px-6 py-2.5 rounded-xl font-headline text-[10px] font-black uppercase tracking-widest bg-slate-900 text-teal-400 hover:opacity-90 transition-all shadow-lg active:scale-95">Hoy</button>
            <button onClick={() => setDayOffset(prev => prev + 1)} className="p-3 rounded-xl hover:bg-slate-100 transition-all hover:scale-110 active:scale-90">
              <span className="material-symbols-outlined text-slate-600">chevron_right</span>
            </button>
        </div>
      </div>

      {/* Grid Wrapper with Horizontal Scroll */}
      <div className="bg-surface-container-low rounded-[2.5rem] p-3 shadow-inner overflow-hidden border border-white/20">
        <div className="overflow-x-auto overflow-y-hidden custom-scrollbar pb-4">
          <div className="min-w-[1400px] flex gap-4"> {/* Garantiza espacio para las 7 columnas */}
            {currentDates.map(dateStr => {
              const dayTasks = tasksByDate[dateStr] || [];
              const d = new Date(dateStr + 'T12:00:00');
              const isToday = todayStr === dateStr;

              return (
                <div key={dateStr} className="flex-1 flex flex-col gap-6 group">
                  {/* Day Header */}
                  <div className={`p-6 rounded-[2.2rem] text-center transition-all duration-500 ${isToday ? 'bg-slate-900 text-teal-400 shadow-2xl scale-[1.03] ring-4 ring-teal-400/10' : 'bg-white/60 text-slate-900 hover:bg-white/80'}`}>
                    <p className="font-headline text-[9px] font-black opacity-60 uppercase tracking-[0.3em] mb-1">
                      {d.toLocaleDateString('es-ES', { weekday: 'long' })}
                    </p>
                    <p className="font-headline text-4xl font-black tracking-tighter leading-none">{d.getDate()}</p>
                    <p className="font-headline text-[10px] font-bold mt-1 opacity-40 uppercase tracking-widest truncate">{d.toLocaleDateString('es-ES', { month: 'short' })}</p>
                  </div>

                  {/* Tasks Container */}
                  <div className="space-y-3 flex-1 px-1">
                    {dayTasks.length === 0 ? (
                      <div className="h-24 bg-white/20 border-2 border-dashed border-slate-200/50 rounded-[1.8rem] flex items-center justify-center text-slate-400 text-[10px] font-bold uppercase tracking-widest italic">
                        Libre
                      </div>
                    ) : (
                      dayTasks.map(t => {
                        const prop = propiedades.find(p => p.id === t.propiedad_id);
                        const urgency = getUrgencyTier(t);
                        const isEmergency = urgency === 'EMERGENCIA';

                        return (
                          <div key={t.id} className={`p-4 rounded-[1.8rem] transition-all relative overflow-hidden group/card shadow-sm hover:shadow-xl hover:translate-y-[-2px] border border-white/40 ${isEmergency ? 'bg-red-50/60 ring-1 ring-red-500/30' : 'bg-white/80 hover:bg-white'}`}>
                            {isEmergency && <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-pulse" />}
                            
                            <div className="flex justify-between items-start mb-2 gap-2">
                              <h4 className="font-headline text-[11px] font-black text-slate-800 leading-tight group-hover/card:text-teal-600 transition-colors uppercase tracking-tighter truncate w-2/3">
                                {prop?.nombre || 'S/N'}
                              </h4>
                              <UrgencyBadge_V2 tier={urgency} />
                            </div>

                            <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                               <span className="px-1.5 py-0.5 bg-slate-200/50 text-slate-600 rounded-[4px] text-[7.5px] font-black uppercase tracking-widest truncate max-w-[80px]">
                                  {t.tipo_tarea?.toLowerCase().replace(/_/g, ' ')}
                               </span>
                               <span className="font-body text-[9px] font-black text-slate-400 flex items-center gap-0.5">
                                  <span className="material-symbols-outlined text-[10px]">schedule</span>
                                  {t.hora_inicio || '11:00'}
                               </span>
                            </div>

                            <div className="mb-4 flex items-center justify-between">
                                <EstadoBadge_V2 estado={t.estado} />
                                <span className="text-[8px] font-black text-slate-300">#{t.id_secuencial}</span>
                            </div>

                            <div className="bg-slate-50/80 p-1.5 rounded-xl flex items-center gap-2">
                                <select
                                    className="bg-transparent font-headline text-[9px] font-black text-slate-600 border-none focus:ring-0 w-full p-0.5 uppercase tracking-tighter"
                                    value={t.asignado_a || ''}
                                    onChange={(e) => handleAsignar(t.id, e.target.value)}
                                >
                                    <option value="">Vacante</option>
                                    {staffLimpieza.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                                </select>
                                <button 
                                    onClick={() => handleWhatsApp(t.id)} 
                                    className="opacity-0 group-hover/card:opacity-100 bg-white w-6 h-6 rounded-lg text-teal-500 shadow-sm border border-teal-100 flex items-center justify-center hover:bg-teal-500 hover:text-white transition-all transform hover:scale-110 active:scale-90"
                                >
                                    <span className="material-symbols-outlined text-[12px]">chat</span>
                                </button>
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
      </div>
    </div>
  );
}
