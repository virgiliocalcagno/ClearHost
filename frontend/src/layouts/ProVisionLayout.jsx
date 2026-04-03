import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * ProVisionLayout — Réplica 1:1 iGMS + Paleta "Architectural Curator"
 * Iconos: Font Awesome 6 (exactos como iGMS)
 * Colores: primary_container #131b2e, secondary #3B82F6, surface #f8f9ff
 */
const ProVisionLayout = ({ children, activeModule = 'Tablero', user = { name: 'Admin Pro', initials: 'VC' } }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  /* Módulos en español con iconos Material Symbols */
  const menuItems = [
    { id: 'tablero', label: 'Tablero', icon: 'dashboard' },
    { id: 'inbox', label: 'Inbox', icon: 'inbox' },
    { id: 'dispositivos', label: 'Dispositivos', icon: 'devices' },
    { id: 'calendario', label: 'Calendario', icon: 'calendar_month' },
    { id: 'reseñas', label: 'Reseñas', icon: 'reviews' },
    { id: 'tareas', label: 'Tareas', icon: 'task' },
    { id: 'equipo', label: 'Equipo', icon: 'group' },
    { id: 'registros', label: 'Registros', icon: 'recent_actors' },
    { id: 'anuncios', label: 'Anuncios', icon: 'campaign' },
    { id: 'propiedades', label: 'Propiedades', icon: 'home' },
    { id: 'directo', label: 'Ventas', icon: 'storefront' },
    { id: 'sitios', label: 'Web', icon: 'public' },
    { id: 'claves', label: 'Claves', icon: 'key' },
    { id: 'informes', label: 'Informes', icon: 'analytics' },
    { id: 'documentos', label: 'Docs', icon: 'description' },
  ];

  return (
    <div className="flex min-h-screen bg-bg-main font-body text-text-main antialiased overflow-hidden">
      {/* ══════ SIDEBAR ORIGINAL ADMIN PRO ══════ */}
      <aside className="w-64 bg-bg-sidebar flex flex-col z-50 shadow-xl shadow-black/20">
        {/* Branding Area - Admin Pro Style */}
        <div className="p-6 border-b border-slate-700/50 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white ring-2 ring-white/10 shadow-lg font-bold text-sm">
            {user.initials}
          </div>
          <div className="flex flex-col">
            <span className="text-white font-bold text-[15px] leading-tight">Admin Pro</span>
            <span className="text-slate-400 text-[9px] font-black tracking-widest uppercase opacity-70">Gestión Profesional</span>
          </div>
          <button className="ml-auto text-slate-500 hover:text-white transition-colors">
            <span className="material-symbols-outlined text-[18px]">push_pin</span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto hide-scrollbar flex flex-col px-3">
          {menuItems.map((item) => {
            const isActive = activeModule.toLowerCase().includes(item.id);
            return (
              <button
                key={item.id}
                onClick={() => navigate(`/pro-control/${item.id}`)}
                className={`w-full flex items-center px-4 py-3 rounded-lg transition-all duration-200 group mb-1
                  ${isActive
                    ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`}
              >
                <span className={`material-symbols-outlined text-[20px] ${isActive ? 'font-fill' : 'opacity-70 group-hover:opacity-100'}`}>
                  {item.icon}
                </span>
                <span className={`ml-3 text-[13px] font-medium tracking-wide`}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50"></div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Action Toggle */}
        <div className="p-4 border-t border-slate-700/50">
          <div className="flex items-center justify-between px-2 mb-4">
            <button className="text-slate-500 hover:text-white"><span className="material-symbols-outlined text-xl">settings</span></button>
            <button className="text-slate-500 hover:text-white"><span className="material-symbols-outlined text-xl">logout</span></button>
          </div>
          <button className="w-full h-8 bg-amber-500/10 text-amber-500 rounded-md text-[10px] font-black uppercase tracking-tighter border border-amber-500/20">
            Unirse al Seminario Web
          </button>
        </div>
      </aside>

      {/* ══════ MAIN CONTENT ══════ */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Simple Original Header */}
        <header className="h-16 flex justify-between items-center px-8 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40">
          <div className="flex-1"></div>
          
          <div className="flex flex-col items-center">
            <h2 className="text-[15px] font-bold text-slate-800 tracking-tight capitalize">{activeModule.replace('/pro-control/', '') || 'Tareas'}</h2>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Abril de 2026</span>
          </div>

          <div className="flex-1 flex justify-end items-center gap-3">
             <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <span className="material-symbols-outlined text-xl">sync</span>
            </button>
            <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-1.5 rounded-md font-bold text-[12px] shadow-lg shadow-blue-600/20 hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[18px]">calendar_month</span>
              Calendario
            </button>
          </div>
        </header>

        {/* Content Canvas */}
        <section className="flex-1 overflow-y-auto hide-scrollbar p-8">
          <div className="max-w-[1400px] mx-auto">
            {children}
          </div>
        </section>
      </main>
    </div>
  );
};

export default ProVisionLayout;
