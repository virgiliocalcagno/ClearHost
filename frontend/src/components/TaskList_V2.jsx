import React, { useState } from 'react';
import TaskRow_V2 from './TaskRow_V2';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, CheckSquare, BadgeCheck, Phone, MapPin, Calendar, Clock } from 'lucide-react';
import EliteAuditModal from './EliteAuditModal';
import { getStoredStaff } from '../services/api';

/**
 * TaskList_V2 - Módulo de inventario de tareas de alta densidad.
 * Incluye Drawer de Auditoría y Modal de Autorización Especial.
 */
const TaskList_V2 = ({ 
  data = [], 
  propiedades = [], 
  staffLimpieza = [], 
  handleAsignar, 
  handleWhatsApp,
  onRefresh,
  onDelete // Función real de borrado
}) => {
  const [selectedTask, setSelectedTask] = useState(null);
  const [auditModal, setAuditModal] = useState({ show: false, task: null });
  const currentUser = getStoredStaff();
  const userRole = currentUser?.rol || 'STAFF';

  const handleDeleteRequest = (task, isProtected) => {
    if (isProtected) {
      setAuditModal({ show: true, task });
    } else {
      if (window.confirm(`¿Seguro que deseas eliminar la tarea manual T-${task.id_secuencial}?`)) {
        onDelete(task.id);
      }
    }
  };

  const handleAuditConfirm = async (taskId, auditData) => {
    // Aquí se llamaría a la API con los datos de auditoría
    // Por ahora, procedemos con el borrado y logueamos
    console.log(`[AUDIT] Borrado autorizado de Tarea ${taskId} por ${auditData.authName}. Motivo: ${auditData.reason}`);
    onDelete(taskId, auditData);
    setAuditModal({ show: false, task: null });
  };


  return (
    <div className="task-inventory rounded-3xl bg-white shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden">
      
      {/* Listado de Cabecera (Sticky) */}
      <div className="bg-slate-50/50 backdrop-blur-xl border-b border-slate-100 px-6 py-3 flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
        <div className="w-14">Tipo</div>
        <div className="flex-1">Información de Tarea & Origen</div>
        <div className="w-48 text-right pr-12">Staff Responsable</div>
        <div className="w-32 text-center">Estado Operativo</div>
        <div className="w-40 text-right">Acciones Pro</div>
      </div>

      <div className="task-rows divide-y divide-slate-50">
        {data.map(t => (
          <TaskRow_V2 
            key={t.id} 
            tarea={t} 
            onDrawerOpen={setSelectedTask}
            onDeleteRequest={handleDeleteRequest}
            handleAsignar={handleAsignar}
            handleWhatsApp={handleWhatsApp}
            staffLimpieza={staffLimpieza}
            onRefresh={onRefresh}
          />
        ))}

        {data.length === 0 && (
          <div className="p-20 text-center text-slate-300 font-bold uppercase tracking-widest text-[11px]">
            No hay registros en el inventario actual
          </div>
        )}
      </div>

      {/* DRAWER DE AUDITORÍA TÉCNICA */}
      <AnimatePresence>
        {selectedTask && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTask(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-[450px] bg-white shadow-2xl z-[101] flex flex-col pt-10"
            >
              <div className="px-8 flex justify-between items-center mb-8">
                 <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                    <BadgeCheck className="text-blue-500" /> Auditoría Técnica
                 </h2>
                 <button onClick={() => setSelectedTask(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <X size={20} className="text-slate-400" />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto px-8 space-y-8 pb-20">
                {/* Header Contexto */}
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                   <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Detalles de Operación</div>
                   <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm font-black">
                        <MapPin size={16} className="text-blue-400" /> {selectedTask.nombre_propiedad}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 font-bold">
                        <Calendar size={14} /> {selectedTask.fecha_programada}
                        <Clock size={14} className="ml-2" /> {selectedTask.hora_inicio?.substring(0, 5)}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 font-bold">
                        <Phone size={14} /> Staff: {selectedTask.nombre_asignado || 'Sin asignar'}
                      </div>
                   </div>
                </div>

                {/* Evidencia Fotográfica */}
                <div>
                   <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                        <Camera size={16} className="text-blue-500" /> Fotos de Evidencia
                      </h3>
                      <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded font-black">
                        {((selectedTask.fotos_antes?.length || 0) + (selectedTask.fotos_despues?.length || 0))} ARCHIVOS
                      </span>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase">Antes (Check-out)</p>
                        <div className="aspect-square bg-slate-100 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-100 italic text-[10px] text-slate-400">
                          {selectedTask.fotos_antes?.[0] ? (
                            <img src={selectedTask.fotos_antes[0].url} alt="Antes" className="w-full h-full object-cover" />
                          ) : 'Sin evidencia'}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase">Después (Ready)</p>
                        <div className="aspect-square bg-slate-100 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-100 italic text-[10px] text-slate-400">
                           {selectedTask.fotos_despues?.[0] ? (
                            <img src={selectedTask.fotos_despues[0].url} alt="Después" className="w-full h-full object-cover" />
                          ) : 'En proceso'}
                        </div>
                      </div>
                   </div>
                </div>

                {/* Checklist de Control */}
                <div>
                   <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 mb-4">
                      <CheckSquare size={16} className="text-blue-500" /> Checklist de Verificación
                   </h3>
                   <div className="bg-slate-50 rounded-2xl border border-slate-100 divide-y divide-slate-200/50">
                      {(selectedTask.checklist || []).map((item, idx) => (
                        <div key={idx} className="p-4 flex items-center justify-between">
                           <span className="text-xs font-bold text-slate-600">{item.item}</span>
                           <div className={`w-5 h-5 rounded-md flex items-center justify-center ${item.completado ? 'bg-emerald-500 text-white' : 'bg-slate-200'}`}>
                              {item.completado && <X size={12} className="rotate-45" />}
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* PROTOCOLO DE AUDITORÍA ELITE (Sacred iCal) */}
      <EliteAuditModal 
        isOpen={auditModal.show}
        onClose={() => setAuditModal({ show: false, task: null })}
        onConfirm={handleAuditConfirm}
        task={auditModal.task || {}}
        userRole={userRole}
      />

    </div>
  );
};

export default TaskList_V2;
