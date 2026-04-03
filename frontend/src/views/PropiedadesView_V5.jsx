import React, { useState } from 'react';

/**
 * PropiedadesView_V5 — "Architectural Curator" Color Skin
 * Estructura: iGMS lista de propiedades (sin cambios)
 * Paleta: secondary #3B82F6, surface #f8f9ff, on_surface #0b1c30
 * Regla No-Line: sin bordes 1px, solo shifts tonales y ghost borders al 15%
 */
export default function PropiedadesView_V5({ data, onAction, showToast }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = data.filter(p =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.direccion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 font-inter">

      {/* Toolbar — surface_container_lowest (#fff) on surface (#f8f9ff) */}
      <div className="bg-white p-4 rounded-lg shadow-[0_8px_32px_rgba(11,28,48,0.06)] flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative group w-full md:w-[450px]">
          <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-[#7c839b] group-focus-within:text-[#3B82F6] transition-colors text-[14px]"></i>
          <input
            type="text"
            placeholder="Filtrar por nombre o dirección..."
            className="w-full pl-11 pr-4 py-2.5 bg-[#eff4ff] text-[14px] font-medium text-[#0b1c30] border-none rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-[#3B82F6]/40 transition-all placeholder-[#7c839b]"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <button
            onClick={() => onAction({ type: 'propiedad' })}
            className="flex-1 md:flex-none bg-[#3B82F6] text-white px-6 py-2.5 rounded-lg text-[13px] font-bold hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <i className="fas fa-plus-circle text-[14px]"></i>
            Nueva Propiedad
          </button>
          <button className="p-2.5 bg-[#eff4ff] rounded-lg text-[#7c839b] hover:text-[#0b1c30] hover:bg-[#dce9ff] transition-all flex items-center justify-center">
            <i className="fas fa-sort text-[14px]"></i>
          </button>
        </div>
      </div>

      {/* Property List — surface_container_lowest (#fff) */}
      <div className="bg-white rounded-lg shadow-[0_8px_32px_rgba(11,28,48,0.06)] overflow-hidden">

        {/* Table Header — surface_container_low (#eff4ff) */}
        <div className="grid grid-cols-[1fr_150px_150px_100px] gap-4 px-10 py-4 bg-[#eff4ff] uppercase tracking-[0.05em]">
          <span className="text-[10px] font-bold text-[#7c839b]">Propiedad</span>
          <span className="text-[10px] font-bold text-[#7c839b] text-center">Canales</span>
          <span className="text-[10px] font-bold text-[#7c839b] text-center">Liquidación</span>
          <span className="text-[10px] font-bold text-[#7c839b] text-right">Acciones</span>
        </div>

        {/* Rows — alternating tonal backgrounds (no divider lines) */}
        <div>
          {filtered.map((p, idx) => (
            <div
              key={p.id}
              className={`grid grid-cols-[1fr_150px_150px_100px] items-center gap-4 px-10 py-6 transition-colors group
                ${idx % 2 === 0 ? 'bg-white' : 'bg-[#f8f9ff]'}
                hover:bg-[#eff4ff]`}
            >
              {/* Identity */}
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-lg bg-[#eff4ff] text-[#7c839b] flex items-center justify-center font-semibold text-lg group-hover:bg-[#3B82F6]/10 group-hover:text-[#3B82F6] transition-all">
                  {p.nombre.charAt(0)}
                </div>
                <div className="min-w-0">
                  <button
                    onClick={() => onAction({ type: 'propiedad', edit: p })}
                    className="text-[15px] font-semibold text-[#0b1c30] hover:text-[#3B82F6] transition-colors block text-left truncate leading-tight"
                  >
                    {p.nombre}
                  </button>
                  <p className="text-[11px] font-medium text-[#7c839b] mt-0.5 truncate uppercase tracking-[0.05em]">
                    {p.direccion}
                  </p>
                </div>
              </div>

              {/* Channel Indicators — secondary_container style */}
              <div className="flex justify-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-[#3B82F6]/10 text-[#3B82F6] flex items-center justify-center font-bold text-[10px]" title="Airbnb">A</span>
                <span className="w-8 h-8 rounded-lg bg-[#3B82F6]/10 text-[#3B82F6] flex items-center justify-center font-bold text-[10px]" title="Booking">B</span>
                <span className="w-8 h-8 rounded-lg bg-[#eff4ff] text-[#7c839b]/40 flex items-center justify-center font-bold text-[10px]">E</span>
              </div>

              {/* Financial Grid */}
              <div className="flex justify-center items-center gap-4">
                <div className="text-center">
                  <span className="block text-[8px] font-bold text-[#7c839b] uppercase tracking-[0.05em] leading-none mb-1">Dueño</span>
                  <span className="text-[14px] font-semibold text-[#0b1c30]">${p.cobro_propietario}</span>
                </div>
                <div className="w-[1px] h-4 bg-[#0b1c30]/10"></div>
                <div className="text-center">
                  <span className="block text-[8px] font-bold text-[#7c839b] uppercase tracking-[0.05em] leading-none mb-1">Staff</span>
                  <span className="text-[14px] font-semibold text-[#0b1c30]">${p.pago_staff}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end pr-2">
                <button
                  onClick={() => onAction({ type: 'propiedad', edit: p })}
                  className="w-10 h-10 rounded-lg bg-white text-[#7c839b] hover:text-[#3B82F6] shadow-[0_8px_32px_rgba(11,28,48,0.06)] transition-all flex items-center justify-center border border-[#0b1c30]/[0.15]"
                  title="Configuración"
                >
                  <i className="fas fa-cog text-[14px]"></i>
                </button>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="py-24 text-center bg-[#f8f9ff]">
              <i className="far fa-chart-bar text-6xl text-[#dce9ff] block mb-4"></i>
              <p className="text-[13px] font-bold text-[#7c839b] uppercase tracking-[0.3em]">Sin propiedades</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
