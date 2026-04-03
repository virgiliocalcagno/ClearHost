import React, { useState, useMemo, useRef, useEffect } from 'react';
import NuevaReservaModal from '../components/NuevaReservaModal';

/**
 * CalendarioMultipleView — Réplica 1:1 del Multi-Calendario iGMS v2.0
 * Gantt horizontal: Propiedades (Y) × Días (X)
 * Datos reales: reservas del backend con check_in/check_out
 * Paleta: Curator (#131b2e, #3B82F6, #f8f9ff)
 */

const DAYS_OF_WEEK = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
const CELL_WIDTH = 110;
const ROW_HEIGHT = 52;
const PROP_COL_WIDTH = 280;

/* Colores por fuente (canal) */
const SOURCE_COLORS = {
  AIRBNB:  { bg: '#fecdd3', text: '#881337' }, // Rosado medio (Rose-200)
  BOOKING: { bg: '#dbeafe', text: '#1e3a8a' }, // Azul medio (Blue-100)
  VRBO:    { bg: '#d1fae5', text: '#064e3b' }, // Verde medio (Emerald-100)
  MANUAL:  { bg: '#fef3c7', text: '#78350f' }, // Amarillo medio (Amber-100)
  OTRO:    { bg: '#ede9fe', text: '#4c1d95' }, // Morado medio (Violet-100)
};

/* Helpers de fecha */
const addDays = (d, n) => { 
  const r = new Date(d); 
  r.setDate(r.getDate() + n); 
  r.setHours(0,0,0,0);
  return r; 
};
const diffDays = (a, b) => {
  const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.floor((utc2 - utc1) / 86400000);
};
const isSameDay = (a, b) => 
  a.getFullYear() === b.getFullYear() && 
  a.getMonth() === b.getMonth() && 
  a.getDate() === b.getDate();

const toLocalDate = (dateStr) => {
  const [y, m, d] = dateStr.split('-');
  const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
  date.setHours(0,0,0,0);
  return date;
};

