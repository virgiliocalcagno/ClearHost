export function EstadoBadge({ estado }) {
  const map = {
    PENDIENTE: { cls: 'admin-badge-warning', txt: '⏳ En Bolsa' },
    ASIGNADA_NO_CONFIRMADA: { cls: 'admin-badge-warning', txt: '🔔 Por Confirmar' },
    ACEPTADA: { cls: 'admin-badge-success', txt: '✅ Confirmada' },
    EN_PROGRESO: { cls: 'admin-badge-info', txt: '▶ En Progreso' },
    CLEAN_AND_READY: { cls: 'admin-badge-success', txt: '✓ Clean & Ready' },
    COMPLETADA: { cls: 'admin-badge-success', txt: '✓ Completada' },
    VERIFICADA: { cls: 'admin-badge-purple', txt: '✦ Verificada' },
  };
  const s = map[estado] || map.PENDIENTE;
  return <span className={`admin-badge ${s.cls}`}>{s.txt}</span>;
}

export function EstadoReservaBadge({ estado }) {
  const map = {
    CONFIRMADA: { cls: 'admin-badge-success', txt: '✓ Confirmada' },
    CANCELADA: { cls: 'admin-badge-error', txt: '✕ Cancelada' },
    COMPLETADA: { cls: 'admin-badge-neutral', txt: '✓ Completada' },
  };
  const s = map[estado] || map.CONFIRMADA;
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
  const s = map[fuente] || map.MANUAL;
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
  const s = map[estado] || map.PENDIENTE;
  return <span className={`admin-badge ${s.cls}`}>{s.txt}</span>;
}
