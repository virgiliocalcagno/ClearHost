import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TaskCardElite } from './TaskCardElite';

export const TaskPlannerElite = ({ 
  tasks, 
  onTaskUpdate, 
  handleAsignar, 
  handleWhatsApp, 
  staffLimpieza,
  onRefresh 
}) => {
  const [baseDate, setBaseDate] = useState(new Date());

  // Generar las 7 fechas a partir de Hoy
  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + i);
      return {
        dateStr: d.toLocaleDateString('en-CA'),
        dayName: d.toLocaleDateString('es-ES', { weekday: 'short' }),
        dayNum: d.getDate(),
        monthName: d.toLocaleDateString('es-ES', { month: 'short' }),
        isToday: d.toLocaleDateString('en-CA') === new Date().toLocaleDateString('en-CA')
      };
    });
  }, [baseDate]);

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetDate) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      try {
        await onTaskUpdate(taskId, { fecha_programada: targetDate });
        if (onRefresh) onRefresh();
      } catch (err) {
        console.error("Error updating task date:", err);
      }
    }
  };

  return (
    <div className="flex flex-col gap-6 select-none">
      {/* Header del Centro de Mando */}
      <div className="flex items-center justify-between bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-teal-600 text-white rounded-2xl flex items-center justify-center text-xl font-black shadow-lg">⚡</div>
          <div>
            <h3 className="text-xl font-black tracking-tight text-slate-900">Operational Command Center</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Ventana Estratégica 7 Días • Tiempo Real</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <button onClick={() => setBaseDate(new Date(baseDate.setDate(baseDate.getDate() - 7)))} className="p-3 rounded-full bg-slate-50 hover:bg-slate-900 hover:text-white transition-all duration-300">←</button>
           <button onClick={() => setBaseDate(new Date())} className="px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest bg-slate-50 hover:bg-teal-600 hover:text-white transition-all">HOY</button>
           <button onClick={() => setBaseDate(new Date(baseDate.setDate(baseDate.getDate() + 7)))} className="p-3 rounded-full bg-slate-50 hover:bg-slate-900 hover:text-white transition-all duration-300">→</button>
        </div>
      </div>

      {/* Grid de 7 Días Elite */}
      <div className="grid grid-cols-7 gap-4 min-w-[1200px] pb-10">
        {days.map((day) => {
          const dayTasks = tasks.filter(t => t.fecha_programada === day.dateStr);
          const completedCount = dayTasks.filter(t => ['COMPLETADA', 'VERIFICADA', 'CLEAN_AND_READY'].includes(t.estado)).length;
          const totalCount = dayTasks.length;
          const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

          return (
            <div 
              key={day.dateStr}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, day.dateStr)}
              className={`flex flex-col gap-4 rounded-[2rem] p-3 transition-all duration-500 ${day.isToday ? 'bg-white shadow-2xl scale-[1.02] ring-2 ring-teal-500/10' : 'bg-transparent'}`}
            >
              {/* Day Header - Tactical Style */}
              <div className={`p-5 rounded-[1.8rem] text-center relative overflow-hidden transition-all duration-500 ${day.isToday ? 'bg-teal-600 text-white shadow-lg' : 'bg-slate-50 text-slate-800 group hover:bg-slate-100'}`}>
                {day.isToday && <div className="absolute top-0 left-0 w-full h-1 bg-white/30 animate-pulse" />}
                
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">{day.dayName}</p>
                <div className="flex items-center justify-center gap-2">
                  <p className="text-4xl font-black tracking-tighter">{day.dayNum}</p>
                  <p className="text-[10px] font-bold rotate-90 opacity-40 uppercase tracking-widest">{day.monthName}</p>
                </div>

                {/* KPI Bubble */}
                <div className={`mt-3 py-1.5 px-3 rounded-full text-[10px] font-black inline-flex items-center gap-2 transition-all ${day.isToday ? 'bg-white/20 text-white' : 'bg-white text-slate-600 shadow-sm border border-slate-100'}`}>
                  <span>📊 {completedCount}/{totalCount}</span>
                  <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className={`h-full ${day.isToday ? 'bg-white' : 'bg-teal-500'}`} />
                  </div>
                </div>
              </div>

              {/* Task Column */}
              <div className="flex flex-col gap-3 min-h-[400px]">
                <AnimatePresence initial={false}>
                  {dayTasks.length === 0 ? (
                    <motion.div 
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="h-24 border-2 border-dashed border-[#e4e2e4] rounded-[1.8rem] flex items-center justify-center"
                    >
                       <p className="text-[10px] font-bold text-[#545f73] uppercase tracking-widest">Despejado</p>
                    </motion.div>
                  ) : (
                    dayTasks.map(task => (
                      <TaskCardElite 
                        key={task.id} 
                        task={task} 
                        onDragStart={handleDragStart}
                        handleAsignar={handleAsignar}
                        handleWhatsApp={handleWhatsApp}
                        staffLimpieza={staffLimpieza}
                      />
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
