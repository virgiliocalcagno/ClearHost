export function EstadoBadge({ estado }) {
  const map = {
    PENDIENTE: { cls: 'admin-badge-warning', txt: '⏳ Disponible' },
    ASIGNADA_NO_CONFIRMADA: { cls: 'admin-badge-warning', txt: '🔔 Por Confirmar' },
    ACEPTADA: { cls: 'admin-badge-success', txt: '✅ Confirmada' },
    EN_PROGRESO: { cls: 'admin-badge-info', txt: '▶ En Progreso' },
    CLEAN_AND_READY: { cls: 'admin-badge-success', txt: '✓ Clean & Ready' },
    COMPLETADA: { cls: 'admin-badge-success', txt: '✓ Completada' },
    VERIFICADA: { cls: 'admin-badge-purple', txt: '✦ Verificada' },
  };
  const s = map[estado?.toUpperCase()] || map.PENDIENTE;
  return <span className={`admin-badge ${s.cls}`}>{s.txt}</span>;
}

export function EstadoReservaBadge({ estado }) {
  const map = {
    CONFIRMADA: { cls: 'admin-badge-success', txt: '✓ Confirmada' },
    CANCELADA: { cls: 'admin-badge-error', txt: '✕ Cancelada' },
    COMPLETADA: { cls: 'admin-badge-neutral', txt: '✓ Completada' },
  };
  const s = map[estado?.toUpperCase()] || map.CONFIRMADA;
  return <span className={`admin-badge ${s.cls}`}>{s.txt}</span>;
}

export function FuenteBadge({ fuente }) {
  const map = {
    AIRBNB: { cls: 'admin-badge-error', txt: 'Airbnb' },
    BOOKING: { cls: 'admin-badge-info', txt: 'Booking' },
    VRBO: { cls: 'admin-badge-purple', txt: 'VRBO' },
    MANUAL: { cls: 'admin-badge-neutral', txt: 'Manual' },
    OTRO: { cls: 'admin-badge-neutral', txt: 'Otro' },
  };
  const s = map[fuente?.toUpperCase()] || map.MANUAL;
  return <span className={`admin-badge ${s.cls}`}>{s.txt}</span>;
}

export function EstadoIncidenciaBadge({ estado }) {
  const map = {
    PENDIENTE: { cls: 'admin-badge-warning', txt: 'Esperando Admin' },
    ENVIADO_A_DUENO: { cls: 'admin-badge-info', txt: 'Enviado al Dueño' },
    APROBADO: { cls: 'admin-badge-success', txt: 'Aprobado para Reparar' },
    RECHAZADO: { cls: 'admin-badge-error', txt: 'Rechazado' },
    COMPLETADO: { cls: 'admin-badge-purple', txt: 'Reparado / Terminado' },
    PAGADO: { cls: 'admin-badge-success', txt: 'Pagado' },
  };
  const s = map[estado?.toUpperCase()] || map.PENDIENTE;
  return <span className={`admin-badge ${s.cls}`}>{s.txt}</span>;
}

/**
 * EstadoBadge_V2 - Architectural Precision Status Indicator
 * Refined for high-density dashboards.
 */
export function EstadoBadge_V2({ estado }) {
  const getStatusLabelClass = (estado) => {
    switch (estado?.toUpperCase()) {
      case 'PENDIENTE': return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'CONFIRMADA': 
      case 'ACEPTADA': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'COMPLETADA': 
      case 'CLEAN_AND_READY': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'VERIFICADA': return 'bg-purple-50 text-purple-600 border-purple-200';
      case 'EN_PROGRESO': return 'bg-sky-50 text-sky-600 border-sky-200';
      case 'CANCELADA': return 'bg-slate-100 text-slate-500 border-slate-300 line-through opacity-60';
      default: return 'bg-gray-50 text-gray-400 border-gray-200';
    }
  };

  const getStatusText = (estado) => {
    const labels = {
      PENDIENTE: '⏳ Pendiente',
      CONFIRMADA: '✅ Confirmada',
      ACEPTADA: '✅ Aceptada',
      COMPLETADA: '✓ Completada',
      CLEAN_AND_READY: '✓ Listo',
      VERIFICADA: '✦ Verificada',
      ASIGNADA_NO_CONFIRMADA: '🔔 Por Confirmar',
      EN_PROGRESO: '▶ En Progreso',
      CANCELADA: '✕ Cancelada'
    };
    return labels[estado?.toUpperCase()] || estado;
  };

  return (
    <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${getStatusLabelClass(estado)}`}>
      {getStatusText(estado)}
    </span>
  );
}
