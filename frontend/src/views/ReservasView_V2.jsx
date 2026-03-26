import React, { useState, useMemo } from 'react';

/**
 * ReservasView_V2 - Master Container for Guest Reservations.
 * Slate Precision / ClearHost V2: Tonal Layering & High Density.
 */
export function ReservasView_V2({ data = [], propiedades = [], onAction, onRefresh, showToast }) {
  const [activeTab, setActiveTab] = useState('Listado'); // 'Listado', '7D', '30D'
  const [baseDate, setBaseDate] = useState(new Date());

  const stats = useMemo(() => {
    const total = data.length;
    const active = data.filter(r => r.estado === 'CONFIRMADA' || r.estado === 'CHECK-IN').length;
    const canceled = data.filter(r => r.estado === 'CANCELADA').length;
    const totalNights = data.reduce((acc, r) => {
        const start = new Date(r.check_in);
        const end = new Date(r.check_out);
        const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        return acc + (diffDays > 0 ? diffDays : 0);
    }, 0);
    return { total, active, canceled, totalNights };
  }, [data]);

  const handlePrevDate = () => {
    const d = new Date(baseDate);
    if (activeTab === '7D') d.setDate(d.getDate() - 7);
    else if (activeTab === '30D') d.setMonth(d.getMonth() - 1);
    setBaseDate(d);
  };

  const handleNextDate = () => {
    const d = new Date(baseDate);
    if (activeTab === '7D') d.setDate(d.getDate() + 7);
    else if (activeTab === '30D') d.setMonth(d.getMonth() + 1);
    setBaseDate(d);
  };

  const getInitials = (name) => {
    if (!name) return "??";
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className={`min-h-screen ${activeTab === 'Listado' ? 'bg-[#fcf8fa]' : 'bg-transparent'} p-2 transition-colors duration-500 font-['Inter']`}>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* 1. Master Header */}
        <div className="flex flex-wrap items-center justify-between gap-6 px-4">
          <div>
            <h1 className="text-slate-900 text-3xl font-black tracking-tight font-['Manrope']">Reservas y Estadías</h1>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Gestión operativa del inventario</p>
          </div>

          {/* Tab Switcher - Advanced Pill */}
          <div className="flex bg-slate-200/50 p-1 rounded-2xl backdrop-blur-sm border border-slate-200/50 shadow-sm">
            {['Listado', '7D', '30D'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 font-['Manrope'] ${
                  activeTab === tab 
                  ? 'bg-white text-[#0d9488] shadow-sm transform scale-[1.02]' 
                  : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab === '7D' ? 'Vista Semanal' : tab === '30D' ? 'Vista Mensual' : tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
             <button 
              onClick={onRefresh}
              className="flex items-center gap-2 px-4 h-11 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all font-['Manrope'] text-[10px] font-bold uppercase tracking-widest text-slate-500 active:scale-95 shadow-sm"
            >
              <span className="material-symbols-outlined text-lg">sync_alt</span>
              Actualizar
            </button>
            <button 
              onClick={() => onAction({ type: 'reserva', edit: null })}
              className="h-11 px-6 bg-[#0d9488] text-white font-black text-[10px] uppercase tracking-[0.15em] rounded-xl hover:bg-[#0b7a70] transition-all shadow-lg shadow-[#0d9488]/20 active:scale-95 flex items-center gap-3 font-['Manrope']"
            >
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
              Nueva Reserva
            </button>
          </div>
        </div>

        {/* 2. Listado View (Atelier Refactor) */}
        {activeTab === 'Listado' && (
          <div className="space-y-8 px-4">
            {/* Bento Grid Stats - Tonal Layering */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Reservas Activas', val: stats.active, icon: 'analytics', color: 'teal', trend: '+12%' },
                { label: 'Check-ins Hoy', val: '0', icon: 'login', color: 'blue', trend: 'N/A' },
                { label: 'Ocupación Media', val: '84%', icon: 'dashboard', color: 'slate', trend: '+4%' },
                { label: 'Ingresos Brutos', val: '$1.2M', icon: 'payments', color: 'emerald', trend: '+18%' }
              ].map((s, idx) => (
                <div key={idx} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col justify-between h-40 group hover:shadow-xl transition-all duration-500 relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div className={`p-3 rounded-2xl ${s.color === 'teal' ? 'bg-teal-50 text-teal-600' : 'bg-slate-50 text-slate-600'} transition-colors group-hover:scale-110 duration-300`}>
                      <span className="material-symbols-outlined text-2xl">{s.icon}</span>
                    </div>
                    {s.trend !== 'N/A' && (
                      <div className={`text-[10px] font-black ${s.color === 'teal' ? 'text-teal-500 bg-teal-50' : 'text-slate-500 bg-slate-50'} flex items-center gap-0.5 px-2 py-1 rounded-full`}>
                        {s.trend} <span className="material-symbols-outlined text-[12px]">north_east</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2 font-['Manrope']">{s.label}</h3>
                    <p className="text-3xl font-black text-slate-900 tracking-tighter font-['Inter']">{s.val}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* High-Density Data Table - "The Technical Atelier" style */}
            <div className="bg-white rounded-[2.5rem] p-4 shadow-sm border border-slate-100 overflow-hidden">
                <div className="flex justify-between items-center mb-6 px-6 pt-4">
                  <h2 className="text-lg font-black text-slate-900 font-['Manrope'] tracking-tight">Listado Maestro de Reservas</h2>
                  <div className="flex gap-2">
                    <button className="px-5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all font-['Manrope'] flex items-center gap-2 active:scale-95">
                      <span className="material-symbols-outlined text-sm">filter_list</span> Filtrar
                    </button>
                    <button className="px-5 py-2.5 bg-teal-50 border border-teal-100 rounded-xl text-[10px] font-bold uppercase tracking-widest text-[#0d9488] hover:bg-teal-100 transition-all font-['Manrope'] flex items-center gap-2 active:scale-95">
                      <span className="material-symbols-outlined text-sm">share</span> Exportar
                    </button>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse font-['Inter']">
                        <thead>
                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50/50">
                                <th className="pl-10 py-5 rounded-l-2xl">Huésped</th>
                                <th className="px-6 py-5">Propiedad</th>
                                <th className="px-6 py-5">Estadía</th>
                                <th className="px-6 py-5">Pax</th>
                                <th className="px-6 py-5">Estado / Canal</th>
                                <th className="pr-10 py-5 text-right rounded-r-2xl">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {data.map(r => {
                                const nights = Math.ceil((new Date(r.check_out) - new Date(r.check_in)) / (1000 * 60 * 60 * 24));
                                return (
                                    <tr key={r.id} className="hover:bg-slate-50/80 transition-all duration-300 group">
                                        <td className="pl-10 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-teal-400 flex items-center justify-center font-black text-sm border border-slate-800 shadow-md group-hover:scale-105 transition-transform">
                                                    {getInitials(r.nombre_huesped)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <p className="text-sm font-bold text-slate-900 leading-none">{r.nombre_huesped}</p>
                                                    <p className="text-[10px] text-slate-400 font-black mt-1 uppercase tracking-widest truncate max-w-[80px]">ID: {r.id.toString().substring(0,6)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <p className="text-sm font-bold text-slate-700 leading-none truncate max-w-[140px] uppercase tracking-tight">{r.propiedad_nombre}</p>
                                                <p className="text-[10px] text-teal-600 font-bold mt-1 uppercase tracking-widest">Unit {r.propiedad_id || 'N1'}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2 text-sm font-black text-slate-900 leading-none tabular-nums">
                                                    <span>{r.check_in}</span>
                                                    <span className="text-slate-200 text-xs">→</span>
                                                    <span>{r.check_out}</span>
                                                </div>
                                                <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-widest">{nights} Noches</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                                              <span className="text-xs font-black text-slate-900">{r.num_huespedes}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex gap-2 items-center">
                                                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                                        r.estado === 'CONFIRMADA' || r.estado === 'CHECK-IN' ? 'bg-teal-50 text-teal-700' : 
                                                        r.estado === 'CANCELADA' ? 'bg-red-50 text-red-700' :
                                                        'bg-amber-50 text-amber-700 border border-amber-100'
                                                    }`}>
                                                        {r.estado}
                                                    </span>
                                                    <div className="flex items-center gap-1 opacity-50">
                                                      <span className="material-symbols-outlined text-[10px]">hub</span>
                                                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{r.fuente}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="pr-10 py-5 text-right">
                                            <button 
                                                onClick={() => onAction({ type: 'reserva', edit: r })}
                                                className="w-11 h-11 bg-white text-slate-400 hover:bg-slate-900 hover:text-white rounded-xl transition-all active:scale-90 flex items-center justify-center shadow-sm border border-slate-100"
                                            >
                                                <span className="material-symbols-outlined text-lg">edit_note</span>
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
          </div>
        )}

        {/* 3. Gantt Views (7D/30D) - Slate Precision Adaptation */}
        {activeTab !== 'Listado' && (
          <div className="space-y-6 px-4">
              <div className="flex bg-slate-200/50 p-2 rounded-[2rem] items-center justify-between border border-white shadow-sm backdrop-blur-sm">
                  <div className="flex items-center gap-2 px-2">
                       <button onClick={handlePrevDate} className="w-11 h-11 rounded-xl bg-white hover:bg-slate-50 transition-all flex items-center justify-center shadow-sm border border-slate-100 active:scale-95">
                          <span className="material-symbols-outlined text-slate-600">chevron_left</span>
                      </button>
                      <button 
                          onClick={() => setBaseDate(new Date())}
                          className="px-8 h-11 bg-slate-900 text-[#3cddc7] rounded-xl font-['Manrope'] text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center active:scale-95"
                      >
                          Ir a Hoy
                      </button>
                      <button onClick={handleNextDate} className="w-11 h-11 rounded-xl bg-white hover:bg-slate-50 transition-all flex items-center justify-center shadow-sm border border-slate-100 active:scale-95">
                          <span className="material-symbols-outlined text-slate-600">chevron_right</span>
                      </button>
                  </div>
                  <div className="px-6 py-2 bg-white/60 rounded-xl mr-2 shadow-sm border border-white/50 backdrop-blur-md">
                      <p className="font-['Manrope'] text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{activeTab === '7D' ? 'Vista Semanal' : 'Vista Mensual (31 días)'}</p>
                  </div>
              </div>

              <CalendarLogic 
                  data={data} 
                  propiedades={propiedades} 
                  baseDate={baseDate} 
                  numDias={activeTab === '7D' ? 7 : 31} 
              />
          </div>
        )}
      </div>
    </div>
  );
}

function CalendarLogic({ data, propiedades, baseDate, numDias }) {
    const dates = Array.from({ length: numDias }, (_, i) => {
        const d = new Date(baseDate);
        d.setDate(d.getDate() + i);
        return d.toLocaleDateString('en-CA');
    });

    return (
        <div className="bg-slate-50 rounded-[3rem] p-4 shadow-inner overflow-hidden border border-slate-200/50">
            <div className="overflow-x-auto overflow-y-hidden custom-scrollbar pb-2">
                <div className={`${numDias > 7 ? 'min-w-[2000px]' : 'min-w-[1200px]'}`}>
                    <div className="grid grid-cols-[280px_1fr] gap-2">
                        
                        {/* Portfolio Header */}
                        <div className="bg-white/80 p-8 flex items-center rounded-3xl mb-1 shadow-sm border border-slate-100">
                            <div className="w-10 h-10 bg-slate-900 text-[#3cddc7] rounded-xl flex items-center justify-center mr-4 shadow-lg">
                                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>domain</span>
                            </div>
                            <div>
                                <h4 className="font-['Manrope'] text-[14px] font-black text-slate-900 leading-none">Portfolio ClearHost</h4>
                                <p className="font-['Manrope'] text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Activos Gestionados</p>
                            </div>
                        </div>
                        
                        {/* Days Header */}
                        <div className={`grid gap-2 mb-1`} style={{ gridTemplateColumns: `repeat(${numDias}, 1fr)` }}>
                            {dates.map((dateStr) => {
                                const d = new Date(dateStr + 'T12:00:00');
                                const isToday = dateStr === new Date().toLocaleDateString('en-CA');
                                return (
                                    <div key={dateStr} className={`p-5 text-center rounded-3xl transition-all duration-500 flex flex-col justify-center border ${isToday ? 'bg-slate-900 text-[#3cddc7] border-slate-800 shadow-2xl scale-[1.05] z-10' : 'bg-white/60 text-slate-900 border-slate-100'}`}>
                                        <p className="font-['Manrope'] text-[8px] font-black uppercase tracking-widest opacity-60 mb-2">{d.toLocaleDateString('es-ES', { weekday: 'short' })}</p>
                                        <p className="font-['Manrope'] text-2xl font-black tracking-tighter leading-none">{d.getDate()}</p>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Property Rows */}
                        {propiedades.map(p => {
                            const propReservas = data.filter(r => r.propiedad_id === p.id && r.estado !== 'CANCELADA');
                            return (
                                <React.Fragment key={p.id}>
                                    <div className="bg-white/50 p-6 flex items-center rounded-3xl min-h-[88px] transition-all hover:bg-white border border-slate-100 shadow-sm group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-[#3cddc7] flex items-center justify-center font-black text-sm group-hover:scale-110 transition-transform shadow-md uppercase">
                                                {p.nombre_corto?.substring(0,2) || p.nombre?.substring(0,2)}
                                            </div>
                                            <div className="overflow-hidden">
                                                <h4 className="font-['Manrope'] text-[12px] font-black text-slate-900 truncate w-40 leading-none uppercase tracking-tight">{p.nombre}</h4>
                                                <div className="flex items-center gap-1.5 mt-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
                                                    <p className="font-['Manrope'] text-[8px] text-slate-400 font-black uppercase tracking-widest">{p.zona || 'Base Portfolio'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid gap-2 h-[88px] relative" style={{ gridTemplateColumns: `repeat(${numDias}, 1fr)` }}>
                                        {dates.map(dateStr => (
                                            <div key={dateStr} className="bg-white/30 rounded-3xl transition-colors hover:bg-slate-100 border border-slate-100/30" />
                                        ))}

                                        {/* Reservations Layer */}
                                        <div className="absolute inset-0 pointer-events-none p-2 flex items-center">
                                            {propReservas.map(r => {
                                                const startIndex = dates.indexOf(r.check_in);
                                                const endIndex = dates.indexOf(r.check_out);

                                                if (startIndex === -1 && endIndex === -1) {
                                                    const startD = new Date(r.check_in);
                                                    const endD = new Date(r.check_out);
                                                    const viewStart = new Date(dates[0]);
                                                    const viewEnd = new Date(dates[numDias - 1]);
                                                    if (!(startD <= viewEnd && endD >= viewStart)) return null;
                                                }

                                                const effectiveStart = startIndex === -1 ? 0 : startIndex;
                                                const effectiveEnd = endIndex === -1 ? numDias : endIndex;
                                                const span = Math.max(effectiveEnd - effectiveStart, 0.5);

                                                const isAirbnb = r.fuente?.toUpperCase() === 'AIRBNB';

                                                return (
                                                    <div 
                                                        key={r.id}
                                                        className={`absolute h-10 rounded-2xl px-5 flex items-center pointer-events-auto border shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl group/res ${
                                                            isAirbnb 
                                                            ? 'bg-[#FF5A5F] text-white border-[#e05055]' 
                                                            : 'bg-[#0F172A] text-[#3cddc7] border-slate-800'
                                                        }`}
                                                        style={{
                                                            left: `calc(${(effectiveStart / numDias) * 100}% + 8px)`,
                                                            width: `calc(${(span / numDias) * 100}% - 16px)`,
                                                            zIndex: 10
                                                        }}
                                                    >
                                                        <div className="flex items-center gap-2 overflow-hidden w-full">
                                                            <span className="material-symbols-outlined text-[14px]">
                                                                {isAirbnb ? 'hotel_class' : 'account_circle'}
                                                            </span>
                                                            <span className="font-['Manrope'] text-[10px] font-black truncate uppercase tracking-tighter leading-none">{r.nombre_huesped}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>
            </div>
            
            {/* Custom Scrollbar Styling */}
            <style dangerouslySetInnerHTML={{ __html: `
                .custom-scrollbar::-webkit-scrollbar { height: 10px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}} />
        </div>
    );
}
