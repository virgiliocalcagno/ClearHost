import React, { useState, useMemo } from 'react';
import api, { generarLinkWhatsApp, asignarTarea, verificarTarea } from '../services/api';

/**
 * TareasView_V2 - Advanced Operational Task Management.
 * Slate Precision / ClearHost V2: High-Density & Performance.
 */
export default function TareasView_V2({ data = [], propiedades = [], staffList = [], onAction, onRefresh, showToast }) {
  const [assigning, setAssigning] = useState(null);
  const [filtroPropiedad, setFiltroPropiedad] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('Todas');
  const [filtroEstado, setFiltroEstado] = useState('Todas');

  const filteredData = useMemo(() => {
    return data.filter(t => {
      const p = propiedades.find(prop => prop.id === t.propiedad_id);
      const matchesProp = !filtroPropiedad || p?.nombre === filtroPropiedad;
      const matchesTipo = filtroTipo === 'Todas' || t.tipo_tarea === filtroTipo;
      const matchesEstado = filtroEstado === 'Todas' || t.estado === filtroEstado;
      return matchesProp && matchesTipo && matchesEstado;
    });
  }, [data, filtroPropiedad, filtroTipo, filtroEstado, propiedades]);

  const handleWhatsApp = async (id) => {
    try {
      const res = await generarLinkWhatsApp(id);
      window.open(res.link, '_blank');
    } catch(err) {
      if (showToast) showToast("No se pudo generar link de WhatsApp", "error");
      else alert("No se pudo generar link de WhatsApp");
    }
  };

  const handleVerificar = async (id) => {
    try {
      await verificarTarea(id);
      if (showToast) showToast('Tarea verificada ✓', 'success');
      onRefresh();
    } catch (err) {
      if (showToast) showToast('Error al verificar', 'error');
    }
  };

  const handleAsignar = async (tareaId, staffId) => {
    setAssigning(tareaId);
    try {
      await asignarTarea(tareaId, staffId || null);
      if (showToast) showToast('Tarea asignada', 'success');
      onRefresh();
    } catch (err) {
      if (showToast) showToast('Error al asignar', 'error');
    } finally {
      setAssigning(null);
    }
  };

  const staffLimpieza = useMemo(() => staffList.filter(s => s.rol === 'STAFF'), [staffList]);
  const nombresPropiedades = useMemo(() => [...new Set(propiedades.map(p => p.nombre))], [propiedades]);

  // Priority Calculation
  const getPriorityInfo = (t) => {
    if (t.estado === 'COMPLETADA' || t.estado === 'VERIFICADA') return { label: 'Finalizada', color: 'bg-emerald-50 text-emerald-700' };
    const [year, month, day] = t.fecha_programada.split('-').map(Number);
    const scheduled = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0,0,0,0);
    const diff = (scheduled - today) / (1000 * 60 * 60 * 24);

    if (diff < 0) return { label: 'Vencida', color: 'bg-rose-50 text-rose-700 animate-pulse' };
    if (diff === 0) return { label: 'Hoy', color: 'bg-amber-50 text-amber-700' };
    if (diff <= 1) return { label: 'Mañana', color: 'bg-blue-50 text-blue-700' };
    return { label: 'Próxima', color: 'bg-slate-50 text-slate-600' };
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-[#fcf8fa] min-h-screen font-['Inter']">
      
      {/* 1. Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-6 px-4">
          <div>
            <h1 className="text-slate-900 text-3xl font-black tracking-tight font-['Manrope']">Tareas Operativas</h1>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Limpieza, Mantenimiento y Verificación</p>
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
              onClick={() => onAction({ type: 'tarea', edit: null })}
              className="h-11 px-6 bg-[#0F172A] text-[#3cddc7] font-black text-[10px] uppercase tracking-[0.15em] rounded-xl hover:bg-slate-800 transition-all shadow-xl active:scale-95 flex items-center gap-3 font-['Manrope'] border border-slate-800"
            >
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>add_task</span>
              Nueva Tarea
            </button>
          </div>
      </div>

      {/* 2. Filter Bar - Atelier Minimalist */}
      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200 min-w-[200px]">
              <span className="material-symbols-outlined text-slate-400 text-lg">domain</span>
              <select 
                value={filtroPropiedad} 
                onChange={e => setFiltroPropiedad(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-slate-700 focus:ring-0 w-full outline-none uppercase tracking-widest"
              >
                <option value="">Todas las propiedades</option>
                {nombresPropiedades.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200">
              <span className="material-symbols-outlined text-slate-400 text-lg">category</span>
              <select 
                value={filtroTipo} 
                onChange={e => setFiltroTipo(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-slate-700 focus:ring-0 outline-none uppercase tracking-widest"
              >
                <option value="Todas">Todos los tipos</option>
                <option value="LIMPIEZA_ENTRADA">Limpieza Entrada</option>
                <option value="LIMPIEZA_SALIDA">Limpieza Salida</option>
                <option value="MANTENIMIENTO">Mantenimiento</option>
                <option value="REPASO">Repaso</option>
              </select>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200">
              <span className="material-symbols-outlined text-slate-400 text-lg">filter_alt</span>
              <select 
                value={filtroEstado} 
                onChange={e => setFiltroEstado(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-slate-700 focus:ring-0 outline-none uppercase tracking-widest"
              >
                <option value="Todas">Todos los estados</option>
                <option value="PENDIENTE">PENDIENTE</option>
                <option value="ACEPTADA">ACEPTADA</option>
                <option value="COMPLETADA">COMPLETADA</option>
                <option value="VERIFICADA">VERIFICADA</option>
              </select>
          </div>

          <div className="ml-auto flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Resultados:</span>
              <span className="text-sm font-black text-slate-900 tabular-nums">{filteredData.length}</span>
          </div>
      </div>

      {/* 3. Table View - The Technical Atelier */}
      <div className="bg-white rounded-[2.5rem] p-4 shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                  <thead>
                      <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50/50">
                          <th className="pl-10 py-5 rounded-l-2xl">ID / Tarea</th>
                          <th className="px-6 py-5">Propiedad</th>
                          <th className="px-6 py-5">Programación</th>
                          <th className="px-6 py-5">Asignación</th>
                          <th className="px-6 py-5">Estado / Prioridad</th>
                          <th className="pr-10 py-5 text-right rounded-r-2xl">Acciones</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                      {filteredData.map(t => {
                          const p = propiedades.find(prop => prop.id === t.propiedad_id);
                          const priority = getPriorityInfo(t);
                          return (
                              <tr key={t.id} className="hover:bg-slate-50 transition-all duration-300 group">
                                  <td className="pl-10 py-5">
                                      <div className="flex items-center gap-4">
                                          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-[#3cddc7] flex items-center justify-center font-black text-[10px] border border-slate-800 shadow-md transition-transform group-hover:scale-105">
                                              T-{t.id_secuencial || t.id.toString().substring(0,4)}
                                          </div>
                                          <div>
                                              <p className="text-sm font-bold text-slate-900 leading-none capitalize">{t.tipo_tarea?.replace('_', ' ').toLowerCase() || 'Limpieza'}</p>
                                              <p className="text-[10px] text-slate-400 font-black mt-1 uppercase tracking-widest">{t.nombre_huesped || 'Unidad Vacante'}</p>
                                          </div>
                                      </div>
                                  </td>
                                  <td className="px-6 py-5">
                                      <div className="flex flex-col">
                                          <p className="text-sm font-bold text-slate-700 leading-none uppercase tracking-tight truncate max-w-[120px]">{p?.nombre || '—'}</p>
                                          <p className="text-[10px] text-teal-600 font-bold mt-1 uppercase tracking-widest">{p?.ciudad || 'General'}</p>
                                      </div>
                                  </td>
                                  <td className="px-6 py-5">
                                      <div className="flex flex-col">
                                          <div className="flex items-center gap-2 text-sm font-black text-slate-900 leading-none tabular-nums">
                                              <span>{t.fecha_programada}</span>
                                          </div>
                                          <div className="flex items-center gap-1 mt-1 text-slate-400">
                                              <span className="material-symbols-outlined text-[10px]">schedule</span>
                                              <p className="text-[10px] font-bold uppercase tracking-widest">{t.hora_inicio || '11:00'}</p>
                                          </div>
                                      </div>
                                  </td>
                                  <td className="px-6 py-5 min-w-[180px]">
                                      <div className="relative group/assign">
                                          <select
                                              value={t.asignado_a || ''}
                                              onChange={(e) => handleAsignar(t.id, e.target.value)}
                                              disabled={assigning === t.id}
                                              className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-bold uppercase tracking-widest transition-all focus:ring-2 focus:ring-teal-500/20 outline-none appearance-none cursor-pointer ${
                                                  !t.asignado_a ? 'text-amber-500 border-amber-200 bg-amber-50' : 'text-slate-900'
                                              }`}
                                          >
                                              <option value="">⚠ Sin asignar</option>
                                              {staffLimpieza.map(s => (
                                                  <option key={s.id} value={s.id}>{s.nombre}</option>
                                              ))}
                                          </select>
                                          <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">expand_more</span>
                                      </div>
                                  </td>
                                  <td className="px-6 py-5">
                                      <div className="flex flex-col gap-1.5 items-start">
                                          <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all ${
                                              t.estado === 'VERIFICADA' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                                              t.estado === 'COMPLETADA' || t.estado === 'CLEAN_AND_READY' ? 'bg-teal-50 text-teal-700 border-teal-100' : 
                                              t.estado === 'PENDIENTE' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                              'bg-slate-50 text-slate-600 border-slate-200'
                                          }`}>
                                              {t.estado}
                                          </span>
                                          <span className={`px-2.5 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${priority.color}`}>
                                              {priority.label}
                                          </span>
                                      </div>
                                  </td>
                                  <td className="pr-10 py-5 text-right">
                                      <div className="flex justify-end gap-2">
                                          <button 
                                              onClick={() => handleWhatsApp(t.id)}
                                              className="w-10 h-10 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-all shadow-sm border border-emerald-100 flex items-center justify-center group/ws"
                                              title="Enviar WhatsApp"
                                          >
                                              <span className="material-symbols-outlined text-lg">chat</span>
                                          </button>
                                          {['COMPLETADA', 'CLEAN_AND_READY'].includes(t.estado) && (
                                              <button 
                                                  onClick={() => handleVerificar(t.id)}
                                                  className="w-10 h-10 bg-teal-600 text-white hover:bg-teal-700 rounded-xl transition-all shadow-lg flex items-center justify-center group/check shadow-teal-600/20"
                                                  title="Verificar"
                                              >
                                                  <span className="material-symbols-outlined text-lg">verified</span>
                                              </button>
                                          )}
                                          <button 
                                              onClick={() => onAction({ type: 'tarea', edit: t })}
                                              className="w-10 h-10 bg-white text-slate-400 hover:bg-slate-900 hover:text-white rounded-xl transition-all flex items-center justify-center border border-slate-100 shadow-sm"
                                          >
                                              <span className="material-symbols-outlined text-lg">edit</span>
                                          </button>
                                      </div>
                                  </td>
                              </tr>
                          );
                      })}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
}
