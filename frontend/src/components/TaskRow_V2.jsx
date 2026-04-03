import React from 'react';
import { getTaskPriority } from '../utils/taskUtils';
import { EstadoBadge_V2 } from './AdminCommon';
import { Trash2, MessageCircle, CreditCard, ExternalLink, ShieldAlert, Smartphone } from 'lucide-react';

/**
 * TaskRow_V2 - Componente de fila de alta densidad para el inventario de tareas.
 * Implementa lógica de protección de borrado y semáforo de urgencia.
 */
const TaskRow_V2 = ({ 
  tarea, 
  onDrawerOpen, 
  onDeleteRequest, 
  handleAsignar, 
  handleWhatsApp,
  staffLimpieza = [],
  onRefresh
}) => {
  const { level, className, pulse } = getTaskPriority(tarea.fecha_programada, tarea.hora_inicio);
  
  // Regla de Protección: Solo MANUAL es eliminable directamente
  const isProtected = ['AIRBNB', 'ICAl', 'BOOKING', 'VRBO'].includes(tarea.fuente_reserva?.toUpperCase());

  const canApprovePayment = tarea.estado === 'COMPLETADA' || tarea.estado === 'CLEAN_AND_READY';

  return (
    <div 
      className={`group flex items-center bg-white border-b border-slate-100 p-4 hover:bg-slate-50 transition-all cursor-pointer relative overflow-hidden`}
      onClick={() => onDrawerOpen(tarea)}
    >
      {/* Indicador de Prioridad (Semáforo) */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${className}`}></div>

      {/* Tipo de Tarea Icono */}
      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center mr-4 border border-slate-200/50 group-hover:scale-105 transition-transform">
        <span className="text-xl">
          {tarea.tipo_tarea === 'MANTENIMIENTO' ? '🛠️' : '🧹'}
        </span>
      </div>

      {/* Info Principal */}
      <div className="flex-1 min-w-[200px]">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-black tracking-tight text-slate-800">
            {tarea.tipo_tarea} {tarea.id_secuencial ? `T-${tarea.id_secuencial}` : ''}
          </span>
          {/* Badge de Origen */}
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200">
             <span className="text-[8px] font-black uppercase tracking-tighter text-slate-500">
               {tarea.fuente_reserva || 'MANUAL'}
             </span>
             {isProtected && <ShieldAlert size={8} className="text-amber-500" />}
          </div>
        </div>
        <div className="flex items-center gap-4 mt-1">
          <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded">
            {tarea.nombre_propiedad || '—'}
          </span>
          <span className="text-[10px] font-medium text-slate-400">
            {tarea.fecha_programada} @ {tarea.hora_inicio?.substring(0, 5) || '11:00'}
          </span>
        </div>
      </div>

      {/* Staff Asignado */}
      <div className="w-48 px-4 border-l border-slate-100 flex items-center gap-3" onClick={e => e.stopPropagation()}>
        <select
          className="bg-transparent text-[11px] font-black text-slate-500 border-none focus:ring-0 p-0 hover:text-blue-600 transition-colors cursor-pointer w-full text-right appearance-none"
          value={tarea.asignado_a || ''}
          onChange={(e) => handleAsignar(tarea.id, e.target.value)}
        >
          <option value="">SIN ASIGNAR</option>
          {staffLimpieza.map(s => (
            <option key={s.id} value={s.id}>{s.nombre.toUpperCase()}</option>
          ))}
        </select>
        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 border border-white shadow-sm shrink-0">
          {tarea.nombre_asignado ? tarea.nombre_asignado.substring(0, 2).toUpperCase() : '?'}
        </div>
      </div>

      {/* Estado Badge Custom V2 */}
      <div className="w-32 flex justify-center">
        <EstadoBadge_V2 estado={tarea.estado} />
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
        <button 
          className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
          onClick={() => handleWhatsApp(tarea.id)}
          title="WhatsApp Staff"
        >
          <MessageCircle size={16} />
        </button>
        
        {/* Registro Huésped */}
        {tarea.reserva_id && (
          <button 
            className="p-2 rounded-lg bg-teal-50 text-teal-600 hover:bg-teal-600 hover:text-white transition-all shadow-sm"
            onClick={(e) => {
              e.stopPropagation();
              const url = `${window.location.origin}/welcome/${tarea.reserva_id}`;
              navigator.clipboard.writeText(url);
              alert("Copiado al portapapeles: Registro de Huésped");
            }}
            title="Copiar Link de Registro (Auto Check-in)"
          >
            <Smartphone size={16} />
          </button>
        )}

        {/* Botón de Pago */}
        <button 
          className={`p-2 rounded-lg transition-all shadow-sm ${
            canApprovePayment 
              ? 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white' 
              : 'bg-slate-50 text-slate-300 cursor-not-allowed opacity-50'
          }`}
          disabled={!canApprovePayment}
          title="Aprobar Pago"
          onClick={() => alert("Aprobando pago para: " + tarea.id)}
        >
          <CreditCard size={16} />
        </button>

        <button 
          className={`p-2 rounded-lg transition-all shadow-sm ${
             'bg-rose-50 text-rose-500 hover:bg-rose-600 hover:text-white'
          }`}
          onClick={() => onDeleteRequest(tarea, isProtected)}
          title={isProtected ? "Requiere Autorización" : "Eliminar"}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

export default TaskRow_V2;
