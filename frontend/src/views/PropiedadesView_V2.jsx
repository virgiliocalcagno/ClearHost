import React, { useState, useMemo } from 'react';
import api from '../services/api';

const syncIcal = (propId) => api.post(`/reservas/sync-ical/${propId}`).then(r => r.data);

export const PropiedadesView_V2 = ({ data, propietarios, onAction, onRefresh, showToast }) => {
  const [syncing, setSyncing] = useState(null);
  const [ownerFilter, setOwnerFilter] = useState('');

  const filteredProps = useMemo(() => {
    return ownerFilter 
      ? data.filter(p => p.propietario_id === ownerFilter)
      : data;
  }, [data, ownerFilter]);

  const stats = useMemo(() => {
    const total = data.length;
    const active = data.filter(p => p.activa).length;
    const rooms = data.reduce((acc, p) => acc + (p.num_habitaciones || 0), 0);
    return { total, active, rooms };
  }, [data]);

  const handleSyncIcal = async (prop) => {
    setSyncing(prop.id);
    try {
      const res = await syncIcal(prop.id);
      if (showToast) showToast(res.message || 'Sincronización iCal iniciada', 'success');
      setTimeout(() => onRefresh(), 2000);
    } catch (err) {
      if (showToast) showToast('Error al sincronizar iCal', 'error');
    } finally {
      setSyncing(null);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      if (showToast) showToast('URL iCal copiada', 'info');
    }).catch(() => {
      if (showToast) showToast('Error al copiar URL', 'error');
    });
  };

  const getInitials = (name) => {
    if (!name) return "??";
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="p-8 font-['Inter'] bg-[#fcf8fa] min-h-screen animate-in fade-in duration-700">
      {/* 1. Header Spec "Slate Precision" */}
      <div className="flex justify-between items-center mb-10 px-2">
        <div>
          <h1 className="text-slate-900 text-3xl font-black tracking-tight font-['Manrope']">
            Propiedades y Activos
          </h1>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
            Gestión integral del portafolio inmobiliario
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <select 
              className="appearance-none bg-white border border-slate-200 text-slate-700 py-3 px-5 pr-12 rounded-2xl text-[10px] font-black focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all cursor-pointer shadow-sm uppercase tracking-widest font-['Manrope']"
              value={ownerFilter} 
              onChange={e => setOwnerFilter(e.target.value)}
            >
              <option value="">Filtrar: Propietario</option>
              {propietarios.map(prop => (
                <option key={prop.id} value={prop.id}>{prop.nombre}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
              <span className="material-symbols-outlined text-sm">expand_more</span>
            </div>
          </div>

          <button 
            className="flex items-center gap-3 bg-[#0d9488] hover:bg-[#0b7a70] text-white px-8 h-12 rounded-2xl font-black text-[10px] uppercase tracking-[0.15em] transition-all shadow-lg shadow-[#0d9488]/20 active:scale-95 font-['Manrope']"
            onClick={() => onAction({ type: 'propiedad' })}
          >
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
            Nueva Propiedad
          </button>
        </div>
      </div>

      {/* 2. Bento Grid Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10 px-2">
          {[
            { label: 'Unidades Totales', val: stats.total, icon: 'location_city', color: 'slate' },
            { label: 'Unidades Activas', val: stats.active, icon: 'verified', color: 'teal' },
            { label: 'Habitaciones', val: stats.rooms, icon: 'bed', color: 'blue' },
            { label: 'Disponibilidad', val: '92%', icon: 'calendar_month', color: 'emerald' }
          ].map((s, idx) => (
            <div key={idx} className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 flex flex-col justify-between h-44 group hover:shadow-xl transition-all duration-500 overflow-hidden relative">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${s.color === 'teal' ? 'bg-teal-50 text-teal-600' : 'bg-slate-50 text-slate-600'} transition-transform group-hover:scale-110 duration-300 shadow-sm border border-white`}>
                <span className="material-symbols-outlined text-2xl">{s.icon}</span>
              </div>
              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2 font-['Manrope']">{s.label}</h3>
                <p className="text-3xl font-black text-slate-900 tracking-tighter font-['Inter']">{s.val}</p>
              </div>
              <div className="absolute top-0 right-0 opacity-[0.03] translate-x-4 -translate-y-4">
                 <span className="material-symbols-outlined text-9xl">{s.icon}</span>
              </div>
            </div>
          ))}
      </div>

      {/* 3. Surface Container (Atelier Table) */}
      <div className="bg-white border border-slate-100 shadow-sm rounded-[3rem] p-6 overflow-hidden">
        <div className="flex justify-between items-center mb-6 px-4">
            <h2 className="text-lg font-black text-slate-900 font-['Manrope'] tracking-tight">Listado Maestro de Activos</h2>
            <button className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 transition-all font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
                 <span className="material-symbols-outlined text-lg">search</span> Buscar...
            </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-['Inter']">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="pl-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] rounded-l-3xl">PROPIEDAD / ZONA</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">LOCALIDAD</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">CAPACIDAD</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">ESTADO</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">SINCRONIZACIÓN</th>
                <th className="pr-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right rounded-r-3xl">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredProps.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-all group">
                  <td className="pl-10 py-6">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-[1.25rem] bg-slate-900 text-[#3cddc7] flex items-center justify-center font-black text-sm border border-slate-800 shadow-lg group-hover:scale-105 transition-transform uppercase">
                        {getInitials(p.nombre)}
                      </div>
                      <div className="flex flex-col">
                        <p className="text-sm font-bold text-slate-900 font-['Manrope'] leading-none uppercase tracking-tight">{p.nombre}</p>
                        <p className="text-[10px] text-teal-600 font-black mt-1.5 uppercase tracking-widest flex items-center gap-1.5">
                           <span className="material-symbols-outlined text-[10px]">location_on</span>
                           {p.zona_nombre || 'Portfolio Central'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">{p.ciudad}</span>
                        <span className="text-[10px] text-slate-400 font-medium mt-1 truncate max-w-[120px]">{p.direccion}</span>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-center">
                    <div className="inline-flex flex-col items-center bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2">
                      <span className="text-sm font-black text-slate-900 tabular-nums">
                        {p.num_habitaciones}
                      </span>
                      <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Habit.</span>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-center">
                    <div className="flex justify-center">
                      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm ${
                        p.activa 
                          ? 'bg-teal-50 text-teal-700 border border-teal-100' 
                          : 'bg-rose-50 text-rose-700 border border-rose-100'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${p.activa ? 'bg-teal-500' : 'bg-rose-500'} animate-pulse`}></span>
                        {p.activa ? 'Operativa' : 'Pausada'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex flex-col gap-2">
                      {p.ical_url ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSyncIcal(p)}
                            disabled={syncing === p.id}
                            className="h-10 px-4 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 shadow-sm flex items-center gap-2"
                          >
                            <span className={`material-symbols-outlined text-sm ${syncing === p.id ? 'animate-spin' : ''}`}>sync_alt</span>
                            {syncing === p.id ? 'Sync...' : 'Actualizar'}
                          </button>
                          <button 
                            onClick={() => copyToClipboard(`https://clearhost-c8919.web.app/api/reservas/ical/export/${p.id}`)}
                            className="w-10 h-10 bg-slate-50 text-slate-400 hover:text-teal-600 rounded-xl transition-all flex items-center justify-center border border-slate-100 shadow-sm"
                            title="Copiar URL iCal"
                          >
                            <span className="material-symbols-outlined text-lg">link</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] italic">No Configurado</span>
                      )}
                    </div>
                  </td>
                  <td className="pr-10 py-6 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                      <button 
                        onClick={() => onAction({ type: 'propiedad', edit: p })}
                        className="w-11 h-11 bg-white border border-slate-100 text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all rounded-xl shadow-sm flex items-center justify-center"
                        title="Editar Activo"
                      >
                        <span className="material-symbols-outlined text-lg">edit_square</span>
                      </button>
                      <button 
                        onClick={async () => { 
                          if (confirm('¿Desactivar esta propiedad?')) { 
                            try { 
                              await api.delete(`/propiedades/${p.id}`); 
                              if (showToast) showToast('Propiedad desactivada', 'success');
                              onRefresh(); 
                            } catch(e) { 
                              if (showToast) showToast('Error al desactivar', 'error');
                            } 
                          } 
                        }}
                        className="w-11 h-11 bg-rose-50 border border-rose-100 text-rose-400 hover:text-rose-600 hover:bg-rose-100 transition-all rounded-xl shadow-sm flex items-center justify-center"
                        title="Desactivar"
                      >
                        <span className="material-symbols-outlined text-lg">block</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
