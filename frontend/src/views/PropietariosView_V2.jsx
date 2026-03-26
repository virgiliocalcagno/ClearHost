import React from 'react';

/**
 * PropietariosView_V2 - Strategic Partner Management.
 * Slate Precision / ClearHost V2: High-Density & Performance.
 */
export default function PropietariosView_V2({ data = [], propiedades = [], onAction, onRefresh, showToast, navigate }) {
  
  const getInitials = (name) => {
    if (!name) return "??";
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-[#fcf8fa] min-h-screen font-['Inter']">
      
      {/* 1. Header Section */}
      <div className="flex justify-between items-center px-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight font-['Manrope']">Propietarios</h1>
          <p className="text-[11px] font-bold text-slate-400 font-['Manrope'] uppercase tracking-[0.2em] mt-1">Gestión de Socios y Activos</p>
        </div>
        <button 
          onClick={() => onAction({ type: 'propietario' })}
          className="h-12 px-6 bg-[#0F172A] text-[#3cddc7] font-black text-[10px] uppercase tracking-[0.15em] rounded-xl hover:bg-slate-800 transition-all shadow-xl active:scale-95 flex items-center gap-3 font-['Manrope']"
        >
          <span className="material-symbols-outlined text-sm">handshake</span>
          Nuevo Propietario
        </button>
      </div>

      {/* 2. Partners Table - Atelier Style */}
      <div className="bg-white rounded-[2.5rem] p-4 shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                  <thead>
                      <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50/50">
                          <th className="pl-10 py-5 rounded-l-2xl">Propietario</th>
                          <th className="px-6 py-5">Contacto Principal</th>
                          <th className="px-6 py-5">Propiedades Vinculadas</th>
                          <th className="pr-10 py-5 text-right rounded-r-2xl">Acciones</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                      {data.map(owner => {
                          const props = propiedades.filter(pr => pr.propietario_id === owner.id);
                          return (
                              <tr key={owner.id} className="hover:bg-slate-50 transition-all duration-300 group">
                                  <td className="pl-10 py-5">
                                      <div className="flex items-center gap-4">
                                          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-teal-400 flex items-center justify-center font-black text-xs border border-slate-800 shadow-md">
                                              {getInitials(owner.nombre)}
                                          </div>
                                          <div>
                                              <p className="text-sm font-bold text-slate-900 leading-none">{owner.nombre}</p>
                                              <p className="text-[10px] text-slate-400 font-black mt-1 uppercase tracking-widest">Socio Estratégico</p>
                                          </div>
                                      </div>
                                  </td>
                                  <td className="px-6 py-5">
                                      <div className="flex flex-col">
                                          <p className="text-sm font-bold text-slate-700 leading-none tabular-nums">{owner.email || '—'}</p>
                                          <p className="text-[10px] text-slate-400 font-bold mt-1 tracking-tight">{owner.telefono || '—'}</p>
                                      </div>
                                  </td>
                                  <td className="px-6 py-5">
                                      <div className="flex flex-wrap gap-2 max-w-[280px]">
                                          {props.map(pr => (
                                              <span key={pr.id} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-black uppercase tracking-widest border border-slate-200">
                                                  {pr.nombre_corto || pr.nombre?.substring(0, 8)}
                                              </span>
                                          ))}
                                          {props.length === 0 && <span className="text-[10px] text-slate-300 italic font-bold">Sin propiedades</span>}
                                      </div>
                                  </td>
                                  <td className="pr-10 py-5 text-right">
                                      <div className="flex justify-end gap-2">
                                          <button 
                                              onClick={() => navigate(`/propietario/${owner.id}/dashboard`)}
                                              className="h-10 px-4 bg-teal-50 text-teal-700 hover:bg-teal-600 hover:text-white rounded-xl transition-all flex items-center justify-center gap-2 border border-teal-100 shadow-sm text-[9px] font-black uppercase tracking-widest"
                                          >
                                              <span className="material-symbols-outlined text-sm">analytics</span>
                                              Reportes
                                          </button>
                                          <button 
                                              onClick={() => onAction({ type: 'propietario', edit: owner })}
                                              className="w-10 h-10 bg-white text-slate-400 hover:bg-slate-900 hover:text-white rounded-xl transition-all flex items-center justify-center border border-slate-100 shadow-sm"
                                          >
                                              <span className="material-symbols-outlined text-lg">edit</span>
                                          </button>
                                      </div>
                                  </td>
                              </tr>
                          );
                      })}
                      {data.length === 0 && (
                        <tr>
                          <td colSpan="4" className="py-20 text-center">
                            <p className="text-slate-400 font-medium italic">No hay propietarios registrados.</p>
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
