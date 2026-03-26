import React, { useState, useMemo } from 'react';
import api from '../services/api';

/**
 * MantenimientoView_V2 - Technical Incidents & Repair Management.
 * Slate Precision / ClearHost V2: High-Density & Performance.
 */
export default function MantenimientoView_V2({ data = [], propiedades = [], onRefresh, showToast, onAction }) {
  const [filtroPropiedad, setFiltroPropiedad] = useState('');

  const filteredData = useMemo(() => {
    return filtroPropiedad ? data.filter(i => i.propiedad_id === filtroPropiedad) : data;
  }, [data, filtroPropiedad]);

  const handleUpdateEstado = async (id, nuevoEstado) => {
    try {
      await api.put(`/incidencias/${id}`, { estado: nuevoEstado });
      if (showToast) showToast('Estado de incidencia actualizado', 'success');
      onRefresh();
    } catch (e) {
      if (showToast) showToast('Error al actualizar estado', 'error');
    }
  };

  const copyLink = (token) => {
    const link = `${window.location.origin}/reparacion/aprobar/${token}`;
    navigator.clipboard.writeText(link);
    if (showToast) showToast('Link de aprobación copiado', 'info');
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-[#fcf8fa] min-h-screen font-['Inter']">
      
      {/* 1. Header & Quick Filter */}
      <div className="flex flex-wrap items-center justify-between gap-6 px-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight font-['Manrope']">Mantenimiento</h1>
          <p className="text-[11px] font-bold text-slate-400 font-['Manrope'] uppercase tracking-[0.2em] mt-1">Control de Incidencias y Reparaciones</p>
        </div>

        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 px-4 h-11 bg-white border border-slate-200 rounded-xl shadow-sm">
              <span className="material-symbols-outlined text-slate-400 text-lg">filter_alt</span>
              <select 
                value={filtroPropiedad} 
                onChange={e => setFiltroPropiedad(e.target.value)}
                className="bg-transparent border-none text-[10px] font-black text-slate-700 focus:ring-0 outline-none uppercase tracking-widest"
              >
                <option value="">Todas las propiedades</option>
                {propiedades.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
           </div>
           <button 
              onClick={() => onAction({ type: 'incidencia' })}
              className="h-11 px-6 bg-[#0F172A] text-[#3cddc7] font-black text-[10px] uppercase tracking-[0.15em] rounded-xl hover:bg-slate-800 transition-all shadow-xl active:scale-95 flex items-center gap-3 font-['Manrope']"
            >
              <span className="material-symbols-outlined text-sm">report_problem</span>
              Reportar Daño
            </button>
        </div>
      </div>

      {/* 2. Incidents Table - Atelier Style */}
      <div className="bg-white rounded-[2.5rem] p-4 shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                  <thead>
                      <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50/50">
                          <th className="pl-10 py-5 rounded-l-2xl">Incidencia / Ficha</th>
                          <th className="px-6 py-5">Propiedad</th>
                          <th className="px-6 py-5">Urgencia</th>
                          <th className="px-6 py-5">Estado</th>
                          <th className="px-6 py-5">Presupuesto</th>
                          <th className="pr-10 py-5 text-right rounded-r-2xl">Acciones</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                      {filteredData.map(i => (
                          <tr key={i.id} className="hover:bg-slate-50 transition-all duration-300 group">
                              <td className="pl-10 py-5">
                                  <div className="flex items-center gap-4">
                                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-[10px] border shadow-md transition-transform group-hover:scale-105 ${
                                        i.urgente ? 'bg-rose-900 text-white border-rose-800' : 'bg-slate-900 text-teal-400 border-slate-800'
                                      }`}>
                                          {i.id.toString().substring(0,3)}
                                      </div>
                                      <div>
                                          <p className="text-sm font-bold text-slate-900 leading-none">{i.titulo}</p>
                                          <p className="text-[10px] text-slate-400 font-black mt-1 uppercase tracking-widest truncate max-w-[200px]">{i.descripcion}</p>
                                      </div>
                                  </div>
                              </td>
                              <td className="px-6 py-5">
                                  <p className="text-sm font-bold text-slate-700 leading-none uppercase tracking-tight">{i.nombre_propiedad || '—'}</p>
                                  <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">{i.tipo || 'General'}</p>
                              </td>
                              <td className="px-6 py-5">
                                  {i.urgente ? (
                                    <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-100 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1 w-fit animate-pulse">
                                      <span className="material-symbols-outlined text-[12px]">bolt</span>
                                      Urgente
                                    </span>
                                  ) : (
                                    <span className="px-2.5 py-1 bg-slate-50 text-slate-400 border border-slate-100 rounded-lg text-[9px] font-black uppercase tracking-widest w-fit">
                                      Normal
                                    </span>
                                  )}
                              </td>
                              <td className="px-6 py-5">
                                  <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${
                                      i.estado === 'COMPLETADO' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                                      i.estado === 'APROBADO' ? 'bg-teal-50 text-teal-700 border-teal-100' : 
                                      'bg-amber-50 text-amber-700 border-amber-100'
                                  }`}>
                                      {i.estado}
                                  </span>
                              </td>
                              <td className="px-6 py-5 tabular-nums">
                                  <p className="text-sm font-black text-slate-900 leading-none">${i.costo_estimado || '0'}</p>
                                  <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-widest">USD</p>
                              </td>
                              <td className="pr-10 py-5 text-right">
                                  <div className="flex justify-end gap-2">
                                      {i.token_aprobacion && i.estado === 'PENDIENTE' && (
                                          <button 
                                              onClick={() => copyLink(i.token_aprobacion)}
                                              className="h-10 px-4 bg-white text-slate-600 hover:bg-slate-900 hover:text-white rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-200 shadow-sm text-[9px] font-black uppercase tracking-widest"
                                          >
                                              <span className="material-symbols-outlined text-sm">link</span>
                                              Link Dueño
                                          </button>
                                      )}
                                      {i.estado === 'PENDIENTE' && (
                                          <button 
                                              onClick={() => handleUpdateEstado(i.id, 'ENVIADO_A_DUENO')}
                                              className="h-10 px-4 bg-teal-600 text-white hover:bg-teal-700 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-600/20 text-[9px] font-black uppercase tracking-widest border border-teal-500"
                                          >
                                              <span className="material-symbols-outlined text-sm">send</span>
                                              Enviar
                                          </button>
                                      )}
                                      {i.estado === 'APROBADO' && (
                                          <button 
                                              onClick={() => handleUpdateEstado(i.id, 'COMPLETADO')}
                                              className="h-10 px-4 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 text-[9px] font-black uppercase tracking-widest border border-emerald-500"
                                          >
                                              <span className="material-symbols-outlined text-sm">check_circle</span>
                                              Finalizar
                                          </button>
                                      )}
                                  </div>
                              </td>
                          </tr>
                      ))}
                      {filteredData.length === 0 && (
                        <tr>
                          <td colSpan="6" className="py-20 text-center">
                            <p className="text-slate-400 font-medium italic">No hay incidencias registradas en este momento.</p>
                          </td>
                        </tr>
                      )}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
}
