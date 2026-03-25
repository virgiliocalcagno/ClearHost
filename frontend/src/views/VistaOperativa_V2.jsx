import React from 'react';
import { EstadoBadge_V2 } from './TareasView_V2';

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

  const getUrgency = (t) => {
    const [year, month, day] = t.fecha_programada.split('-').map(Number);
    const [hour, min] = (t.hora_inicio || '11:00').split(':').map(Number);
    const scheduled = new Date(year, month - 1, day, hour, min);
    const now = new Date();
    const diffHours = (scheduled - now) / (1000 * 60 * 60);

    if (t.prioridad === 'EMERGENCIA' || diffHours <= 12) return 'URGENTE';
    if (diffHours <= 24) return 'ALTA';
    return 'NORMAL';
  };

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-[#000000]">Vista Operativa (4D)</h2>
          <p className="text-[#545f73] font-medium mt-1 uppercase tracking-[0.2em] text-xs">Motor de Urgencia Activo</p>
        </div>
        <div className="flex gap-2">
            <button onClick={() => setDayOffset(prev => prev - 1)} className="p-4 rounded-full bg-[#f6f3f5] hover:bg-[#e4e2e4] transition-all">←</button>
            <button onClick={() => setDayOffset(0)} className="px-6 py-4 rounded-full font-bold text-sm bg-black text-[#62fae3]">Hoy</button>
            <button onClick={() => setDayOffset(prev => prev + 1)} className="p-4 rounded-full bg-[#f6f3f5] hover:bg-[#e4e2e4] transition-all">→</button>
        </div>
      </div>

      <div className="flex overflow-x-auto pb-10 gap-8 hide-scrollbar">
        {currentDates.map(dateStr => {
          const dayTasks = tasksByDate[dateStr] || [];
          const d = new Date(dateStr + 'T12:00:00');
          const isToday = todayStr === dateStr;

          return (
            <div key={dateStr} className={`flex-none w-[380px] space-y-6`}>
              {/* Header Día - No Line layer */}
              <div className={`p-8 rounded-[3rem] text-center transition-all ${isToday ? 'bg-black text-[#62fae3] shadow-2xl scale-105' : 'bg-[#f6f3f5] text-black'}`}>
                <p className="text-[10px] font-black opacity-70 uppercase tracking-[0.3em] mb-1">
                  {d.toLocaleDateString('es-ES', { weekday: 'long' })}
                </p>
                <p className="text-5xl font-black tracking-tighter">{d.getDate()}</p>
                <p className="text-xs font-bold mt-1 opacity-60">{d.toLocaleDateString('es-ES', { month: 'long' }).toUpperCase()}</p>
              </div>

              <div className="space-y-4 min-h-[500px]">
                {dayTasks.length === 0 ? (
                  <div className="h-32 border-2 border-dashed border-[#e4e2e4] rounded-[2.5rem] flex items-center justify-center text-[#545f73] text-sm italic">
                    Sin operaciones
                  </div>
                ) : (
                  dayTasks.map(t => {
                    const prop = propiedades.find(p => p.id === t.propiedad_id);
                    const urgency = getUrgency(t);
                    const isUrgent = urgency === 'URGENTE';

                    return (
                      <div key={t.id} className={`p-6 rounded-[2.5rem] transition-all border-none ${isUrgent ? 'bg-white/80 backdrop-blur-xl shadow-[0_20px_40px_rgba(0,0,0,0.12)] border-t-[6px] border-[#ba1a1a]' : 'bg-[#fcf8fa]'}`}>
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="font-black text-lg leading-tight w-2/3">{prop?.nombre || 'Propiedad'}</h4>
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black border ${isUrgent ? 'border-[#ba1a1a] text-[#ba1a1a]' : 'border-black/10 text-[#545f73]'}`}>
                            {isUrgent ? 'PRIORIDAD CRÍTICA' : 'NORMAL'}
                          </span>
                        </div>

                        <p className="text-[10px] font-bold text-[#545f73] uppercase tracking-wider mb-4">
                            {t.tipo_tarea?.replace(/_/g, ' ')} • {t.hora_inicio || '11:00'}
                        </p>

                        <div className="mb-6">
                            <EstadoBadge_V2 estado={t.estado} />
                        </div>

                        <div className="bg-[#f6f3f5] p-2 rounded-2xl flex items-center justify-between">
                            <select
                                className="bg-transparent text-[11px] font-bold border-none focus:ring-0 w-full"
                                value={t.asignado_a || ''}
                                onChange={(e) => handleAsignar(t.id, e.target.value)}
                            >
                                <option value="">Sin Asignar</option>
                                {staffLimpieza.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                            </select>
                            <button onClick={() => handleWhatsApp(t.id)} className="bg-white p-2 rounded-xl text-[#25D366] shadow-sm">
                                <i className="fab fa-whatsapp"></i>
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
