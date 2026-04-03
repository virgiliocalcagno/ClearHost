import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Trash2, X, Fingerprint, Lock } from 'lucide-react';

/**
 * EliteAuditModal - Protocolo de Seguridad para Borrado de Tareas iCal
 * Solo accesible para SUPER_ADMIN. Requiere motivo obligatorio.
 */
const EliteAuditModal = ({ isOpen, onClose, onConfirm, task, userRole }) => {
  const [reason, setReason] = useState('');
  const [authName, setAuthName] = useState('');
  const isSuperAdmin = userRole === 'SUPER_ADMIN';

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!isSuperAdmin) return;
    if (!reason.trim() || !authName.trim()) {
      alert("Firma y Motivo son obligatorios para el protocolo de seguridad.");
      return;
    }
    onConfirm(task.id, { reason, authName });
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200"
        >
          {/* Header Peligro */}
          <div className="bg-rose-600 p-8 text-white relative">
            <ShieldAlert size={48} className="mb-4 opacity-50 absolute right-8 top-8" />
            <div className="flex items-center gap-3 mb-2">
              <Lock size={16} className="text-rose-200" />
              <span className="text-[10px] font-black tracking-[0.3em] uppercase text-rose-100">Protocolo de Seguridad Elite</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight leading-none mb-2">
              AUTORIZACIÓN CRÍTICA
            </h2>
            <p className="text-rose-100 text-xs font-medium opacity-80 uppercase tracking-widest">
              TAREA T-{task.id_secuencial || 'ID'} • ORIGEN: {task.fuente_reserva || 'EXTERNAL'}
            </p>
          </div>

          <div className="p-8">
            {!isSuperAdmin ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100 uppercase font-black text-xl">!</div>
                <h3 className="text-slate-900 font-black text-lg mb-2 uppercase tracking-tight">Acceso Denegado</h3>
                <p className="text-slate-500 text-[11px] leading-relaxed uppercase tracking-tighter">
                  Esta acción requiere permisos de <b>Administrador de Nivel Maestro</b>. <br/>
                  Tu nivel actual ({userRole}) no está autorizado para eliminar registros iCal.
                </p>
                <button 
                  onClick={onClose}
                  className="mt-8 w-full py-4 rounded-2xl bg-slate-100 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Entendido
                </button>
              </div>
            ) : (
              <>
                <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest mb-6 leading-relaxed">
                  Estás a punto de forzar el eliminado de una tarea vinculada a un canal externo. Esta acción es <span className="text-rose-600">irreversible</span> y debe estar justificada.
                </p>

                <div className="space-y-6">
                  {/* Firma de Admin */}
                  <div>
                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                       <Fingerprint size={12} /> Firma del Administrador
                    </label>
                    <input 
                      type="text"
                      placeholder="ESCRIBE TU NOMBRE COMPLETO"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-widest focus:ring-2 focus:ring-rose-500 focus:outline-none transition-all"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                    />
                  </div>

                  {/* Motivo */}
                  <div>
                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                       <Trash2 size={12} /> Motivo de la Eliminación
                    </label>
                    <textarea 
                      placeholder="EXPLICA DETALLADAMENTE POR QUÉ SE ELIMINA ESTA TAREA"
                      className="w-full min-h-[120px] bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none transition-all resize-none"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-4 mt-8">
                  <button 
                    onClick={onClose}
                    className="flex-1 py-4 rounded-2xl bg-slate-100 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleConfirm}
                    className="flex-1 py-4 rounded-2xl bg-rose-600 text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-rose-200 hover:bg-rose-700 active:scale-95 transition-all"
                  >
                    Confirmar Borrado
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EliteAuditModal;
