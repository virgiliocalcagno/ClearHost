import React, { useState, useEffect } from 'react';
import { LayoutGrid, RefreshCcw, Clock, MoreHorizontal, CheckCircle2, AlertCircle, Plus, ChevronLeft, ChevronRight, Filter, Download } from 'lucide-react';
import api, { 
  getTareas 
} from '../services/api';

export function TareasView_V2({ 
  data: initialTasks,
  propiedades: initialPropiedades,
  staffLimpieza: staffList = [],
  inventario = [],
  onAction,
  onRefresh,
  showToast 
}) {
  const [viewMode, setViewMode] = useState('table'); 
  const [baseDate, setBaseDate] = useState(new Date());
  const [allTasks, setAllTasks] = useState(initialTasks || []);
  const [propiedades, setPropiedades] = useState(initialPropiedades || []);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      let params = {};
      const start = new Date(baseDate);
      
      if (viewMode === 'day') {
        params.fecha = start.toISOString().split('T')[0];
      } else if (viewMode === 'week') {
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(start.setDate(diff));
        params.fecha_inicio = monday.toISOString().split('T')[0];
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        params.fecha_fin = sunday.toISOString().split('T')[0];
      } else if (viewMode === 'month') {
        const startM = new Date(start.getFullYear(), start.getMonth(), 1);
        params.fecha_inicio = startM.toISOString().split('T')[0];
        const endM = new Date(start.getFullYear(), start.getMonth() + 1, 0);
        params.fecha_fin = endM.toISOString().split('T')[0];
      } else if (viewMode === 'table') {
        // En vista tabla cargamos un rango más amplio (ej: todo el mes actual por defecto)
        const startM = new Date(start.getFullYear(), start.getMonth(), 1);
        params.fecha_inicio = startM.toISOString().split('T')[0];
        const endM = new Date(start.getFullYear(), start.getMonth() + 1, 0);
        params.fecha_fin = endM.toISOString().split('T')[0];
      }

      const [tData, pRes] = await Promise.all([
        getTareas(params),
        api.get('/propiedades/')
      ]);
      setAllTasks(tData || []);
      setPropiedades(pRes.data || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [viewMode, baseDate]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await api.post('/tareas/sync-now/');
      if (showToast) showToast("Sincronización completada ✅");
      await fetchData();
    } catch (err) {
      console.error("Sync Error:", err);
      if (showToast) showToast("Error de conexión");
    } finally {
      setSyncing(false);
    }
  };

  const getDaysArrayForWeek = () => {
    const start = new Date(baseDate);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(start.setDate(diff));
    return Array.from({length: 7}, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  };

  const changeDate = (offset) => {
    const d = new Date(baseDate);
    if (viewMode === 'day') d.setDate(d.getDate() + offset);
    else if (viewMode === 'week') d.setDate(d.getDate() + (offset * 7));
    else if (viewMode === 'month') d.setMonth(d.getMonth() + offset);
    setBaseDate(d);
  };

  const renderViewControls = () => (
    <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
      {[
        { id: 'table', label: 'Tabla' },
        { id: 'day', label: 'Operativa (4D)' },
        { id: 'week', label: 'Semanal (7D)' },
        { id: 'month', label: 'Mensual' }
      ].map((m) => (
        <button
          key={m.id}
          onClick={() => setViewMode(m.id)}
          className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all tracking-wider ${
            viewMode === m.id 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );

  const handleWhatsApp = async (tareaId) => {
    try {
      const res = await api.post(`/tareas/whatsapp/${tareaId}`);
      if (res.data?.link) window.open(res.data.link, '_blank');
    } catch (err) {
      if (showToast) showToast("Error al generar link de WhatsApp");
    }
  };

  const handleDelete = async (tareaId) => {
    if (!window.confirm("¿Estás seguro de eliminar esta tarea?")) return;
    try {
      await api.delete(`/tareas/${tareaId}`);
      if (showToast) showToast("Tarea eliminada ✓");
      fetchData();
    } catch (err) {
      if (showToast) showToast("Error al eliminar");
    }
  };

  const handleAsignar = async (tareaId, staffId) => {
    try {
      await api.put(`/tareas/${tareaId}`, { asignado_a: staffId || null });
      if (showToast) showToast("Asignación actualizada ✓");
      fetchData();
    } catch (err) {
      if (showToast) showToast("Error al asignar staff");
    }
  };

  const handleVerificar = async (tareaId) => {
    try {
      await api.post(`/tareas/verificar/${tareaId}`);
      if (showToast) showToast("Tarea verificada ✓");
      fetchData();
    } catch (err) {
      if (showToast) showToast("Error al verificar");
    }
  };

  const renderTableView = () => (
    <div className="flex flex-col h-full bg-white animate-in fade-in duration-500">
      <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Todas las Tareas</h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">{allTasks.length} tareas totales en este ciclo</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full border-separate border-spacing-0">
          <thead className="sticky top-0 z-20 bg-white">
            <tr>
              <th className="p-4 text-left text-[10px] uppercase font-black text-slate-400 border-b border-r border-slate-100"># ID</th>
              <th className="p-4 text-left text-[10px] uppercase font-black text-slate-400 border-b border-slate-100">Propiedad</th>
              <th className="p-4 text-left text-[10px] uppercase font-black text-slate-400 border-b border-slate-100">Huésped</th>
              <th className="p-4 text-left text-[10px] uppercase font-black text-slate-400 border-b border-slate-100">Fecha</th>
              <th className="p-4 text-left text-[10px] uppercase font-black text-slate-400 border-b border-slate-100">Asignado a</th>
              <th className="p-4 text-left text-[10px] uppercase font-black text-slate-400 border-b border-slate-100">Estado</th>
              <th className="p-4 text-center text-[10px] uppercase font-black text-slate-400 border-b border-slate-100">Checklist</th>
              <th className="p-4 text-right text-[10px] uppercase font-black text-slate-400 border-b border-slate-100 pr-8">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {allTasks.map((t) => {
              const checkTotal = t.checklist?.length || 0;
              const checkDone = t.checklist?.filter(i => i.completado).length || 0;
              
              return (
                <tr key={t.id} className="group hover:bg-blue-50/30 transition-all border-b border-slate-50">
                  <td className="p-4 border-b border-slate-100 border-r">
                    <span className="bg-slate-100 px-3 py-1.5 rounded-lg text-[10px] font-black text-slate-600 block w-fit">T-{t.id_secuencial || '—'}</span>
                  </td>
                  <td className="p-4 border-b border-slate-100">
                    <div className="text-sm font-bold text-slate-900 uppercase tracking-tight">{t.nombre_propiedad}</div>
                  </td>
                  <td className="p-4 border-b border-slate-100">
                    <div className="text-sm font-semibold text-slate-600 uppercase tracking-tighter">{t.nombre_huesped || 'Reserved'}</div>
                  </td>
                  <td className="p-4 border-b border-slate-100">
                    <div className="text-[11px] font-bold text-slate-900">{t.fecha_programada}</div>
                    <div className="text-[10px] text-blue-600 font-black mt-1 flex items-center gap-1">
                      <Clock size={10} /> {t.hora_inicio || '11:00'}
                    </div>
                  </td>
                  <td className="p-4 border-b border-slate-100">
                   <select 
                      value={t.asignado_a || ''} 
                      onChange={(e) => handleAsignar(t.id, e.target.value)}
                      className={`text-[10px] font-black uppercase bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all w-full max-w-[150px] ${!t.asignado_a ? 'text-amber-600 border-amber-200' : 'text-slate-700'}`}
                    >
                      <option value="">⚠ Sin asignar</option>
                      {staffList.map(s => (
                        <option key={s.id} value={s.id}>{s.nombre}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-4 border-b border-slate-100">
                    <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border ${
                      t.estado === 'VERIFICADA' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      t.estado === 'CLEAN_AND_READY' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                      'bg-amber-50 text-amber-600 border-amber-100'
                    }`}>
                      {t.estado}
                    </span>
                  </td>
                  <td className="p-4 border-b border-slate-100 text-center">
                    <div className="flex flex-col items-center gap-1">
                       <span className="text-[10px] font-black text-slate-500">{checkDone}/{checkTotal}</span>
                       <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 transition-all" style={{width: `${checkTotal > 0 ? (checkDone/checkTotal)*100 : 0}%`}} />
                       </div>
                    </div>
                  </td>
                  <td className="p-4 border-b border-slate-100 text-right pr-8">
                    <div className="flex justify-end items-center gap-2">
                       <button onClick={() => onAction && onAction({ type: 'tarea', edit: t })} className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm">
                          <MoreHorizontal size={14} className="mx-auto" />
                       </button>
                       <button onClick={() => handleWhatsApp(t.id)} className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20">
                          WhatsApp
                       </button>
                       {['PENDIENTE', 'ASIGNADA_NO_CONFIRMADA'].includes(t.estado) && (
                         <button onClick={() => handleDelete(t.id)} className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-100 text-rose-500 hover:bg-rose-100 transition-all">
                            <AlertCircle size={14} className="mx-auto" />
                         </button>
                       )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderInventoryView = () => (
    <div className="flex flex-col h-full bg-white p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
             <LayoutGrid className="text-blue-600" size={24} />
             INVENTARIO OPERATIVO
          </h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Control de insumos y piezas por propiedad</p>
        </div>
        <div className="flex gap-3">
           <button 
             onClick={() => onAction && onAction({ type: 'inventario', edit: null })}
             className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
           >
              <Plus size={16} />
              Agregar Artículo
           </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto border border-slate-200 rounded-3xl bg-slate-50/30 custom-scrollbar shadow-inner">
        <table className="w-full border-separate border-spacing-0">
          <thead className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">
            <tr>
              <th className="p-4 text-left text-[10px] uppercase font-black text-slate-400 tracking-widest">Artículo</th>
              <th className="p-4 text-left text-[10px] uppercase font-black text-slate-400 tracking-widest">Categoría</th>
              <th className="p-4 text-center text-[10px] uppercase font-black text-slate-400 tracking-widest">Stock Actual</th>
              <th className="p-4 text-center text-[10px] uppercase font-black text-slate-400 tracking-widest">Mínimo</th>
              <th className="p-4 text-left text-[10px] uppercase font-black text-slate-400 tracking-widest">Propiedad</th>
              <th className="p-4 text-right text-[10px] uppercase font-black text-slate-400 tracking-widest">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {inventario.length > 0 ? inventario.map((item) => {
              const isLowStock = item.stock_actual <= item.stock_minimo;
              const prop = propiedades.find(p => p.id === item.propiedad_id);
              const propAlias = prop?.alias || prop?.nombre || 'Global';
              
              return (
                <tr key={item.id} className="group hover:bg-white transition-all border-b border-slate-100 last:border-0">
                  <td className="p-4 border-b border-slate-100 group-last:border-0">
                    <div className="flex items-center gap-3">
                       <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[10px] border ${isLowStock ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-white text-blue-600 border-slate-200'}`}>
                          {item.articulo?.substring(0,2).toUpperCase()}
                       </div>
                       <span className="text-sm font-bold text-slate-800 uppercase tracking-tight">{item.articulo}</span>
                    </div>
                  </td>
                  <td className="p-4 border-b border-slate-100 group-last:border-0">
                    <span className="text-[10px] font-black text-slate-500 uppercase bg-slate-100 px-2.5 py-1 rounded-md">{item.categoria || 'Gral'}</span>
                  </td>
                  <td className="p-4 border-b border-slate-100 group-last:border-0 text-center">
                    <span className={`text-sm font-black ${isLowStock ? 'text-rose-600' : 'text-slate-900'}`}>
                      {item.stock_actual}
                    </span>
                  </td>
                  <td className="p-4 border-b border-slate-100 group-last:border-0 text-center text-slate-400 font-bold text-xs">{item.stock_minimo}</td>
                  <td className="p-4 border-b border-slate-100 group-last:border-0">
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-blue-500" />
                       <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter truncate max-w-[120px]">{propAlias}</span>
                    </div>
                  </td>
                  <td className="p-4 border-b border-slate-100 group-last:border-0 text-right">
                    <button 
                      onClick={() => onAction && onAction({ type: 'articulo', edit: item })}
                      className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                    >
                       <MoreHorizontal size={14} className="mx-auto" />
                    </button>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan="6" className="py-20 text-center">
                   <div className="flex flex-col items-center opacity-40">
                      <Download size={40} className="mb-2 text-slate-300" />
                      <p className="text-[10px] font-black uppercase tracking-[0.2em]">Cargando Inventario o Sin Registros...</p>
                   </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderWeeklyGrid = () => {
    const days = getDaysArrayForWeek();
    return (
      <div className="overflow-x-auto flex-1 border border-slate-200 rounded-2xl bg-white shadow-sm custom-scrollbar">
        <table className="w-full border-separate border-spacing-0">
          <thead className="sticky top-0 z-30">
            <tr>
              <th className="sticky left-0 z-40 bg-slate-100 p-4 text-left text-[10px] uppercase font-black text-slate-500 border-b border-slate-300 w-48 border-r">Propiedad</th>
              {days.map(d => (
                <th key={d.toString()} className="p-4 text-center border-b border-slate-300 min-w-[160px] bg-slate-100">
                  <div className="text-[10px] font-black text-blue-600 uppercase tracking-tighter">{d.toLocaleDateString('es-ES', {weekday: 'short'})}</div>
                  <div className="text-xl font-black text-slate-900">{d.getDate()}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {propiedades.map(prop => (
              <tr key={prop.id} className="group hover:bg-slate-50/50 transition-colors">
                <td className="sticky left-0 z-20 bg-white group-hover:bg-slate-50 p-4 border-b border-slate-300 border-r text-slate-900">
                  <div className="text-[11px] font-black uppercase truncate">{prop.alias || prop.nombre}</div>
                  <div className="text-[9px] text-slate-600 font-bold mt-0.5">{prop.codigo || 'S/C'}</div>
                </td>
                {days.map(d => {
                  const dayTasks = allTasks.filter(t => 
                    String(t.propiedad_id) === String(prop.id) && 
                    t.fecha_programada === d.toISOString().split('T')[0]
                  );
                  return (
                    <td key={d.toString()} className="p-2 border-b border-slate-200 border-r align-top h-32 group/cell">
                      <div className="flex flex-col gap-2">
                        {dayTasks.map(t => (
                          <div 
                            key={t.id} 
                            onClick={() => onAction && onAction({ type: 'tarea', edit: t })}
                            className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-[10px] font-bold text-blue-900 leading-tight cursor-pointer hover:bg-blue-100 transition-all shadow-sm hover:shadow-md"
                          >
                             <div className="flex justify-between items-start mb-1 text-[9px] border-b border-blue-300 pb-1">
                               <span className="font-black flex items-center gap-1">🧹 {t.tipo_tarea}</span>
                               <span className="text-blue-700">{t.hora_inicio}</span>
                             </div>
                             <div className="text-[9px] text-slate-700 truncate mt-1 font-bold">👤 {t.nombre_huesped || 'Checkout'}</div>
                             <div className={`text-[8px] mt-1 font-black truncate ${t.nombre_asignado ? 'text-blue-800' : 'text-rose-600'}`}>
                               {t.nombre_asignado || 'NO ASIGNADO'}
                             </div>
                          </div>
                        ))}
                        {dayTasks.length === 0 && (
                          <button 
                            onClick={() => onAction && onAction({ type: 'tarea', edit: { propiedad_id: prop.id, fecha_programada: d.toISOString().split('T')[0] } })}
                            className="opacity-0 group-hover/cell:opacity-100 flex items-center justify-center w-full py-4 border-2 border-dashed border-slate-100 rounded-xl hover:bg-slate-50 hover:border-slate-200 transition-all"
                          >
                             <Plus size={14} className="text-slate-300" />
                          </button>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderTodayView = () => (
    <div className="flex gap-8 h-full overflow-hidden p-8">
      {/* Principal Task List */}
      <div className="flex-[3] flex flex-col gap-6 overflow-auto custom-scrollbar">
        <div className="grid grid-cols-3 gap-4">
           {/* Quick Stats Cards */}
           <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between h-32">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">Tareas de Limpieza</span>
              <div className="flex items-end justify-between">
                <span className="text-4xl font-black text-slate-800 tracking-tighter">{allTasks.length}</span>
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 shadow-inner"><LayoutGrid size={20} /></div>
              </div>
           </div>
           <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between h-32">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">Propiedades Listas</span>
              <div className="flex items-end justify-between">
                <span className="text-4xl font-black text-slate-800 tracking-tighter">
                  {propiedades.filter(p => !allTasks.some(t => t.propiedad_id === p.id && t.estado !== 'completada')).length}
                </span>
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 shadow-inner"><CheckCircle2 size={20} /></div>
              </div>
           </div>
           <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between h-32">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">Eficiencia Operativa</span>
              <div className="flex items-end justify-between">
                <span className="text-4xl font-black text-slate-800 tracking-tighter">94%</span>
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 shadow-inner"><Clock size={20} /></div>
              </div>
           </div>
        </div>

        <div className="flex flex-col gap-4 bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
           <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
             <div className="w-1 h-4 bg-blue-600 rounded-full" />
             Despliegue del Día
           </h3>
           
           <div className="flex flex-col gap-3">
              {allTasks.length > 0 ? allTasks.map(tarea => (
                 <div 
                   key={tarea.id} 
                   onClick={() => onAction && onAction({ type: 'tarea', edit: tarea })}
                   className="group hover:bg-slate-50 border border-slate-100 p-4 rounded-2xl transition-all flex items-center justify-between cursor-pointer shadow-sm hover:shadow-md border-l-4 border-l-blue-600"
                 >
                    <div className="flex items-center gap-5">
                       <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs shadow-inner uppercase tracking-tighter">
                          {tarea.tipo_tarea.substring(0,3)}
                       </div>
                       <div>
                          <div className="flex items-center gap-2">
                             <span className="text-slate-900 font-bold text-sm uppercase tracking-tight">{tarea.nombre_propiedad}</span>
                             <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                                tarea.prioridad === 'EMERGENCIA' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-50 text-slate-500 border-slate-200'
                             } uppercase`}>
                                {tarea.prioridad}
                             </span>
                          </div>
                          <div className="flex items-center gap-4 mt-1">
                             <span className="text-[10px] text-slate-500 flex items-center gap-1 font-semibold text-blue-700"><Clock size={12}/> {tarea.hora_inicio}h</span>
                             <span className="text-[10px] text-slate-700 font-bold uppercase tracking-widest">{tarea.nombre_huesped || 'Check-out'}</span>
                          </div>
                       </div>
                    </div>
                    <div className="flex items-center gap-6">
                       <div className="text-right">
                          <div className="text-[10px] font-black text-slate-900 uppercase">{tarea.nombre_asignado || 'NO ASIGNADO'}</div>
                          <div className={`text-[9px] mt-0.5 font-bold uppercase ${tarea.estado === 'completada' ? 'text-emerald-600' : 'text-slate-400'}`}>{tarea.estado}</div>
                       </div>
                       <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
                          <MoreHorizontal size={16} />
                       </div>
                    </div>
                 </div>
              )) : (
                <div className="py-20 flex flex-col items-center opacity-40">
                   <AlertCircle size={40} className="mb-2 text-slate-300" />
                   <p className="text-xs font-bold uppercase tracking-widest">Sin tareas activas hoy</p>
                </div>
              )}
           </div>
        </div>
      </div>

      <aside className="w-80 flex flex-col gap-6 h-full">
         <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-6">Radar de Inmuebles</h3>
            <div className="grid grid-cols-4 gap-2.5">
               {propiedades.map(p => {
                  const status = p.estado_logico || 'LISTA';
                  return (
                     <div key={p.id} className="aspect-square rounded-xl border border-slate-100 flex items-center justify-center relative group cursor-help overflow-hidden bg-slate-50 transition-all hover:scale-105 active:scale-95 shadow-sm">
                        <div className={`absolute inset-0 opacity-10 ${
                           status === 'LIMPIEZA' ? 'bg-rose-500' : 
                           status === 'OCUPADA' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`} />
                        <div className={`absolute bottom-0 left-0 right-0 h-1.5 ${
                           status === 'LIMPIEZA' ? 'bg-rose-500' : 
                           status === 'OCUPADA' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`} />
                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-tighter">
                          {p.codigo || p.alias?.substring(0,3).toUpperCase() || '??'}
                        </span>
                     </div>
                  );
               })}
            </div>
         </div>

         <div className="bg-blue-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-blue-600/20 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl opacity-50" />
            <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-70 mb-8">Cuadro de Mando</h4>
            <div className="flex flex-col gap-6">
                <div className="flex justify-between items-end border-b border-white/10 pb-4">
                  <div>
                    <span className="text-4xl font-black block tracking-tighter">94%</span>
                    <span className="text-[9px] font-bold uppercase tracking-widest opacity-70">Disponibilidad</span>
                  </div>
                  <div className="w-12 h-1 bg-white/20 rounded-full mb-3 overflow-hidden">
                    <div className="h-full bg-white w-3/4 rounded-full" />
                  </div>
                </div>
                <div className="flex justify-between items-end border-b border-white/10 pb-4">
                  <div>
                    <span className="text-4xl font-black block tracking-tighter">12</span>
                    <span className="text-[9px] font-bold uppercase tracking-widest opacity-70">Operarios Activos</span>
                  </div>
                  <div className="flex -space-x-1 mt-2">
                     {[1,2,3,4].map(i => <div key={i} className="w-8 h-8 rounded-full bg-blue-400 border-2 border-blue-600 shadow-lg flex items-center justify-center font-bold text-[8px]">S{i}</div>)}
                  </div>
                </div>
            </div>
            <button 
              onClick={handleSync}
              disabled={syncing}
              className="mt-10 w-full py-4 bg-white text-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 active:scale-[0.98] transition-all flex items-center justify-center gap-3 active:bg-slate-100 shadow-xl"
            >
              <RefreshCcw size={14} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Analizando iCal...' : 'Actualizar Sistema'}
            </button>
         </div>
      </aside>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc] font-['Inter'] text-slate-800 p-6">
      <header className="flex justify-between items-center bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 z-50">
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Tareas de Limpieza</h1>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Gestión, asignación y verificación de tareas</p>
        </div>

        <div className="flex items-center gap-6">
           {renderViewControls()}
           
           <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
              <button onClick={() => changeDate(-1)} className="w-8 h-8 flex items-center justify-center hover:bg-white hover:shadow-md rounded-xl transition-all text-slate-600 active:scale-90 bg-transparent"><ChevronLeft size={16}/></button>
              <div className="px-4 text-[11px] font-black text-slate-800 uppercase tracking-widest min-w-[160px] text-center border-x border-slate-200/50">
                {baseDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric', ...(viewMode === 'day' ? {day: 'numeric'} : {}) })}
              </div>
              <button onClick={() => changeDate(1)} className="w-8 h-8 flex items-center justify-center hover:bg-white hover:shadow-md rounded-xl transition-all text-slate-600 active:scale-90 bg-transparent"><ChevronRight size={16}/></button>
           </div>

           <div className="flex gap-2.5">
              <button onClick={() => onAction && onAction({ type: 'tarea', edit: null })} className="px-6 h-11 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/20 active:scale-95 transition-all flex items-center gap-2.5">
                <Plus size={16} />
                Nueva Tarea
              </button>
              <button onClick={handleSync} className="h-11 px-5 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-500 hover:text-blue-600 font-black text-[10px] uppercase tracking-widest transition-all shadow-sm hover:shadow-md gap-2">
                <RefreshCcw size={16} className={syncing ? 'animate-spin' : ''}/>
                Actualizar
              </button>
           </div>
        </div>
      </header>

      <main className="mt-8 flex-1 flex flex-col overflow-hidden">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
             <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin shadow-lg" />
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.5em] animate-pulse">Sincronizando Consola...</p>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden rounded-[3rem] border border-slate-200 bg-white shadow-2xl relative flex flex-col">
             <div className="absolute inset-0 bg-gradient-to-br from-blue-600/[0.01] to-transparent pointer-events-none" />
              {viewMode === 'table' && renderTableView()}
              {viewMode === 'day' && renderTodayView()}
              {viewMode === 'week' && <div className="p-10 h-full flex flex-col overflow-hidden">{renderWeeklyGrid()}</div>}
              {viewMode === 'month' && (
                <div className="p-10 h-full overflow-auto custom-scrollbar">
                   {/* ... (calendar grid) ... */}
                   <div className="grid grid-cols-7 border-t border-l border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                      {['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'].map(d => (
                        <div key={d} className="p-5 text-center text-[10px] font-black text-slate-400 bg-slate-50 border-r border-b border-slate-100 tracking-[0.2em]">{d}</div>
                      ))}
                      {Array.from({length: 42}, (_, i) => {
                         const startOfMonth = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
                         const firstDayIndex = (startOfMonth.getDay() + 6) % 7;
                         const dayNum = i - firstDayIndex + 1;
                         const daysInMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0).getDate();
                         const dateObj = dayNum > 0 && dayNum <= daysInMonth ? new Date(baseDate.getFullYear(), baseDate.getMonth(), dayNum) : null;
                         
                         if (!dateObj) return <div key={i} className="aspect-square bg-slate-50/20 border-r border-b border-slate-100" />;
                         
                         const dStr = dateObj.toISOString().split('T')[0];
                         const dayTasks = allTasks.filter(t => t.fecha_programada === dStr);
                         const isToday = dateObj.toDateString() === new Date().toDateString();
                         
                         return (
                           <div key={i} className={`aspect-square p-4 border-r border-b border-slate-100 hover:bg-slate-50/50 transition-all group overflow-hidden ${isToday ? 'bg-blue-50/30' : ''}`}>
                              <div className={`text-xs font-black mb-4 ${isToday ? 'text-blue-600 bg-blue-100 w-8 h-8 flex items-center justify-center rounded-xl shadow-md' : 'text-slate-500'}`}>{dateObj.getDate()}</div>
                              <div className="flex flex-col gap-2">
                                 {dayTasks.slice(0, 3).map(t => (
                                   <div key={t.id} className="flex items-center gap-2 group/task cursor-pointer">
                                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-glow" />
                                      <span className="text-[9px] text-slate-600 font-bold truncate uppercase tracking-tighter group-hover/task:text-blue-600">{t.nombre_propiedad}</span>
                                   </div>
                                 ))}
                                 {dayTasks.length > 3 && <span className="text-[8px] font-black text-blue-600 mt-1 uppercase tracking-widest">+{dayTasks.length - 3} Operativas</span>}
                              </div>
                           </div>
                         );
                      })}
                   </div>
                </div>
              )}
              {viewMode === 'inventory' && renderInventoryView()}
          </div>
        )}
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}} />
    </div>
  );
}
