import React, { useState, useMemo } from 'react';
import api from '../services/api';
import PropertyEditor_V2 from '../components/PropertyEditor_V2';
const syncIcal = (propId) => api.post(`/reservas/sync-ical/${propId}`).then(r => r.data);
const eliminarPropiedad = (id) => api.delete(`/propiedades/${id}`);

export default function PropiedadesView({ data = [], onAction, onRefresh, showToast, propietarios = [], staffList = [] }) {
  // === ESTADOS ===
  const [syncing, setSyncing] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'active', 'inactive'

  // Panel Avanzado (V2)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsProp, setSettingsProp] = useState(null);

  // === FILTRADO COMBINADO (DATOS REALES) ===
  const filteredProps = useMemo(() => {
    return data.filter(p => {
      // Filtro de Búsqueda
      const matchSearch = searchTerm 
        ? (p.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || 
           p.ciudad?.toLowerCase().includes(searchTerm.toLowerCase()))
        : true;
      
      // Filtro de Estado
      const matchStatus = 
        activeFilter === 'all' ? true :
        activeFilter === 'active' ? p.activa === true :
        activeFilter === 'inactive' ? p.activa === false : true;

      return matchSearch && matchStatus;
    });
  }, [data, searchTerm, activeFilter]);

  // === ACCIONES REALES DE API ===
  const handleSyncIcal = async (prop, e) => {
    e.stopPropagation();
    setSyncing(prop.id);
    try {
      const res = await syncIcal(prop.id);
      showToast(res.message || 'Sincronización iCal en curso');
      setTimeout(() => onRefresh(), 2000);
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al sincronizar');
    } finally {
      setSyncing(null);
    }
  };

  const copyToClipboard = (text, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text).then(() => {
      showToast('Enlace iCal copiado');
    });
  };

  const handleDelete = async (p, e) => {
    e.stopPropagation();
    const code = prompt(`Para eliminar la propiedad ${p.nombre}, escribe 'ELIMINAR'`);
    if (code === 'ELIMINAR') {
      try {
        await eliminarPropiedad(p.id);
        showToast('Propiedad eliminada correctamente');
        onRefresh();
      } catch(err) {
        alert('Error al eliminar la propiedad');
      }
    } else if (code !== null) {
      alert("Código incorrecto, operación cancelada.");
    }
  };

  const handleToggleActive = async (p) => {
    const actionDesc = p.activa ? 'desactivar (pausar)' : 'activar y publicar';
    if (confirm(`¿Estás seguro de ${actionDesc} ${p.nombre}?`)) {
      try {
        await api.put(`/propiedades/${p.id}`, { activa: !p.activa });
        showToast(`Propiedad ${!p.activa ? 'activada' : 'inactivada'} correctamente!`);
        onRefresh();
      } catch(err) {
        alert(`Error al cambiar el estado de la propiedad`);
      }
    }
  };

  // === COMPONENTES ===
  // Interruptor de Canales (Toggles)
  const ToggleSwitch = ({ active, label, iconClass, colorClass, onClick }) => (
    <div 
      className="flex items-center gap-2 group cursor-pointer" 
      title={onClick ? `Cambiar estado de ${label}` : `Conexión a ${label} (Mockup)`} 
      onClick={e => {
        e.stopPropagation();
        if (onClick) onClick();
      }}
    >
      <i className={`${iconClass} text-[14px] ${active ? colorClass : 'text-slate-300'}`}></i>
      <div className={`w-7 h-4 flex items-center bg-slate-200 rounded-full p-0.5 transition-colors ${active ? 'bg-teal-500' : ''}`}>
        <div className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${active ? 'translate-x-3' : ''}`}></div>
      </div>
    </div>
  );

  // === RENDERING DE PANTALLA COMPLETA CONDICIONAL ===
  if (isSettingsOpen) {
    return (
      <PropertyEditor_V2
        property={settingsProp}
        onClose={() => setIsSettingsOpen(false)}
        propietarios={propietarios}
        staffList={staffList}
        // Puedes pasarles onRefresh y showToast si el editor los necesita para guardar
      />
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 font-['Manrope'] overflow-hidden">
      
      {/* ══════ HEADER SUPERIOR (Buscador y Filtros) ══════ */}
      <div className="flex items-center justify-between px-8 py-5 bg-white border-b border-slate-200 shadow-sm z-10">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Propiedades</h1>
          <p className="text-sm font-medium text-slate-500 mt-0.5">Gestiona tus anuncios y canales integrados de forma centralizada.</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Buscador Global */}
          <div className="flex items-center gap-2 bg-slate-100 px-4 py-2.5 rounded-lg w-[320px] focus-within:ring-2 focus-within:ring-teal-500/50 transition-all">
            <i className="fas fa-search text-slate-400"></i>
            <input 
              type="text"
              placeholder="Buscar por nombre o ciudad..."
              className="bg-transparent border-none outline-none text-[13px] font-semibold text-slate-800 w-full placeholder:text-slate-400 placeholder:font-medium"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filtros de Estado */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg">
            <button 
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-1.5 text-[13px] font-bold rounded-md transition-all ${activeFilter === 'all' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Todas
            </button>
            <button 
              onClick={() => setActiveFilter('active')}
              className={`px-4 py-1.5 text-[13px] font-bold rounded-md transition-all ${activeFilter === 'active' ? 'bg-white shadow-sm text-teal-700' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Activas
            </button>
            <button 
              onClick={() => setActiveFilter('inactive')}
              className={`px-4 py-1.5 text-[13px] font-bold rounded-md transition-all ${activeFilter === 'inactive' ? 'bg-white shadow-sm text-rose-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Inactivas
            </button>
          </div>

          {/* Botón Principal (Teal 600 - Slate Precision) */}
          <button 
            onClick={() => { setSettingsProp(null); setIsSettingsOpen(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[13px] font-bold shadow-[0_4px_12px_rgba(13,148,136,0.3)] active:scale-95 transition-all"
          >
            <i className="fas fa-plus text-[12px]"></i>
            Nueva Propiedad
          </button>
        </div>
      </div>

      {/* ══════ LISTA ALTA DENSIDAD / GRID DE TARJETAS ══════ */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        
        {/* Cabecera Oculta Simulando Grid */}
        <div className="grid grid-cols-[auto_1fr_200px_160px_180px_120px] gap-6 px-4 pb-3 mb-2 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
          <div className="w-14 text-center">Foto</div>
          <div>Detalles e Identificación</div>
          <div>Channel Manager</div>
          <div>Métricas Locales</div>
          <div>Precios & Tareas</div>
          <div className="text-right">Ajustes</div>
        </div>

        <div className="flex flex-col gap-3">
          {filteredProps.map(p => {
             // MOCKUPS: Generamos imágenes falsas aleatorias y métricas estáticas por prop.id para visualización iGMS
             const dummyImgId = (p.id % 20) + 10;
             const photoUrlDummy = `https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=150&q=80&sig=${dummyImgId}`;
             const occupancyDummy = 60 + (p.id % 40); // 60-100%
             
             return (
              <div 
                key={p.id}
                className="group grid grid-cols-[auto_1fr_200px_160px_180px_120px] gap-6 items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-teal-500/30 transition-all cursor-pointer"
                onClick={() => { setSettingsProp(p); setIsSettingsOpen(true); }}
              >
                {/* 1. MOCKUP - Foto Miniatura */}
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 relative">
                  <img src={photoUrlDummy} alt="Preview" className="w-full h-full object-cover" />
                  <div className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${p.activa ? 'bg-teal-500' : 'bg-slate-300'}`} title={p.activa ? 'Activa' : 'Pausada'}></div>
                </div>

                {/* 2. DATOS REALES - Info Principal */}
                <div className="flex flex-col min-w-0 pr-4">
                  <span className="text-[15px] font-bold text-slate-800 truncate group-hover:text-teal-700 transition-colors">
                    {p.nombre}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">{p.ciudad || 'No Asignada'}</span>
                    <span className="text-[10px] text-slate-300">•</span>
                    <span className="text-[12px] font-medium text-slate-500 flex items-center gap-1">
                      <i className="fas fa-bed text-slate-400"></i> {p.num_habitaciones} Hab.
                    </span>
                  </div>
                  {/* MOCKUP - Reglas de Precios */}
                  <div className="mt-2">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-100 text-[10px] font-bold">
                       <i className="fas fa-bolt text-teal-500"></i>
                       Smart Pricing ON
                    </span>
                  </div>
                </div>

                {/* 3. Channel Manager Toggles */}
                <div className="flex flex-col gap-2.5">
                  <ToggleSwitch active={p.link_airbnb} label="Airbnb" iconClass="fab fa-airbnb" colorClass="text-[#FF5A5F]" />
                  <ToggleSwitch active={p.link_booking} label="Booking.com" iconClass="fas fa-suitcase" colorClass="text-[#003580]" />
                  <ToggleSwitch active={p.ical_url} label="VRBO / iCal Custom" iconClass="fas fa-link" colorClass="text-teal-500" />
                  <ToggleSwitch 
                    active={p.activa} 
                    label="Activar Unidad Manual" 
                    iconClass="fas fa-power-off" 
                    colorClass="text-teal-600"
                    onClick={() => handleToggleActive(p)}
                  />
                </div>

                {/* 4. MOCKUP - Métricas en Tiempo Real */}
                <div className="flex flex-col justify-center">
                  <div className="flex flex-col mb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ocup. Mes Actual</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-500 rounded-full" style={{ width: `${occupancyDummy}%` }}></div>
                      </div>
                      <span className="text-[12px] font-bold text-slate-700">{occupancyDummy}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="far fa-calendar-check text-[11px] text-orange-500"></i>
                    <span className="text-[11px] font-bold text-slate-600">Próx. Check-in: Hoy</span>
                  </div>
                </div>

                {/* 5. DATOS REALES - Finanzas */}
                <div className="flex flex-col gap-2 border-l border-slate-100 pl-6 h-full justify-center">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Rate Base:</span>
                    <span className="text-[13px] font-extrabold text-slate-800">${p.cobro_propietario} <span className="text-[10px] font-semibold text-slate-400">{p.moneda_cobro}</span></span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Rate Limp:</span>
                    <span className="text-[13px] font-extrabold text-teal-600">${p.tarifa_limpieza || 0}</span>
                  </div>
                </div>

                {/* 6. ACCIONES REALES - Interfaz de Configuración */}
                <div className="flex items-center justify-end gap-2 h-full">
                  {p.ical_url && (
                    <button 
                      onClick={(e) => handleSyncIcal(p, e)}
                      disabled={syncing === p.id}
                      className="w-9 h-9 rounded-full bg-slate-50 hover:bg-teal-50 text-slate-400 hover:text-teal-600 flex items-center justify-center transition-colors border border-slate-200"
                      title="Sincronizar Calendarios Ahora"
                    >
                      <i className={`fas fa-sync-alt text-[13px] ${syncing === p.id ? 'animate-spin' : ''}`}></i>
                    </button>
                  )}
                  
                  <div 
                    onClick={(e) => handleDelete(p, e)}
                    className="w-9 h-9 rounded-full bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors border border-slate-200"
                    title="Eliminar Propiedad"
                  >
                     <i className="far fa-trash-alt text-[13px]"></i>
                  </div>
                </div>

              </div>
             );
          })}

          {filteredProps.length === 0 && (
            <div className="col-span-12 flex flex-col items-center justify-center opacity-70 mt-20 mb-20 bg-white p-10 rounded-xl border border-dashed border-slate-300 relative z-0">
               <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                  <i className="fas fa-home text-teal-600 text-[40px] opacity-30"></i>
               </div>
               <h3 className="text-lg font-bold text-slate-800 tracking-tight">Anuncios no encontrados</h3>
               <p className="text-[14px] font-medium text-slate-500 mt-1 text-center max-w-[340px]">
                 No hay listados que coincidan con tu búsqueda o filtros actuales dentro del sistema de administración.
               </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