export default function CalendarioMultipleView({ reservas = [], propiedades = [], onAction, onRefresh, showToast }) {
  const [localReservas, setLocalReservas] = useState(reservas);

  useEffect(() => {
    setLocalReservas(reservas);
  }, [reservas]);

  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); 
    d.setHours(0,0,0,0);
    return d;
  });
  const [numDays] = useState(14); // Dos semanas visibles
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'rates'
  
  // === ESTADOS PARA EDICIÓN EN LOTE (BULK EDIT) ===
  const [rates, setRates] = useState({}); // { "PROP_ID": { "YYYY-MM-DD": 150 } }
  const [selection, setSelection] = useState(null); // { propertyId, start, end } (dates)
  const [isDragging, setIsDragging] = useState(false);
  const [bulkPriceValue, setBulkPriceValue] = useState('');
  const [popoverPos, setPopoverPos] = useState(null); // { x, y }

  // Handlers para Selección tipo Excel
  const handleMouseDown = (propId, date, e) => {
    if (viewMode !== 'rates') return;
    setSelection({ propertyId: propId, start: date, end: date });
    setIsDragging(true);
    setPopoverPos(null);
  };

  const handleMouseEnter = (propId, date) => {
    if (!isDragging || selection?.propertyId !== propId) return;
    setSelection(prev => ({ ...prev, end: date }));
  };

  const handleMouseUp = (e) => {
    if (!isDragging || !selection) return;
    setIsDragging(false);
    // Solo mostramos el popover si capturó el rango
    setPopoverPos({ x: e.clientX, y: e.clientY });
  };

  const handleApplyBulk = () => {
    if (!selection || !bulkPriceValue) return;
    const { propertyId, start, end } = selection;
    const dStart = start < end ? start : end;
    const dEnd = start < end ? end : start;
    
    // Nueva copia inmutable del estado
    const newRates = { ...rates };
    if (!newRates[propertyId]) newRates[propertyId] = {};
    
    let cur = new Date(dStart);
    while (cur <= dEnd) {
      const ds = cur.toISOString().split('T')[0];
      newRates[propertyId][ds] = parseFloat(bulkPriceValue);
      cur.setDate(cur.getDate() + 1);
    }
    
    setRates(newRates);
    setPopoverPos(null);
    setSelection(null);
    setBulkPriceValue('');
    showToast("Tarifas actualizadas localmente", "success");
  };

  const isCellSelected = (propId, date) => {
    if (!selection || selection.propertyId !== propId) return false;
    const dStart = selection.start < selection.end ? selection.start : selection.end;
    const dEnd = selection.start < selection.end ? selection.end : selection.start;
    return date >= dStart && date <= dEnd;
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [viewDate, setViewDate] = useState(new Date(startDate));
  const datePickerRef = useRef(null);
  const scrollRef = useRef(null);
  const today = new Date();
  today.setHours(0,0,0,0);

  // Cerrar picker al clicker fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
        if (datePickerRef.current && !datePickerRef.current.contains(e.target)) {
            setShowDatePicker(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCellClick = (propId, date) => {
    const property = propiedades.find(p => p.id === propId);
    if (property && property.activa === false) {
      if (showToast) showToast('Propiedad inactiva, no se permiten reservas manuales', 'error');
      return;
    }

    // Verificar si ya hay una reserva en esa fecha (check-in)
    const isOccupied = localReservas.some(r => 
        r.propiedad_id === propId && 
        r.estado !== 'CANCELADA' &&
        date >= toLocalDate(r.check_in) && 
        date < toLocalDate(r.check_out)
    );

    if (isOccupied) return; 

    setModalData({
        propiedad_id: propId,
        check_in: date.toISOString().split('T')[0],
        check_out: addDays(date, 1).toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  /* Propiedades: usar las reales o generar fallback desde reservas */
  const effectiveProps = useMemo(() => {
    if (propiedades.length > 0) return propiedades; // Mostrar TODAS las propiedades (incluyendo inactivas)
    const uniqueIds = [...new Set(localReservas.map(r => r.propiedad_id))];
    return uniqueIds.map((id, idx) => ({ id, nombre: `Propiedad ${idx + 1}`, activa: true }));
  }, [propiedades, localReservas]);

  const filteredProps = useMemo(() =>
    effectiveProps.filter(p => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        p.nombre?.toLowerCase().includes(term) || 
        p.direccion?.toLowerCase().includes(term)
      );
    }), 
  [effectiveProps, searchTerm]);

  /* Array de días visibles */
  const days = useMemo(() =>
    Array.from({ length: numDays }, (_, i) => addDays(startDate, i)),
  [startDate, numDays]);

  /* Scroll a hoy al montar */
  /* Auto-scroll inicial (removido porque hoy es la primera columna) */
  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollLeft = 0;
    }
  }, [startDate]);

  /* Navegar */
  const goToday = () => {
    const d = new Date(); 
    d.setHours(0,0,0,0);
    setStartDate(d);
  };
  const goPrev = () => setStartDate(prev => addDays(prev, -7));
  const goNext = () => setStartDate(prev => addDays(prev, 7));

  /* Calcular barras de reserva para una propiedad */
  const getReservasForProp = (propId) => {
    return localReservas.filter(r =>
      r.propiedad_id === propId &&
      r.estado !== 'CANCELADA'
    ).map(r => {
      const ci = toLocalDate(r.check_in);
      const co = toLocalDate(r.check_out);
      const gridStart = days[0];
      const gridEnd = addDays(days[days.length - 1], 1);

      // Solo mostrar si hay intersección (se permite checkout el mismo día del gridStart)
      if (co < gridStart || ci >= gridEnd) return null;

      const startOffset = diffDays(gridStart, ci);
      const endOffset = diffDays(gridStart, co);
      
      // Lógica iGMS: Las reservas empiezan y terminan al mediodía (centro de la celda)
      const left = (startOffset + 0.5) * CELL_WIDTH;
      const width = (endOffset - startOffset) * CELL_WIDTH;

      if (width <= 0) return null;

      const isBlock = r.nombre_huesped?.toLowerCase().includes('not available');
      const colors = isBlock ? SOURCE_COLORS.OTRO : (SOURCE_COLORS[r.fuente] || SOURCE_COLORS.OTRO);
      const sourceLetter = isBlock ? 'B' : r.fuente.charAt(0);

      return {
        ...r,
        left,
        width,
        colors,
        sourceLetter,
        isBlock,
        ci,
        co
      };
    }).filter(Boolean);
  };

  const monthLabel = startDate.toLocaleDateString('es-ES', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="flex flex-col h-full">
      {/* ══════ TOOLBAR SUPERIOR — Estilo iGMS ══════ */}
      <div className="bg-white rounded-lg shadow-[0_8px_32px_rgba(11,28,48,0.06)] mb-4 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Navegación temporal */}
        <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-1 duration-500">
          <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <button onClick={goPrev} className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all border-r border-gray-100">
              <i className="fas fa-chevron-left text-[11px]"></i>
            </button>
            <button onClick={goNext} className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
              <i className="fas fa-chevron-right text-[11px]"></i>
            </button>
          </div>
          <button onClick={goToday} className="btn btn-outline" style={{ height: '39px' }}>
            Hoy
          </button>

          {/* Selector de fecha iGMS Style */}
          <div className="relative" ref={datePickerRef}>
            <button 
                onClick={() => { setShowDatePicker(!showDatePicker); setViewDate(new Date(startDate)); }}
                className="btn btn-outline min-w-[220px]"
                style={{ height: '39px' }}
            >
              <i className="far fa-calendar-alt text-[#1e88e5] text-[16px]"></i>
              <span className="ml-2 lowercase">
                {startDate.toLocaleDateString('es-ES', { month: 'long', day: '2-digit', year: 'numeric' }).replace(' de', '').replace(',', '')}
              </span>
              <i className={`fas fa-chevron-down text-gray-300 text-[10px] ml-auto transition-transform ${showDatePicker ? 'rotate-180' : ''}`}></i>
            </button>

            {showDatePicker && (
                <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-[0_40px_100px_rgba(0,0,0,0.12)] z-[100] flex border-none outline-none overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    {/* Panel Calendario (Izquierda) */}
                    <div className="p-6 w-[280px] bg-white border-none">
                        {/* Header Plano — Sin círculos ni bordes */}
                        <div className="flex items-center justify-between mb-8 px-1">
                            <button 
                                onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} 
                                className="text-[#1e88e5] transition-transform hover:scale-125 border-0 bg-transparent outline-none p-0 cursor-pointer"
                            >
                                <i className="fas fa-chevron-left text-[14px]"></i>
                            </button>
                            <span className="text-[15px] font-bold text-slate-700 lowercase">
                                {viewDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                            </span>
                            <button 
                                onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} 
                                className="text-[#1e88e5] transition-transform hover:scale-125 border-0 bg-transparent outline-none p-0 cursor-pointer"
                            >
                                <i className="fas fa-chevron-right text-[14px]"></i>
                            </button>
                        </div>

                        {/* Semana — Minimalista */}
                        <div className="grid grid-cols-7 mb-4">
                            {['S','M','T','W','T','F','S'].map((d, i) => (
                                <span key={i} className="text-[10px] font-normal text-slate-300 text-center uppercase tracking-widest">{d}</span>
                            ))}
                        </div>

                        {/* Grilla Días — TOTALMENTE PLANA SIN BORDES */}
                        <div className="grid grid-cols-7 gap-y-1">
                            {(() => {
                                const startOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
                                const endOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
                                const startOffset = startOfMonth.getDay();
                                const daysInMonth = endOfMonth.getDate();
                                const prevMonthEnd = new Date(viewDate.getFullYear(), viewDate.getMonth(), 0).getDate();
                                
                                return [
                                    ...Array.from({ length: startOffset }, (_, i) => ({ 
                                        day: prevMonthEnd - startOffset + i + 1, 
                                        current: false, 
                                        date: new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, prevMonthEnd - startOffset + i + 1)
                                    })),
                                    ...Array.from({ length: daysInMonth }, (_, i) => ({ 
                                        day: i + 1, 
                                        current: true, 
                                        date: new Date(viewDate.getFullYear(), viewDate.getMonth(), i + 1)
                                    })),
                                    ...Array.from({ length: 42 - (startOffset + daysInMonth) }, (_, i) => ({ 
                                        day: i + 1, 
                                        current: false, 
                                        date: new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, i + 1)
                                    }))
                                ].slice(0, 42).map((dObj, i) => {
                                    const isSel = isSameDay(dObj.date, startDate);
                                    const isTod = isSameDay(dObj.date, today);
                                    
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => {
                                                setStartDate(dObj.date);
                                                setShowDatePicker(false);
                                            }}
                                            style={{
                                                backgroundColor: isSel ? '#e3f2fd' : 'transparent',
                                                color: isSel ? '#0d47a1' : (isTod ? '#1e88e5' : (dObj.current ? '#475569' : '#e2e8f0')),
                                                border: isSel ? '1px solid #1e88e5' : 'none'
                                            }}
                                            className={`h-9 w-9 text-[13px] flex items-center justify-center border-0 outline-none m-0 p-0 transition-all rounded-full ${
                                                isSel ? 'font-black scale-110 shadow-sm' : 
                                                isTod ? 'font-black underline underline-offset-4' :
                                                'hover:bg-blue-50/50'
                                            }`}
                                        >
                                            {dObj.day}
                                        </button>
                                    );
                                });
                            })()}
                        </div>
                    </div>

                    {/* Panel Meses — TEXTO PLANO / SIN CAJAS */}
                    <div className="bg-[#fcfcfb] border-l border-slate-50 p-6 w-[150px] flex flex-col items-center">
                        <span className="text-[12px] font-bold text-slate-200 mb-6 tracking-[3px]">{viewDate.getFullYear()}</span>
                        <div className="flex flex-col gap-5 w-full overflow-y-auto max-h-[380px] pr-2 custom-scrollbar-mini">
                            {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map((mName, mi) => (
                                <button
                                    key={mi}
                                    onClick={() => setViewDate(new Date(viewDate.getFullYear(), mi, 1))}
                                    className={`text-center text-[14px] border-0 bg-transparent outline-none p-0 transition-all cursor-pointer ${
                                        viewDate.getMonth() === mi ? 'text-[#1e88e5] font-black scale-105' : 'text-slate-400 hover:text-[#1e88e5]'
                                    }`}
                                >
                                    {mName}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
          </div>

          {/* Toggle vista — Estilo iGMS Soft */}
          <div className="flex items-center bg-gray-50 border border-gray-100 rounded-lg p-1">
            <button 
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[13px] font-medium transition-all ${
                viewMode === 'calendar' ? 'bg-white text-blue-600 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <i className="far fa-calendar-alt"></i>
              Calendario
            </button>
            <button 
              onClick={() => setViewMode('rates')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[13px] font-medium transition-all ${
                viewMode === 'rates' ? 'bg-white text-blue-600 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <i className="fas fa-dollar-sign"></i>
              Tasas
            </button>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
                setModalData({});
                setIsModalOpen(true);
            }}
            className="btn btn-primary"
          >
            <i className="fas fa-plus"></i>
            Nueva Reserva
          </button>
        </div>
      </div>

      {/* ══════ GRILLA GANTT — Estilo iGMS ══════ */}
      <div className="flex-1 bg-white rounded-lg shadow-[0_8px_32px_rgba(11,28,48,0.06)] overflow-hidden flex flex-col">
        <div className="flex flex-1 overflow-hidden">
          {/* 1) Columna de Propiedades (sticky left) */}
          <div className="flex-shrink-0" style={{ width: PROP_COL_WIDTH }}>
            {/* Header de búsqueda */}
            <div className="h-[72px] border-b border-[#eff4ff] flex items-center px-4">
              <div className="boton-igms-estilo w-full gap-2 px-3 py-2 shadow-none cursor-text">
                <i className="fas fa-search text-slate-300 text-[12px]"></i>
                <input
                  type="text"
                  placeholder="Nombre o dirección..."
                  className="bg-transparent text-[13px] font-medium text-slate-700 outline-none w-full placeholder-slate-300 pointer-events-auto"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            {/* Lista de propiedades */}
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 260px)' }}>
              {filteredProps.map((p, idx) => (
                <div
                  key={p.id}
                  className={`border-b border-[#eff4ff] ${p.activa === false ? 'bg-slate-50 opacity-70 grayscale-[50%]' : 'bg-white'} flex flex-col transition-all`}
                  style={{ height: viewMode === 'rates' ? ROW_HEIGHT * 2 : ROW_HEIGHT }}
                >
                  <div 
                    className="flex items-center gap-3 px-4 hover:bg-[#eff4ff]/50 transition-colors cursor-pointer w-full flex-shrink-0"
                    style={{ height: ROW_HEIGHT }}
                  >
                    {/* Indicador de canal */}
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      p.activa === false ? 'bg-slate-300' :
                      p.link_airbnb ? 'bg-[#F43F5E]' :
                      p.link_booking ? 'bg-[#2563EB]' : 'bg-[#312e81]'
                    }`}></span>
                    {/* Icono */}
                    <i className={`fas fa-home text-[13px] ${p.activa === false ? 'text-slate-300' : 'text-[#7c839b]'}`}></i>
                    {/* Nombre */}
                    <div className="flex flex-col min-w-0">
                      <span className={`text-[13px] font-medium truncate ${p.activa === false ? 'text-[#7c839b] line-through' : 'text-[#0b1c30]'}`}>{p.nombre}</span>
                      {p.activa === false && <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest no-underline mt-0.5">Inactiva</span>}
                    </div>
                    
                    {/* Extra labels in rates mode shown in right side of the row */}
                    {viewMode === 'rates' && (
                       <span className="text-[10px] font-bold text-[#7c839b] uppercase ml-auto tracking-wider">Disp.</span>
                    )}
                  </div>
                  {viewMode === 'rates' && (
                    <div className="flex items-center px-4 bg-[#f8f9ff]/50 w-full flex-shrink-0" style={{ height: ROW_HEIGHT }}>
                       <span className="text-[10px] font-bold text-[#7c839b] uppercase ml-auto tracking-wider">Tarifa Base</span>
                    </div>
                  )}
                </div>
              ))}
              {filteredProps.length === 0 && (
                <div className="flex items-center justify-center py-12 text-[#7c839b]">
                  <span className="text-[12px] font-medium">Sin propiedades</span>
                </div>
              )}
            </div>
          </div>

          {/* 2) Grilla de días + barras */}
          <div className="flex-1 overflow-x-auto overflow-y-auto" ref={scrollRef}>
            <div style={{ minWidth: numDays * CELL_WIDTH }}>
              {/* Header de días */}
              <div className="h-[72px] border-b border-[#eff4ff] flex sticky top-0 bg-white z-10">
                {days.map((day, i) => {
                  const isToday = isSameDay(day, today);
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                  return (
                      <div
                        key={i}
                        className={`flex flex-col items-center justify-center border-l border-[#eff4ff] transition-colors ${
                          isToday ? 'bg-[#FEF3C7]' : isWeekend ? 'bg-[#f8f9ff]' : ''
                        }`}
                        style={{ width: CELL_WIDTH, minWidth: CELL_WIDTH }}
                      >
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${
                          isToday ? 'text-[#B45309]' : 'text-[#7c839b]'
                        }`}>
                          {DAYS_OF_WEEK[day.getDay()]}
                        </span>
                        <span className={`text-[18px] font-bold mt-0.5 ${
                          isToday ? 'text-[#B45309]' : 'text-[#0b1c30]'
                        }`}>
                          {day.getDate()}
                        </span>
                        {/* Indicador de mes cuando cambia */}
                        {(i === 0 || day.getDate() === 1) && (
                          <span className={`text-[8px] font-bold uppercase ${isToday ? 'text-[#B45309]/70' : 'text-[#7c839b]'}`}>
                            {day.toLocaleDateString('es-ES', { month: 'short' })}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
  
                {/* Filas de propiedades con barras o tarifas */}
                {filteredProps.map((p) => {
                  const bars = getReservasForProp(p.id);
                  return (
                    <div key={p.id} className="relative border-b border-[#eff4ff] flex flex-col transition-all" style={{ height: viewMode === 'rates' ? ROW_HEIGHT * 2 : ROW_HEIGHT }}>
                      {viewMode === 'calendar' ? (
                        <div className="flex w-full h-full relative">
                          {/* Celdas de fondo */}
                          {days.map((day, i) => {
                            const isToday = isSameDay(day, today);
                            return (
                              <div
                                key={i}
                                onClick={() => handleCellClick(p.id, day)}
                                className={`border-l border-[#eff4ff]/40 cursor-cell hover:bg-blue-50/20 transition-colors ${
                                  isToday ? 'bg-[#FFFBEB]' : ''
                                }`}
                                style={{ width: CELL_WIDTH, minWidth: CELL_WIDTH, height: ROW_HEIGHT }}
                              />
                            );
                          })}

                        {/* Barras de reserva superpuestas */}
                        {bars.map((bar, bi) => (
                          <div
                            key={bi}
                            onClick={(e) => {
                                e.stopPropagation();
                                setModalData(bar);
                                setIsModalOpen(true);
                            }}
                            className="absolute top-[10px] flex items-center px-4 gap-2 cursor-pointer transition-transform group shadow-md shadow-black/5 overflow-hidden"
                            style={{
                              left: bar.left,
                              width: bar.width,
                              height: ROW_HEIGHT - 20,
                              backgroundColor: bar.colors.bg,
                              color: bar.colors.text,
                              zIndex: 10,
                              clipPath: 'polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)' 
                            }}
                            title={`${bar.nombre_huesped}\n${bar.check_in} → ${bar.check_out} (${bar.fuente})`}
                          >
                             {/* Icono de fuente: Fondo sutil a juego con el texto */}
                             <div 
                                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0"
                                style={{ backgroundColor: bar.colors.text, color: bar.colors.bg }}
                             >
                                {bar.sourceLetter}
                             </div>
                             
                             <div className="flex flex-col min-w-0">
                               <span className="text-[12px] font-extrabold truncate tracking-tight leading-none uppercase">
                                  {bar.nombre_huesped}
                               </span>
                             </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col h-full w-full">
                        {/* Fila 1: Disponibilidad */}
                        <div className="flex w-full flex-shrink-0" style={{ height: ROW_HEIGHT }}>
                          {days.map((day, i) => {
                            const isBlocked = bars.some(b => day >= b.ci && day < b.co);
                            return (
                              <div 
                                key={`disp-${i}`} 
                                className={`border-l border-b border-[#eff4ff] flex items-center justify-center transition-colors ${isBlocked ? 'bg-[#ffdce0]' : 'bg-white hover:bg-[#eff4ff]/30'}`} 
                                style={{ width: CELL_WIDTH, minWidth: CELL_WIDTH }}
                              >
                                {isBlocked ? (
                                  <div className="flex items-center gap-1.5 text-[#e02424]">
                                    <i className="fas fa-lock text-[10px]"></i>
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Cerrado</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1 text-[#10B981]">
                                    <i className="fas fa-check text-[10px]"></i>
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Abierto</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        {/* Fila 2: Tarifa (Editada por el usuario o base) */}
                        <div className="flex w-full flex-shrink-0" style={{ height: ROW_HEIGHT }}>
                          {days.map((day, i) => {
                            const ds = day.toISOString().split('T')[0];
                            const isToday = isSameDay(day, today);
                            const selected = isCellSelected(p.id, day);
                            
                            // Lógica de precio: Prioridad Estado Local -> Propiedad -> Cálculo Base
                            const currentRate = rates[p.id]?.[ds] || 
                                          (p.tarifa_limpieza ? (p.tarifa_limpieza * 2) : 1200) + 
                                          (day.getDay() === 0 || day.getDay() === 6 ? 350 : 0);

                            return (
                              <div 
                                key={`rate-${i}`} 
                                onMouseDown={(e) => handleMouseDown(p.id, day, e)}
                                onMouseEnter={() => handleMouseEnter(p.id, day)}
                                onMouseUp={handleMouseUp}
                                data-date={ds}
                                data-property-id={p.id}
                                className={`border-l border-[#eff4ff] flex items-center justify-center relative group cursor-cell transition-all 
                                  ${isToday ? 'bg-[#FFF8E1]/30' : 'bg-[#f8f9ff]/50'} 
                                  ${selected ? 'cell-selecting' : 'hover:bg-white hover:shadow-[inset_0_0_0_2px_#3B82F6] hover:z-10'}
                                `} 
                                style={{ width: CELL_WIDTH, minWidth: CELL_WIDTH }}
                              >
                                <span className={`text-[13px] font-bold price-value ${selected ? 'text-blue-700 font-black' : 'text-[#0b1c30]'}`}>
                                  ${currentRate}
                                </span>
                                {!selected && <i className="fas fa-pencil-alt absolute top-1.5 right-1.5 text-[#3B82F6] text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"></i>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer con leyenda */}
        <div className="h-10 border-t border-[#eff4ff] flex items-center px-6 gap-6 bg-[#f8f9ff]">
          {Object.entries(SOURCE_COLORS).map(([key, val]) => (
            <div key={key} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: val.bg }}></span>
              <span className="text-[10px] font-semibold text-[#7c839b] uppercase tracking-wider">{key}</span>
            </div>
          ))}
          <div className="ml-auto text-[10px] font-medium text-[#7c839b]">
            {localReservas.filter(r => r.estado !== 'CANCELADA').length} reservas activas · {filteredProps.length} propiedades
          </div>
        </div>
      </div>

      {/* 📥 POPOVER DE EDICIÓN MASIVA — iGMS GLASS STYLE */}
      {popoverPos && (
        <div 
          className="bulk-price-popover"
          style={{ top: popoverPos.y + 10, left: popoverPos.x - 100 }}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nueva Tarifa</span>
            <button onClick={() => { setSelection(null); setPopoverPos(null); }} className="text-slate-400 hover:text-slate-600">
               <i className="fas fa-times text-[12px]"></i>
            </button>
          </div>
          
          <div className="bulk-price-input-group">
            <span>$</span>
            <input 
               autoFocus
               type="number" 
               placeholder="0.00" 
               value={bulkPriceValue}
               onChange={(e) => setBulkPriceValue(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleApplyBulk()}
            />
          </div>

          <div className="flex flex-col gap-1.5 mt-1">
             <button 
                onClick={handleApplyBulk}
                className="btn btn-primary w-full py-2.5 h-auto text-[13px]"
             >
               Aplicar Cambio
             </button>
             <button 
                onClick={() => { setSelection(null); setPopoverPos(null); }}
                className="btn btn-ghost w-full py-1.5 h-auto text-[12px] font-medium text-slate-400"
             >
               Cancelar
             </button>
          </div>
        </div>
      )}
      {isModalOpen && (
        <NuevaReservaModal 
          propiedades={propiedades} 
          onClose={() => {
              setIsModalOpen(false);
              setModalData({});
          }} 
          onRefresh={(savedData, action) => {
            if (savedData && action) {
              if (action === 'CREATE') {
                setLocalReservas(prev => [...prev, savedData]);
              } else if (action === 'UPDATE') {
                setLocalReservas(prev => prev.map(r => r.id === savedData.id ? savedData : r));
              } else if (action === 'DELETE') {
                setLocalReservas(prev => prev.filter(r => r.id !== savedData.id));
              }
            }
            if (onRefresh) onRefresh();
          }} 
          showToast={showToast}
          initialData={modalData}
        />
      )}
    </div>
  );
}
