import React, { useMemo } from 'react';
import api from '../services/api';

/**
 * StaffView_V2 - Premium Team Management.
 * Slate Precision / ClearHost V2: High-Density & Performance.
 */
export default function StaffView_V2({ data = [], onAction, onRefresh, showToast }) {
  
  const actualizarStaff = async (id, payload) => {
    try {
      await api.put(`/staff/${id}`, payload);
      if (showToast) showToast('Estado del staff actualizado', 'success');
      onRefresh();
    } catch (e) {
      if (showToast) showToast('Error al actualizar staff', 'error');
    }
  };

  const getInitials = (name) => {
    if (!name) return "??";
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const rolInfo = {
    SUPER_ADMIN: { label: 'Admin', color: 'bg-indigo-50 text-indigo-700', icon: 'shield_person' },
    MANAGER_LOCAL: { label: 'Manager', color: 'bg-blue-50 text-blue-700', icon: 'location_on' },
    STAFF: { label: 'Operativo', color: 'bg-slate-50 text-slate-600', icon: 'handyman' },
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-[#fcf8fa] min-h-screen font-['Inter']">
      
      {/* 1. Header Section */}
      <div className="flex justify-between items-center px-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight font-['Manrope']">Gestión de Staff</h1>
          <p className="text-[11px] font-bold text-slate-400 font-['Manrope'] uppercase tracking-[0.2em] mt-1">Equipo Operativo y Administrativo</p>
        </div>
        <button 
          onClick={() => onAction({ type: 'staff' })}
          className="h-12 px-6 bg-[#0F172A] text-[#3cddc7] font-black text-[10px] uppercase tracking-[0.15em] rounded-xl hover:bg-slate-800 transition-all shadow-xl active:scale-95 flex items-center gap-3 font-['Manrope']"
        >
          <span className="material-symbols-outlined text-sm">add_circle</span>
          Nuevo Miembro
        </button>
      </div>

      {/* 2. Team Table - Atelier Style */}
      <div className="bg-white rounded-[2.5rem] p-4 shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                  <thead>
                      <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50/50">
                          <th className="pl-10 py-5 rounded-l-2xl">Miembro</th>
                          <th className="px-6 py-5">Contacto / Identidad</th>
                          <th className="px-6 py-5">Rol</th>
                          <th className="px-6 py-5">Estado</th>
                          <th className="pr-10 py-5 text-right rounded-r-2xl">Acciones</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                      {data.map(s => {
                          const rol = rolInfo[s.rol] || rolInfo.STAFF;
                          return (
                              <tr key={s.id} className="hover:bg-slate-50 transition-all duration-300 group">
                                  <td className="pl-10 py-5">
                                      <div className="flex items-center gap-4">
                                          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-[#3cddc7] flex items-center justify-center font-black text-xs border border-slate-800 shadow-md">
                                              {getInitials(s.nombre)}
                                          </div>
                                          <div>
                                              <p className="text-sm font-bold text-slate-900 leading-none">{s.nombre}</p>
                                              <p className="text-[10px] text-slate-400 font-black mt-1 uppercase tracking-widest">ID: {s.documento || '—'}</p>
                                          </div>
                                      </div>
                                  </td>
                                  <td className="px-6 py-5">
                                      <div className="flex flex-col">
                                          <p className="text-sm font-bold text-slate-700 leading-none tabular-nums">{s.telefono || '—'}</p>
                                          <p className="text-[10px] text-slate-400 font-bold mt-1 lowercase tracking-tight">{s.email || 'sin email'}</p>
                                      </div>
                                  </td>
                                  <td className="px-6 py-5">
                                      <div className="flex items-center gap-2">
                                          <span className="material-symbols-outlined text-lg text-slate-400">{rol.icon}</span>
                                          <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${rol.color}`}>
                                              {rol.label}
                                          </span>
                                      </div>
                                  </td>
                                  <td className="px-6 py-5">
                                      <button 
                                        onClick={() => actualizarStaff(s.id, { disponible: !s.disponible })}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all font-black text-[9px] uppercase tracking-widest ${
                                          s.disponible 
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100' 
                                            : 'bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100'
                                        }`}
                                      >
                                        <div className={`w-1.5 h-1.5 rounded-full ${s.disponible ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`}></div>
                                        {s.disponible ? 'Disponible' : 'No Disponible'}
                                      </button>
                                  </td>
                                  <td className="pr-10 py-5 text-right">
                                      <div className="flex justify-end gap-2">
                                          <button 
                                              onClick={() => onAction({ type: 'staff-edit', edit: s })}
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
                          <td colSpan="5" className="py-20 text-center">
                            <p className="text-slate-400 font-medium italic">No hay miembros registrados en el staff.</p>
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
