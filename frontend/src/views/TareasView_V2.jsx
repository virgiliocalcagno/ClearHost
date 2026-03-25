import React from 'react';

/**
 * EstadoBadge_V2 - Implementación Pill-shaped según Stitch.
 */
export const EstadoBadge_V2 = ({ estado }) => {
  const styles = {
    PENDIENTE: 'bg-[#f0edef] text-[#45464d]',
    ASIGNADA_NO_CONFIRMADA: 'bg-[#ffdad6] text-[#93000a]',
    CONFIRMADA: 'bg-[#d5e0f8] text-[#131b2e]',
    COMPLETADA: 'bg-[#dae2fd] text-[#3f465c]',
    CLEAN_AND_READY: 'bg-[#62fae3] text-[#00201c]', // Accent color
    VERIFICADA: 'bg-[#005047] text-white',
    INCIDENCIA: 'bg-[#ba1a1a] text-white',
  };

  const labels = {
    PENDIENTE: 'Pendiente',
    ASIGNADA_NO_CONFIRMADA: 'Esperando Confirmación',
    CONFIRMADA: 'Asignada y Confirmada',
    COMPLETADA: 'Finalizada',
    CLEAN_AND_READY: 'Lista (Clean)',
    VERIFICADA: 'Verificada',
    INCIDENCIA: 'Incidencia',
  };

  return (
    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${styles[estado] || 'bg-gray-200 text-gray-700'}`}>
      {labels[estado] || estado}
    </span>
  );
};

export function TareasView_V2({ data, propiedades, onRefresh, onAction, handleAsignar, handleWhatsApp, staffLimpieza }) {
  const getPropName = (t) => {
    const p = propiedades?.find(pr => pr.id === t.propiedad_id);
    return p?.nombre || '—';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-[#000000]">Todas las Tareas</h2>
          <p className="text-[#545f73] font-medium mt-1">Gestión operativa y flujo de trabajo</p>
        </div>
        <button 
          onClick={() => onAction({ type: 'tarea' })}
          className="bg-[#62fae3] text-[#00201c] px-10 py-4 rounded-full font-black uppercase tracking-widest text-sm hover:scale-105 transition-all shadow-lg active:scale-95"
        >
          ＋ Nueva Tarea
        </button>
      </div>

      <div className="grid gap-3">
        {data.length === 0 ? (
          <div className="bg-[#f6f3f5] rounded-3xl p-20 text-center text-[#545f73] italic">
            No hay tareas registradas hoy.
          </div>
        ) : (
          data.map((t, i) => (
            <div 
              key={t.id} 
              className={`flex items-center justify-between p-6 rounded-3xl transition-all duration-300 hover:bg-[#e4e2e4] ${i % 2 === 0 ? 'bg-[#f6f3f5]' : 'bg-[#fcf8fa]'}`}
            >
              <div className="flex items-center gap-8">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-sm">
                  {t.tipo_tarea === 'DESINFECCION' ? '🧪' : '🧹'}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-[10px] font-black text-[#545f73] uppercase tracking-tighter bg-white/50 px-2 py-0.5 rounded">T-{t.id_secuencial}</span>
                    <h3 className="font-bold text-xl text-[#000000]">{getPropName(t)}</h3>
                  </div>
                  <p className="text-sm font-medium text-[#545f73]">Huésped: <span className="text-black font-bold">{t.nombre_huesped || '—'}</span></p>
                </div>
              </div>

              <div className="flex items-center gap-12">
                <div className="text-right">
                  <p className="text-[10px] font-black text-[#545f73] uppercase tracking-widest mb-1">Asignación</p>
                  <select
                    className="bg-transparent font-bold text-sm text-black border-none focus:ring-0 cursor-pointer text-right p-0"
                    value={t.asignado_a || ''}
                    onChange={(e) => handleAsignar(t.id, e.target.value)}
                  >
                    <option value="">⚠ Sin asignar</option>
                    {staffLimpieza.map(s => (
                      <option key={s.id} value={s.id}>{s.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="w-px h-10 bg-[#e4e2e4]" />

                <div className="flex flex-col items-center gap-2">
                  <EstadoBadge_V2 estado={t.estado} />
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => handleWhatsApp(t.id)}
                    className="w-12 h-12 bg-[#25D366]/10 text-[#25D366] rounded-full flex items-center justify-center hover:bg-[#25D366] hover:text-white transition-all shadow-sm"
                    title="WhatsApp"
                  >
                    <i className="fab fa-whatsapp text-xl"></i>
                  </button>
                  <button 
                    onClick={() => onAction({ type: 'tarea', edit: t })}
                    className="w-12 h-12 bg-black text-[#62fae3] rounded-full flex items-center justify-center hover:scale-110 transition-all shadow-md"
                  >
                    →
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
