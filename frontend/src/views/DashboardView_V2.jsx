import React from 'react';
import api from '../services/api';

/**
 * DashboardView_V2 - Premium Summary of Operations.
 * Slate Precision / ClearHost V2: Bento Grid & High-Density Activity.
 */
export default function DashboardView_V2({ stats, data }) {
  const today = new Date().toLocaleDateString('es-ES', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  const kpis = [
    { label: 'Propiedades', val: stats.propiedades, icon: 'domain', color: 'slate', trend: '+2' },
    { label: 'Reservas Activas', val: stats.reservasActivas, icon: 'event_available', color: 'teal', trend: '+15%' },
    { label: 'Tareas Pendientes', val: stats.tareasPendientes, icon: 'pending_actions', color: 'amber', trend: '-3' },
    { label: 'Staff Disponible', val: stats.staffDisponible, icon: 'badge', color: 'blue', trend: 'N/A' }
  ];

  const handleGlobalSync = async () => {
    try {
      await api.post('/sync-ical-all');
      alert('Sincronización global iniciada.');
    } catch (e) {
      console.error("Sync error:", e);
    }
  };

  const getInitials = (name) => {
    if (!name) return "??";
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-[#fcf8fa] min-h-screen font-['Inter']">
      
      {/* 1. Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight font-['Manrope'] capitalize">{today}</h1>
          <p className="text-[11px] font-bold text-slate-400 font-['Manrope'] uppercase tracking-[0.2em] mt-1">Panel de Control Operativo V2</p>
        </div>
        <button 
          onClick={handleGlobalSync}
          className="h-12 px-6 bg-[#0F172A] text-[#3cddc7] font-black text-[10px] uppercase tracking-[0.15em] rounded-xl hover:bg-slate-800 transition-all shadow-xl active:scale-95 flex items-center gap-3 font-['Manrope']"
        >
          <span className="material-symbols-outlined text-sm">sync</span>
          Sincronizar Todo
        </button>
      </div>

      {/* 2. KPI Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col justify-between h-44 group hover:shadow-xl transition-all duration-500 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 duration-300 ${
                kpi.color === 'teal' ? 'bg-teal-50 text-teal-600' : 
                kpi.color === 'amber' ? 'bg-amber-50 text-amber-600' :
                'bg-slate-50 text-slate-600'
              }`}>
                <span className="material-symbols-outlined text-2xl">{kpi.icon}</span>
              </div>
              {kpi.trend !== 'N/A' && (
                <div className={`text-[10px] font-black flex items-center gap-0.5 px-3 py-1 rounded-full ${
                  kpi.trend.includes('+') ? 'text-emerald-500 bg-emerald-50' : 'text-amber-500 bg-amber-50'
                }`}>
                  {kpi.trend} <span className="material-symbols-outlined text-[12px]">{kpi.trend.includes('+') ? 'north_east' : 'south_east'}</span>
                </div>
              )}
            </div>
            <div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2 font-['Manrope']">{kpi.label}</h3>
              <p className="text-4xl font-black text-slate-900 tracking-tighter tabular-nums leading-none">{kpi.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Main Split View */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Recent Tareas - Operational Atelier Style */}
        <div className="xl:col-span-2 bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
           <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-black text-slate-900 font-['Manrope'] tracking-tight">Tareas Operativas hoy</h2>
              <button className="text-teal-600 text-[10px] font-black uppercase tracking-widest hover:underline">Ver todas</button>
           </div>
           
           <div className="space-y-4">
              {data.tareas.slice(0, 5).map(t => (
                <div key={t.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl group hover:bg-slate-100/50 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-teal-400 flex items-center justify-center font-black text-xs border border-slate-800 shadow-md">
                      {t.tipo_tarea?.substring(0,1)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 leading-none">{t.propiedad_nombre || 'Unidad de Limpieza'}</p>
                      <p className="text-[10px] text-slate-400 font-black mt-1 uppercase tracking-widest">{t.fecha_programada} • {t.tipo_tarea?.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${
                      t.estado === 'COMPLETADA' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                      t.estado === 'PENDIENTE' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                      'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {t.estado}
                    </span>
                    <button className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-slate-900 flex items-center justify-center transition-all shadow-sm">
                      <span className="material-symbols-outlined text-sm">more_vert</span>
                    </button>
                  </div>
                </div>
              ))}
              {data.tareas.length === 0 && <p className="text-slate-400 text-sm font-medium italic text-center py-10">Sin tareas programadas para este periodo.</p>}
           </div>
        </div>

        {/* Incoming Reservations */}
        <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <span className="material-symbols-outlined text-8xl text-white">event_upcoming</span>
            </div>
            
            <h2 className="text-xl font-black text-white font-['Manrope'] tracking-tight mb-8 z-10">Próximas Entradas</h2>
            
            <div className="space-y-6 z-10 flex-1">
              {data.reservas.filter(r => r.estado === 'CONFIRMADA').slice(0, 4).map(r => (
                <div key={r.id} className="flex items-center gap-4 group cursor-pointer">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 text-[#3cddc7] flex items-center justify-center font-black text-sm group-hover:scale-110 transition-transform">
                    {getInitials(r.nombre_huesped)}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-bold text-slate-100 leading-none truncate">{r.nombre_huesped}</p>
                    <p className="text-[10px] text-slate-500 font-black mt-1 uppercase tracking-widest truncate">{r.check_in} → {r.check_out}</p>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-800/50 text-slate-400">
                    <span className="material-symbols-outlined text-lg">chevron_right</span>
                  </div>
                </div>
              ))}
              {data.reservas.length === 0 && <p className="text-slate-500 text-sm font-medium italic py-10">No hay entradas confirmadas próximas.</p>}
            </div>

            <button className="mt-8 w-full py-4 bg-[#3cddc7] text-slate-950 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-[#32b9a7] transition-all active:scale-95 shadow-lg shadow-[#3cddc7]/10">
              Ver Calendario Maestro
            </button>
        </div>

      </div>
    </div>
  );
}
