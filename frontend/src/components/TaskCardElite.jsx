import React from 'react';
import { motion } from 'framer-motion';
import { EstadoBadge_V2 } from './AdminCommon';

export const TaskCardElite = ({ 
  task, 
  onDragStart, 
  handleAsignar, 
  handleWhatsApp, 
  staffLimpieza 
}) => {
  // Lógica de Urgencia Superior (V3)
  const getEliteUrgency = (t) => {
    const [year, month, day] = t.fecha_programada.split('-').map(Number);
    const [hour, min] = (t.hora_inicio || '11:00').split(':').map(Number);
    const scheduled = new Date(year, month - 1, day, hour, min);
    const now = new Date();
    const diffHours = (scheduled - now) / (1000 * 60 * 60);

    if (t.estado === 'VERIFICADA') return { level: 'OK', color: '#475569', bg: '#F8FAFC', border: '#CBD5E1' };
    if (['COMPLETADA', 'CLEAN_AND_READY'].includes(t.estado)) return { level: 'OK', color: '#10B981', bg: '#F0FDF4', border: '#10B981' };

    if (t.prioridad === 'EMERGENCIA' || diffHours <= 12) {
      return { level: 'CRITICA', label: '🚨 PRIORIDAD MÁXIMA', color: '#B91C1C', bg: '#FEF2F2', border: '#EF4444', pulse: true };
    }
    if (diffHours <= 24) {
      return { level: 'ALTA', label: '🔴 ALTA', color: '#B91C1C', bg: '#FFF5F5', border: '#F87171' };
    }
    if (diffHours <= 48) {
      return { level: 'MEDIA', label: '🟡 MEDIA', color: '#854D0E', bg: '#FFFBEB', border: '#FBBF24' };
    }
    return { level: 'BAJA', label: '🟢 BAJA', color: '#065F46', bg: '#F0FDF4', border: '#34D399' };
  };

  const u = getEliteUrgency(task);

  return (
    <motion.div
      layoutId={task.id}
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      whileHover={{ y: -4, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
      className={`relative group bg-white rounded-[1.5rem] border-none shadow-sm overflow-hidden transition-all duration-300`}
      style={{ 
        borderLeft: `8px solid ${u.border}`,
        animation: u.pulse ? 'pulse-urgent 2s infinite' : 'none'
      }}
    >
      {/* Glossy Overlay for Emergency */}
      {u.pulse && <div className="absolute inset-0 bg-red-500/5 pointer-events-none animate-pulse" />}

      <div className="p-4 flex flex-col gap-3">
        {/* Header: ID & Meta */}
        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-[#545f73]">
          <div className="flex items-center gap-2">
            <span className="bg-[#f6f3f5] px-2 py-0.5 rounded-md text-black">T-{task.id_secuencial || task.id.split('-')[0].toUpperCase()}</span>
            {u.label && <span style={{ color: u.color }}>{u.label}</span>}
          </div>
          <div className="flex items-center gap-1">
             {task.fuente_reserva === 'airbnb' && <i className="fab fa-airbnb text-[#FF5A5F] text-sm"></i>}
             {task.fuente_reserva === 'ical' && <i className="far fa-calendar-alt text-[#3B82F6] text-sm"></i>}
             {task.fuente_reserva === 'manual' && <span className="bg-black text-[#62fae3] px-1 rounded">M</span>}
          </div>
        </div>

        {/* Main Info */}
        <div>
          <h4 className="text-sm font-black tracking-tight leading-tight mb-0.5 text-black truncate group-hover:text-clip">
            {task.nombre_propiedad || 'Propiedad Desconocida'}
          </h4>
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-bold text-[#545f73] uppercase tracking-tighter">
              {task.nombre_huesped || 'Huésped no registrado'}
            </p>
            <span className="w-1 h-1 rounded-full bg-[#e4e2e4]" />
            <p className="text-[10px] font-medium text-teal-600">
              {task.tipo_tarea?.replace(/_/g, ' ')}
            </p>
          </div>
        </div>

        {/* Status Area */}
        <div className="flex items-center justify-between border-y border-[#f6f3f5] py-2 my-1">
          <EstadoBadge_V2 estado={task.estado} />
          <span className="text-[11px] font-black tracking-tighter bg-[#f6f3f5] px-2 py-1 rounded-full">
            {task.hora_inicio || '11:00'}
          </span>
        </div>

        {/* Action Center - Elite Layout */}
        <div className="grid grid-cols-5 gap-1.5 items-center">
          <div className="col-span-4 bg-[#fcf8fa] rounded-xl p-1 flex items-center border border-[#f6f3f5] hover:border-black/10 transition-colors">
            <select
              className="w-full bg-transparent border-none text-[10px] font-black outline-none focus:ring-0 py-1 pl-2 text-[#000000] cursor-pointer"
              value={task.asignado_a || ''}
              onChange={(e) => handleAsignar(task.id, e.target.value)}
            >
              <option value="">SIN ASIGNAR</option>
              {staffLimpieza.map(s => (
                <option key={s.id} value={s.id}>{s.nombre.toUpperCase()}</option>
              ))}
            </select>
          </div>
          
          <button 
            onClick={() => handleWhatsApp(task.id)}
            className="h-full rounded-xl bg-[#25D366] text-white flex items-center justify-center shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all"
            title="Conectar por WhatsApp"
          >
            <i className="fab fa-whatsapp text-sm"></i>
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse-urgent {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
      `}} />
    </motion.div>
  );
};
