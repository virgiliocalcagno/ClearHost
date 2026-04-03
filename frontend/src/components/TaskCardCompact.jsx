import React from 'react';
import { motion } from 'framer-motion';
import { getTaskPriority } from '../utils/taskUtils';
import { ShieldAlert, User, Calendar, Home } from 'lucide-react';

/**
 * TaskCardCompact - Versión minificada para el Tablero de Planificación.
 * Enfocada en visibilidad rápida de urgencia y asignación.
 */
const TaskCardCompact = ({ tarea, onDragStart }) => {
  const priority = getTaskPriority(tarea.fecha_programada, tarea.hora_inicio);
  const isProtected = tarea.fuente_reserva && ['ICAL', 'AIRBNB', 'BOOKING'].includes(tarea.fuente_reserva.toUpperCase());

  // Lógica de color de borde y fondo según urgencia
  const getSeverityStyle = () => {
    switch (priority) {
      case 'CRITICO': return 'border-l-[6px] border-rose-500 shadow-rose-100 bg-white ring-2 ring-rose-50';
      case 'URGENTE': return 'border-l-[6px] border-amber-500 bg-white';
      case 'NORMAL': return 'border-l-[4px] border-emerald-400 bg-white';
      default: return 'border-l-[4px] border-slate-200 bg-white';
    }
  };

  const isBlinking = priority === 'CRITICO';

  return (
    <motion.div
      draggable
      onDragStart={(e) => onDragStart(e, tarea)}
      initial={false}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98, rotate: -1 }}
      className={`
        relative p-4 rounded-2xl mb-3 cursor-grab active:cursor-grabbing
        border border-slate-100 shadow-sm transition-all
        ${getSeverityStyle()}
        ${isBlinking ? 'animate-pulse-subtle' : ''}
      `}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          #{tarea.id.toString().slice(-4)}
        </span>
        {isProtected && (
          <div title={`Sincronizado vía ${tarea.fuente_reserva}`} className="bg-slate-100 p-1 rounded-md">
            <ShieldAlert size={10} className="text-slate-400" />
          </div>
        )}
      </div>

      <h5 className="text-[11px] font-black leading-tight text-slate-800 truncate mb-1">
        {tarea.nombre_propiedad || 'Sin Propiedad'}
      </h5>
      
      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter mb-3 flex items-center gap-1">
        <Home size={10} /> {tarea.tipo_tarea?.replace(/_/g, ' ')}
      </p>

      <div className="flex items-center justify-between pt-2 border-t border-slate-50">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black ${tarea.nombre_asignado ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400 font-normal italic'}`}>
            {tarea.nombre_asignado ? (
              tarea.nombre_asignado.split(' ').map(n => n[0]).join('').slice(0, 2)
            ) : (
              <User size={10} />
            )}
          </div>
          <span className="text-[8px] font-black text-slate-500 truncate uppercase">
            {tarea.nombre_asignado || 'Sin Asignar'}
          </span>
        </div>
        <span className="text-[9px] font-black text-slate-300">
          {tarea.hora_inicio?.slice(0, 5) || '11:00'}
        </span>
      </div>

      {isBlinking && (
        <div className="absolute top-2 right-2 flex gap-0.5">
           <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
        </div>
      )}
    </motion.div>
  );
};

export default TaskCardCompact;
