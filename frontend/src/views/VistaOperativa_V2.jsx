import { EstadoBadge_V2, getUrgencyTier, UrgencyBadge_V2 } from './TareasView_V2';

export function VistaOperativa_V2({ 
    tareas, 
    propiedades, 
    handleAsignar, 
    handleTimeChange, 
    staffLimpieza, 
    handleWhatsApp,
    dayOffset,
    setDayOffset
}) {
  const numDays = 4;
  
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
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-headline text-2xl font-bold text-on-surface tracking-tight">Calendario de Urgencias (4D)</h3>
          <p className="font-body text-sm text-on-surface-variant font-medium uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
            Motor de Prioridades Activo
          </p>
        </div>
        <div className="flex gap-2 items-center bg-surface-container-low p-1.5 rounded-2xl shadow-sm border border-outline-variant/10">
            <button onClick={() => setDayOffset(prev => prev - 1)} className="p-3 rounded-xl hover:bg-surface-variant transition-all hover:scale-105 active:scale-95">
              <span className="material-symbols-outlined text-on-surface-variant">chevron_left</span>
            </button>
            <button onClick={() => setDayOffset(0)} className="px-5 py-2.5 rounded-xl font-headline text-[11px] font-black uppercase tracking-widest bg-slate-900 text-teal-400 hover:bg-slate-800 transition-all shadow-md">Hoy</button>
            <button onClick={() => setDayOffset(prev => prev + 1)} className="p-3 rounded-xl hover:bg-surface-variant transition-all hover:scale-105 active:scale-95">
              <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {currentDates.map(dateStr => {
          const dayTasks = tasksByDate[dateStr] || [];
          const d = new Date(dateStr + 'T12:00:00');
          const isToday = todayStr === dateStr;

          return (
            <div key={dateStr} className="flex flex-col gap-6 group">
              {/* Day Header - No Line style */}
              <div className={`p-6 rounded-[2.5rem] text-center transition-all duration-500 border-b-0 ${isToday ? 'bg-slate-900 text-teal-400 shadow-2xl scale-[1.03] ring-4 ring-teal-400/10' : 'bg-surface-container-low text-on-surface hover:bg-surface-variant/30'}`}>
                <p className="font-headline text-[10px] font-black opacity-60 uppercase tracking-[0.3em] mb-1">
                  {d.toLocaleDateString('es-ES', { weekday: 'long' })}
                </p>
                <p className="font-headline text-5xl font-black tracking-tighter leading-none">{d.getDate()}</p>
                <p className="font-headline text-[11px] font-bold mt-2 opacity-50 uppercase tracking-widest">{d.toLocaleDateString('es-ES', { month: 'long' })}</p>
              </div>

              <div className="space-y-4 flex-1">
                {dayTasks.length === 0 ? (
                  <div className="h-32 bg-slate-50 border-2 border-dashed border-outline-variant/20 rounded-[2rem] flex items-center justify-center text-on-surface-variant/40 text-xs font-medium italic">
                    Sin operaciones
                  </div>
                ) : (
                  dayTasks.map(t => {
                    const prop = propiedades.find(p => p.id === t.propiedad_id);
                    const urgency = getUrgencyTier(t);
                    const isEmergency = urgency === 'EMERGENCIA';

                    return (
                      <div key={t.id} className={`p-5 rounded-[2rem] transition-all relative overflow-hidden group/card shadow-sm hover:shadow-md ${isEmergency ? 'bg-red-50/40 ring-2 ring-red-500/20' : 'bg-surface-container-low hover:bg-surface-variant/20'}`}>
                        {isEmergency && <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-pulse" />}
                        {!isEmergency && urgency !== 'BAJA' && urgency !== 'FINALIZADA' && (
                          <div className={`absolute top-0 left-0 w-full h-0.5 ${urgency === 'ALTA' ? 'bg-orange-400' : 'bg-yellow-400'}`} />
                        )}
                        
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-headline text-sm font-bold text-on-surface leading-snug w-3/4 group-hover/card:text-teal-600 transition-colors uppercase tracking-tight">{prop?.nombre || 'Propiedad'}</h4>
                          <UrgencyBadge_V2 tier={urgency} />
                        </div>

                        <div className="flex items-center gap-2 mb-4">
                           <span className="px-2 py-0.5 bg-slate-200/50 text-slate-600 rounded-[4px] text-[8px] font-bold uppercase tracking-widest capitalize">
                              {t.tipo_tarea?.toLowerCase().replace(/_/g, ' ')}
                           </span>
                           <span className="font-body text-[10px] font-bold text-on-surface-variant flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">schedule</span>
                              {t.hora_inicio || '11:00'}
                           </span>
                        </div>

                        <div className="mb-5 flex items-center justify-between">
                            <EstadoBadge_V2 estado={t.estado} />
                             <span className="text-[9px] font-black text-on-surface-variant/40">#{t.id_secuencial}</span>
                        </div>

                        <div className="bg-slate-100 p-1.5 rounded-xl flex items-center gap-2">
                            <select
                                className="bg-transparent font-headline text-[10px] font-bold text-on-surface border-none focus:ring-0 w-full p-1"
                                value={t.asignado_a || ''}
                                onChange={(e) => handleAsignar(t.id, e.target.value)}
                            >
                                <option value="">Sin Asignar</option>
                                {staffLimpieza.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                            </select>
                            <button 
                                onClick={() => handleWhatsApp(t.id)} 
                                className="hidden group-hover/card:flex bg-white w-7 h-7 rounded-lg text-teal-600 shadow-sm border border-teal-100 items-center justify-center hover:bg-teal-600 hover:text-white transition-all transform hover:scale-110"
                            >
                                <span className="material-symbols-outlined text-sm">chat</span>
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
  );
}
