import React from 'react';

/**
 * LiquidacionView_V2 - Strategic Financial Partners.
 * Slate Precision / ClearHost V2: High-Density & Performance.
 */
export default function LiquidacionView_V2({ gastos = [], propiedades = [], onRefresh, showToast, onAction }) {
  
  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-[#fcf8fa] min-h-screen font-['Inter']">
      
      {/* 1. Header & Actions */}
      <div className="flex justify-between items-center px-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight font-['Manrope']">Liquidación</h1>
          <p className="text-[11px] font-bold text-slate-400 font-['Manrope'] uppercase tracking-[0.2em] mt-1">Control Financiero y Gastos de Operación</p>
        </div>
        <button 
          onClick={() => onAction({ type: 'gasto' })}
          className="h-12 px-6 bg-[#0F172A] text-[#3cddc7] font-black text-[10px] uppercase tracking-[0.15em] rounded-xl hover:bg-slate-800 transition-all shadow-xl active:scale-95 flex items-center gap-3 font-['Manrope']"
        >
          <span className="material-symbols-outlined text-sm">receipt_long</span>
          Registrar Gasto
        </button>
      </div>

      {/* 2. Expenses Table - Atelier Style */}
      <div className="bg-white rounded-[2.5rem] p-4 shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                  <thead>
                      <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50/50">
                          <th className="pl-10 py-5 rounded-l-2xl">Fecha / Ref</th>
                          <th className="px-6 py-5">Propiedad</th>
                          <th className="px-6 py-5">Monto</th>
                          <th className="px-6 py-5">Categoría</th>
                          <th className="pr-10 py-5 text-right rounded-r-2xl">Acciones</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                      {gastos.map(g => {
                          const p = propiedades.find(prop => prop.id === g.propiedad_id);
                          return (
                              <tr key={g.id} className="hover:bg-slate-50 transition-all duration-300 group">
                                  <td className="pl-10 py-5">
                                      <div className="flex flex-col">
                                          <p className="text-sm font-black text-slate-900 leading-none tabular-nums">{g.fecha}</p>
                                          <p className="text-[9px] text-slate-400 font-black mt-1 uppercase tracking-widest">ID: {g.id.toString().substring(0,6)}</p>
                                      </div>
                                  </td>
                                  <td className="px-6 py-5">
                                      <p className="text-sm font-bold text-slate-700 leading-none uppercase tracking-tight">{p?.nombre || 'General'}</p>
                                      <p className="text-[9px] text-teal-600 font-bold mt-1 uppercase tracking-widest">{p?.ciudad || '—'}</p>
                                  </td>
                                  <td className="px-6 py-5">
                                      <p className="text-base font-black text-slate-900 leading-none tabular-nums">${g.monto.toLocaleString()}</p>
                                      <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-widest">{g.moneda || 'MXN'}</p>
                                  </td>
                                  <td className="px-6 py-5">
                                      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-200">
                                          {g.categoria_cargo || 'General'}
                                      </span>
                                  </td>
                                  <td className="pr-10 py-5 text-right">
                                      <div className="flex justify-end gap-2">
                                          {g.comprobante_url && (
                                              <a 
                                                  href={g.comprobante_url} 
                                                  target="_blank" 
                                                  rel="noreferrer"
                                                  className="h-10 px-4 bg-teal-50 text-teal-700 hover:bg-teal-600 hover:text-white rounded-xl transition-all flex items-center justify-center gap-2 border border-teal-100 shadow-sm text-[9px] font-black uppercase tracking-widest"
                                              >
                                                  <span className="material-symbols-outlined text-sm">attach_file</span>
                                                  Recibo
                                              </a>
                                          )}
                                          <button 
                                              onClick={() => onAction({ type: 'gasto', edit: g })}
                                              className="w-10 h-10 bg-white text-slate-400 hover:bg-slate-900 hover:text-white rounded-xl transition-all flex items-center justify-center border border-slate-100 shadow-sm"
                                          >
                                              <span className="material-symbols-outlined text-lg">edit</span>
                                          </button>
                                      </div>
                                  </td>
                              </tr>
                          );
                      })}
                      {gastos.length === 0 && (
                        <tr>
                          <td colSpan="5" className="py-20 text-center">
                            <p className="text-slate-400 font-medium italic">No hay gastos registrados en este periodo.</p>
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
