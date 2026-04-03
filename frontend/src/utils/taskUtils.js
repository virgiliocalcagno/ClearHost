/**
 * Calcula el nivel de prioridad para el semáforo de urgencia usando JS Nativo.
 * @param {string} dateStr - 'YYYY-MM-DD'
 * @param {string} timeStr - 'HH:MM:SS' o 'HH:MM'
 * @returns {object} - { level: 'URGENCIA'|'ALTA'|'MEDIA'|'BAJA', className: string, pulse: boolean }
 */
export const getTaskPriority = (dateStr, timeStr) => {
  if (!dateStr) return { level: 'BAJA', className: 'bg-emerald-500 text-white', pulse: false };
  
  const taskDate = new Date(`${dateStr}T${timeStr || '11:00:00'}`);
  const now = new Date();
  
  // Diferencia en milisegundos a horas
  const diffMs = taskDate - now;
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 0) {
    return { level: 'VENCIDA', className: 'bg-slate-900 text-white', pulse: false };
  }

  if (diffHours < 12) {
    return { level: 'URGENCIA', className: 'bg-red-600 text-white animate-pulse', pulse: true };
  }
  if (diffHours < 24) {
    return { level: 'ALTA', className: 'bg-red-500 text-white', pulse: false };
  }
  if (diffHours < 48) {
    return { level: 'MEDIA', className: 'bg-amber-400 text-slate-900', pulse: false };
  }
  return { level: 'BAJA', className: 'bg-emerald-500 text-white', pulse: false };
};

/**
 * Formatea el número de teléfono con prefijo internacional si falta.
 * @param {string} phone 
 * @returns {string}
 */
export const formatWhatsAppPhone = (phone) => {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  
  // Si tiene 10 dígitos y no empieza con +, asumimos México (+52)
  if (cleaned.length === 10) {
    return `52${cleaned}`; 
  }
  return cleaned;
};
