import React, { useState, useEffect } from 'react';
import api, { getBilleteraStaff } from '../services/api';

/**
 * NominaView_V2 - Strategic Human Capital Finances.
 * Slate Precision / ClearHost V2: High-Density & Performance.
 */
export default function NominaView_V2({ staffList = [], onRefresh, showToast, onAction }) {
  const [balances, setBalances] = useState({});
  const [loadingBalances, setLoadingBalances] = useState(false);

  const staffSoloLimpieza = staffList.filter(s => s.rol === 'STAFF');

  const fetchBalances = async () => {
    setLoadingBalances(true);
    const newBalances = {};
    try {
      await Promise.all(staffSoloLimpieza.map(async (s) => {
        const res = await getBilleteraStaff(s.id);
        newBalances[s.id] = res;
      }));
      setBalances(newBalances);
    } catch (err) {
      console.error("Error fetching balances:", err);
    } finally {
      setLoadingBalances(false);
    }
  };

  useEffect(() => {
    fetchBalances();
  }, [staffList]);

  const totalALiquidar = Object.values(balances).reduce((acc, curr) => acc + (curr.saldo_neto || 0), 0);

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-[#fcf8fa] min-h-screen font-['Inter']">
      
      {/* 1. Header & Financial Overview */}
      <div className="flex flex-wrap items-center justify-between gap-6 px-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight font-['Manrope']">Nómina Operativa</h1>
          <p className="text-[11px] font-bold text-slate-400 font-['Manrope'] uppercase tracking-[0.2em] mt-1">Control de Ganancias y Adelantos</p>
        </div>

        <div className="flex items-center gap-4">
           <div className="bg-white border border-slate-200 rounded-2xl px-6 py-3 shadow-sm flex items-center gap-4">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total a Liquidar</p>
                <p className="text-xl font-black text-slate-900 tabular-nums leading-none">${totalALiquidar.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-lg">payments</span>
              </div>
           </div>
           <button 
              onClick={fetchBalances}
              disabled={loadingBalances}
              className="h-11 px-4 bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-all font-bold text-[10px] uppercase tracking-widest flex items-center justify-center"
            >
              <span className={`material-symbols-outlined text-lg ${loadingBalances ? 'animate-spin' : ''}`}>sync</span>
            </button>
        </div>
      </div>

      {/* 2. Payroll Table - Atelier Style */}
      <div className="bg-white rounded-[2.5rem] p-4 shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                  <thead>
                      <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50/50">
                          <th className="pl-10 py-5 rounded-l-2xl">Staff / Miembro</th>
                          <th className="px-6 py-5">Ganado Bruto</th>
                          <th className="px-6 py-5">Adelantos</th>
                          <th className="px-6 py-5">Saldo de Cobro</th>
                          <th className="px-6 py-5">Última Actividad</th>
                          <th className="pr-10 py-5 text-right rounded-r-2xl">Acciones</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                      {staffSoloLimpieza.map(s => {
                          const b = balances[s.id] || { total_ganado: 0, total_adelantos: 0, saldo_neto: 0, moneda: 'MXN' };
                          return (
                              <tr key={s.id} className="hover:bg-slate-50 transition-all duration-300 group">
                                  <td className="pl-10 py-5">
                                      <div className="flex items-center gap-4">
                                          <div className="w-10 h-10 rounded-xl bg-slate-900 text-teal-400 flex items-center justify-center font-black text-xs shadow-md">
                                              {s.nombre.substring(0,2).toUpperCase()}
                                          </div>
                                          <div>
                                              <p className="text-sm font-bold text-slate-900 leading-none">{s.nombre}</p>
                                              <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-widest">{s.email || 'sin email'}</p>
                                          </div>
                                      </div>
                                  </td>
                                  <td className="px-6 py-5 tabular-nums">
                                      <div className="flex items-center gap-1.5 text-emerald-600">
                                          <span className="text-[10px] font-black">+</span>
                                          <span className="text-sm font-black">${b.total_ganado.toLocaleString()}</span>
                                      </div>
                                  </td>
                                  <td className="px-6 py-5 tabular-nums">
                                      <div className="flex items-center gap-1.5 text-rose-600">
                                          <span className="text-[10px] font-black">-</span>
                                          <span className="text-sm font-black">${b.total_adelantos.toLocaleString()}</span>
                                      </div>
                                  </td>
                                  <td className="px-6 py-5 tabular-nums">
                                      <div className="flex flex-col">
                                          <p className="text-lg font-black text-slate-900 leading-none tracking-tighter">${b.saldo_neto.toLocaleString()}</p>
                                          <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-widest">{b.moneda}</p>
                                      </div>
                                  </td>
                                  <td className="px-6 py-5">
                                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">
                                        {s.ultimo_login ? new Date(s.ultimo_login).toLocaleDateString() : 'no registrado'}
                                      </p>
                                  </td>
                                  <td className="pr-10 py-5 text-right">
                                      <div className="flex justify-end gap-2">
                                          <button 
                                              onClick={() => onAction({ type: 'adelanto', edit: { staff_id: s.id, moneda: b.moneda } })}
                                              className="h-10 px-4 bg-teal-50 text-teal-700 hover:bg-teal-600 hover:text-white rounded-xl transition-all flex items-center justify-center gap-2 border border-teal-100 shadow-sm text-[9px] font-black uppercase tracking-widest"
                                          >
                                              <span className="material-symbols-outlined text-sm">payments</span>
                                              Pago / Adelanto
                                          </button>
                                      </div>
                                  </td>
                              </tr>
                          );
                      })}
                      {staffSoloLimpieza.length === 0 && (
                        <tr>
                          <td colSpan="6" className="py-20 text-center">
                            <p className="text-slate-400 font-medium italic">No hay personal de staff con registros financieros.</p>
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
