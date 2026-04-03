import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, Info, Calendar, MapPin, Edit2, User, Clock, 
  Trash2, Settings, Tag, Home, Search, HelpCircle,
  AlertCircle, DollarSign, Percent, CheckCircle, 
  Link, Link2, Share2, Plus, Minus, Type, Layers, List, AlignLeft, EyeOff, ShieldAlert,
  MessageSquare, FileText, Sparkles, Image, MoreHorizontal, X, Save, ArrowRight
} from 'lucide-react';

const PropertyEditor_V2 = ({ initialData, onSave, onCancel, propietarios = [], staffList = [] }) => {
  const property = initialData || {};
  
  // === ESTADOS ======
  const [activeTab, setActiveTab] = useState('general');
  const [nivelGestion, setNivelGestion] = useState('ninguno');
  
  // Toggles de Sigiloso
  const [pauseMessages, setPauseMessages] = useState(false);
  const [pauseTasks, setPauseTasks] = useState(false);

  // Toggles de Precios
  const [smartPricing, setSmartPricing] = useState(true);

  // Toggles Limpieza
  const [autoCleaning, setAutoCleaning] = useState(true);
  const [requirePhotos, setRequirePhotos] = useState(false);

  // Datos del formulario
  const [formData, setFormData] = useState({
    // General
    alias: property?.nombre || '',
    tipoPropiedad: property?.tipo || 'Apartamento',
    direccion: property?.direccion || '',
    barrio: property?.barrio || '',
    checkin: property?.checkin_time || '15:00',
    checkout: property?.checkout_time || '11:00',
    habitaciones: property?.num_habitaciones || 1,
    banos: property?.num_banos || 1,
    camas: property?.num_camas || 1,
    capacidad: property?.capacidad_max || 2,
    wifiSsid: property?.wifi_name || '',
    wifiPass: property?.wifi_password || '',
    nombreAnfitrion: property?.host_name || 'Gestor de Reservas',
    
    // Precios
    moneda: property?.moneda_cobro || 'USD',
    precioBase: property?.cobro_propietario || 0,
    tarifaLimpieza: property?.tarifa_limpieza || 0,
    deposito: property?.deposito_garantia || 0,
    huespedExtra: 0,

    // Gestión
    propietario_id: property?.propietario_id || '',
    manager_id: property?.manager_id || '',
    comisionPorcentaje: property?.comision_porcentaje || 0,
    tarifaFija: property?.tarifa_fija_mensual || 0,
    incluirLimpieza: property?.incluir_limpieza_comision || false,

    // Limpieza
    checklist: property?.checklist_template || '- Cambiar sábanas\n- Barrer',
    
    // iCal
    icalUrl: property?.ical_url || '',
    icalName: '', 

    // Estado para el importador de iCal (Slide-over)
    showIcalImporter: false,

    // Upsells Predefinidos
    earlyCheckin: property?.upsells?.earlyCheckin || {
      enabled: false,
      tax: 0,
      variants: [
        { id: '1h', label: '1 hora antes', price: 20, enabled: true },
        { id: '2h', label: '2 horas antes', price: 35, enabled: true },
        { id: '3h', label: '3 horas antes', price: 50, enabled: true },
        { id: '4h+', label: '4+ horas antes', price: 70, enabled: true },
      ]
    },
    lateCheckout: property?.upsells?.lateCheckout || {
      enabled: false,
      tax: 0,
      variants: [
        { id: '1h', label: '1 hora después', price: 20, enabled: true },
        { id: '2h', label: '2 horas después', price: 35, enabled: true },
        { id: '3h', label: '3 horas después', price: 50, enabled: true },
        { id: '4h+', label: '4+ horas después', price: 70, enabled: true },
      ]
    },
    // Upsells Personalizados
    customUpsells: property?.upsells?.custom || []
  });

  // Estado para el editor lateral de upsells
  const [showUpsellEditor, setShowUpsellEditor] = useState(false);
  const [editingUpsell, setEditingUpsell] = useState(null);
  const [tempUpsell, setTempUpsell] = useState({ 
    name: '', 
    description: '', 
    image: null,
    variations: [{ name: 'Estándar', price: 0 }],
    visibility: { direct: true, ai: false },
    allowQuantity: false,
    tax: 0
  });

  const handleOpenUpsellEditor = (upsell = null) => {
    if (upsell) {
      setEditingUpsell(upsell);
      setTempUpsell({ ...upsell });
    } else {
      setEditingUpsell(null);
      setTempUpsell({ 
        name: '', 
        description: '', 
        image: null,
        variations: [{ name: 'Estándar', price: 0 }],
        visibility: { direct: true, ai: false },
        allowQuantity: false,
        tax: 0
      });
    }
    setShowUpsellEditor(true);
  };

  const handleSaveUpsell = () => {
    if (editingUpsell) {
      setFormData(prev => ({
        ...prev,
        customUpsells: prev.customUpsells.map(u => u === editingUpsell ? tempUpsell : u)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        customUpsells: [...prev.customUpsells, tempUpsell]
      }));
    }
    setShowUpsellEditor(false);
  };

  const handleDeleteUpsell = (upsellToDelete) => {
    setFormData(prev => ({
      ...prev,
      customUpsells: prev.customUpsells.filter(u => u !== upsellToDelete)
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'upsells', label: 'Upsells' },
    { id: 'ical', label: 'iCal' },
    { id: 'precios', label: 'Precios' },
    { id: 'gestion', label: 'Gestión' },
    { id: 'limpieza', label: 'Limpieza' },
    { id: 'sigiloso', label: 'Modo sigiloso' },
  ];

  // ============================================
  // TAB 1: GENERAL (Milimétrico iGMS)
  // ============================================
  const renderGeneralTab = () => (
    <div className="max-w-3xl mx-auto space-y-5 pt-6 pb-20 animate-in fade-in duration-300">
      
      {/* Alias/apodo */}
      <div className="flex items-center gap-8">
        <div className="w-1/4 text-right flex items-center justify-end gap-1">
          <label className="text-[13px] text-slate-500 font-medium whitespace-nowrap">Alias/apodo</label>
          <HelpCircle className="w-3.5 h-3.5 text-slate-300 pointer-events-none" />
        </div>
        <div className="w-3/4">
          <input 
            type="text" name="alias" value={formData.alias} onChange={handleChange}
            placeholder="ej. Pool + Free Shuttle to Beach"
            className="w-full h-9 px-3 bg-white border border-slate-200 rounded text-[13px] text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-0 transition-colors"
          />
        </div>
      </div>

      {/* Etiquetas */}
      <div className="flex items-center gap-8">
        <div className="w-1/4 text-right flex items-center justify-end gap-1">
          <label className="text-[13px] text-slate-500 font-medium">Etiquetas</label>
          <HelpCircle className="w-3.5 h-3.5 text-slate-300 pointer-events-none" />
        </div>
        <div className="w-3/4 flex items-center gap-2">
          <div className="flex-1 flex items-center justify-between px-3 h-9 bg-white border border-slate-200 rounded cursor-pointer hover:border-slate-300 transition-colors">
            <div className="flex items-center gap-2 text-slate-400 text-[13px]">
              <Tag className="w-3.5 h-3.5" /><span>Seleccionar...</span>
            </div>
            <Edit2 className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <button className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 rounded hover:bg-slate-50 text-slate-400">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Check-out */}
      <div className="flex items-center gap-8">
        <div className="w-1/4 text-right flex items-center justify-end gap-1">
          <label className="text-[13px] text-slate-500 font-medium">Check-out</label>
          <HelpCircle className="w-3.5 h-3.5 text-slate-300 pointer-events-none" />
        </div>
        <div className="w-2/4">
          <div className="relative group">
            <input type="time" name="checkout" value={formData.checkout} onChange={handleChange}
              className="w-full h-9 pl-3 pr-10 bg-white border border-slate-200 rounded text-[13px] text-slate-900 focus:outline-none focus:border-blue-400 transition-colors"
            />
            <Clock className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">America/Santo_Domingo</span>
        </div>
      </div>

      {/* Check-in */}
      <div className="flex items-center gap-8">
        <div className="w-1/4 text-right flex items-center justify-end gap-1">
          <label className="text-[13px] text-slate-500 font-medium">Check-in</label>
          <HelpCircle className="w-3.5 h-3.5 text-slate-300 pointer-events-none" />
        </div>
        <div className="w-2/4">
          <div className="relative group">
            <input type="time" name="checkin" value={formData.checkin} onChange={handleChange}
              className="w-full h-9 pl-3 pr-10 bg-white border border-slate-200 rounded text-[13px] text-slate-900 focus:outline-none focus:border-blue-400 transition-colors"
            />
            <Clock className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">America/Santo_Domingo</span>
        </div>
      </div>

      {/* Dirección */}
      <div className="flex items-center gap-8">
        <div className="w-1/4 text-right flex items-center justify-end gap-1">
          <label className="text-[13px] text-slate-500 font-medium">Dirección</label>
          <HelpCircle className="w-3.5 h-3.5 text-slate-300 pointer-events-none" />
        </div>
        <div className="w-3/4">
          <div className="flex items-center gap-2 px-3 h-9 bg-white border border-slate-200 rounded text-[13px] text-blue-600 cursor-pointer hover:border-blue-300 transition-colors group">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400 group-hover:text-blue-500" />
            <input 
               type="text" name="direccion" value={formData.direccion} onChange={handleChange}
               className="w-full bg-transparent border-none outline-none text-blue-600 text-[13px] font-medium placeholder:text-slate-400" 
               placeholder="Buscar dirección..."
            />
          </div>
        </div>
      </div>

      {/* Tipo de Propiedad */}
      <div className="flex items-center gap-8">
        <div className="w-1/4 text-right flex items-center justify-end gap-1">
          <label className="text-[13px] text-slate-500 font-medium">Tipo de Propiedad</label>
          <HelpCircle className="w-3.5 h-3.5 text-slate-300 pointer-events-none" />
        </div>
        <div className="w-3/4">
          <select 
            name="tipoPropiedad" value={formData.tipoPropiedad} onChange={handleChange}
            className="w-full h-9 px-3 bg-white border border-slate-200 rounded text-[13px] text-slate-900 focus:outline-none focus:border-blue-400 transition-colors"
          >
            <option value="Apartamento">Apartamento</option>
            <option value="Casa">Casa</option>
            <option value="Villa">Villa</option>
            <option value="Habitación">Habitación</option>
            <option value="Estudio">Estudio</option>
          </select>
        </div>
      </div>

      {/* Barrio/Zonas */}
      <div className="flex items-center gap-8">
        <div className="w-1/4 text-right flex items-center justify-end gap-1">
          <label className="text-[13px] text-slate-500 font-medium">Zonas/Barrio</label>
          <HelpCircle className="w-3.5 h-3.5 text-slate-300 pointer-events-none" />
        </div>
        <div className="w-3/4">
          <div className="flex items-center gap-2 px-3 h-9 bg-white border border-slate-200 rounded text-[13px] text-slate-500 cursor-text hover:border-slate-300 transition-colors">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input 
               type="text" name="barrio" value={formData.barrio} onChange={handleChange}
               className="w-full bg-transparent border-none outline-none text-slate-900 text-[13px]" 
               placeholder="Categorización interna..."
            />
          </div>
        </div>
      </div>

      {/* Distribución */}
      <div className="flex items-start gap-8">
        <div className="w-1/4 text-right pt-2 flex items-center justify-end gap-1">
          <label className="text-[13px] text-slate-500 font-medium">Configuración</label>
          <HelpCircle className="w-3.5 h-3.5 text-slate-300 pointer-events-none" />
        </div>
        <div className="w-3/4 grid grid-cols-4 gap-4">
           <div>
              <div className="flex items-center gap-1 mb-1.5">
                <Home className="w-3 h-3 text-slate-400" />
                <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Hab.</label>
              </div>
              <input type="number" name="habitaciones" value={formData.habitaciones} onChange={handleChange} className="w-full h-9 px-3 border border-slate-200 rounded text-[13px] text-slate-900 focus:border-blue-400 outline-none" />
           </div>
           <div>
              <div className="flex items-center gap-1 mb-1.5">
                <Layers className="w-3 h-3 text-slate-400" />
                <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Camas</label>
              </div>
              <input type="number" name="camas" value={formData.camas} onChange={handleChange} className="w-full h-9 px-3 border border-slate-200 rounded text-[13px] text-slate-900 focus:border-blue-400 outline-none" />
           </div>
           <div>
              <div className="flex items-center gap-1 mb-1.5">
                <Info className="w-3 h-3 text-slate-400" />
                <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Baños</label>
              </div>
              <input type="number" name="banos" value={formData.banos} onChange={handleChange} className="w-full h-9 px-3 border border-slate-200 rounded text-[13px] text-slate-900 focus:border-blue-400 outline-none" />
           </div>
           <div>
              <div className="flex items-center gap-1 mb-1.5">
                <User className="w-3 h-3 text-slate-400" />
                <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Max Pax</label>
              </div>
              <input type="number" name="capacidad" value={formData.capacidad} onChange={handleChange} className="w-full h-9 px-3 border border-slate-200 rounded text-[13px] text-slate-900 focus:border-blue-400 outline-none" />
           </div>
        </div>
      </div>

      {/* Wi-Fi */}
      <div className="flex items-start gap-8">
        <div className="w-1/4 text-right pt-2 flex items-center justify-end gap-1">
          <label className="text-[13px] text-slate-500 font-medium">Wi-Fi</label>
          <HelpCircle className="w-3.5 h-3.5 text-slate-300 pointer-events-none" />
        </div>
        <div className="w-3/4 grid grid-cols-2 gap-4">
           <input 
              type="text" name="wifiSsid" value={formData.wifiSsid} onChange={handleChange} 
              placeholder="Nombre de red (SSID)"
              className="w-full h-9 px-3 border border-slate-200 rounded text-[13px] text-slate-900 focus:border-blue-400 outline-none" 
           />
           <input 
              type="text" name="wifiPass" value={formData.wifiPass} onChange={handleChange} 
              placeholder="Contraseña"
              className="w-full h-9 px-3 border border-slate-200 rounded text-[13px] text-slate-900 focus:border-blue-400 outline-none" 
           />
        </div>
      </div>

      {/* Nombre Anfitrión */}
      <div className="flex items-center gap-8">
        <div className="w-1/4 text-right flex items-center justify-end gap-1">
          <label className="text-[13px] text-slate-500 font-medium">Nombre Anfitrión</label>
          <HelpCircle className="w-3.5 h-3.5 text-slate-300 pointer-events-none" />
        </div>
        <div className="w-3/4">
          <div className="relative">
            <input 
              type="text" name="nombreAnfitrion" value={formData.nombreAnfitrion} onChange={handleChange}
              className="w-full h-9 pl-9 pr-3 bg-white border border-slate-200 rounded text-[13px] text-slate-900 focus:outline-none focus:border-blue-400 transition-colors"
            />
            <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Propiedad principal (Parent Property) */}
      <div className="flex items-center gap-8 border-t border-slate-100 pt-5 mt-2">
        <div className="w-1/4 text-right flex items-center justify-end gap-1">
          <label className="text-[13px] text-slate-500 font-medium leading-tight text-right">Propiedad<br/>principal</label>
          <HelpCircle className="w-3.5 h-3.5 text-slate-300 pointer-events-none" />
        </div>
        <div className="w-3/4">
          <div className="flex items-center justify-between px-3 h-9 bg-white border border-slate-200 rounded group hover:border-slate-300 transition-colors">
            <div className="flex items-center gap-2 text-blue-500 text-[13px] font-medium">
              <Home className="w-3.5 h-3.5" /><span>Sin propiedad completa</span>
            </div>
            <Trash2 className="w-3.5 h-3.5 text-slate-300 hover:text-red-500 cursor-pointer transition-colors" />
          </div>
        </div>
      </div>

      {/* Plantillas de Mensajes */}
      <div className="flex items-center gap-8">
        <div className="w-1/4 text-right flex items-center justify-end gap-1">
          <label className="text-[13px] text-slate-500 font-medium whitespace-nowrap">Plantillas de mensajes</label>
          <HelpCircle className="w-3.5 h-3.5 text-slate-300 pointer-events-none" />
        </div>
        <div className="w-3/4">
          <button className="flex items-center gap-2 px-4 h-9 bg-white border border-slate-200 rounded text-[13px] text-slate-700 font-bold hover:bg-slate-50 transition-colors">
            <Settings className="w-4 h-4 text-slate-400" /> Configurar plantillas
          </button>
        </div>
      </div>

      {/* Conocimiento de IA */}
      <div className="flex items-center gap-8">
        <div className="w-1/4 text-right flex items-center justify-end gap-1">
          <label className="text-[13px] text-slate-500 font-medium whitespace-nowrap">Conocimiento de IA</label>
          <HelpCircle className="w-3.5 h-3.5 text-slate-300 pointer-events-none" />
        </div>
        <div className="w-3/4 flex gap-3">
          <button className="flex-1 flex items-center justify-center gap-2 h-9 bg-white border border-slate-200 rounded text-[13px] text-blue-600 font-bold hover:bg-blue-50 transition-colors">
            <Sparkles className="w-4 h-4" /> Explorar Respuestas de IA
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 h-9 bg-white border border-slate-200 rounded text-[13px] text-blue-600 font-bold hover:bg-blue-50 transition-colors">
            Actualizar Conocimiento
          </button>
        </div>
      </div>

      {/* Formulario de check-in */}
      <div className="flex items-center gap-8">
        <div className="w-1/4 text-right flex items-center justify-end gap-1">
          <label className="text-[13px] text-slate-500 font-medium whitespace-nowrap">Formulario de check-in</label>
          <HelpCircle className="w-3.5 h-3.5 text-slate-300 pointer-events-none" />
        </div>
        <div className="w-3/4 flex gap-3">
          <button className="flex-1 flex items-center justify-center gap-2 h-9 bg-white border border-slate-200 rounded text-[13px] text-blue-600 font-bold hover:bg-blue-50 transition-colors">
            <FileText className="w-4 h-4 text-slate-400" /> Predeterminado
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 h-9 bg-white border border-slate-200 rounded text-[13px] text-blue-600 font-bold hover:bg-blue-50 transition-colors">
            <FileText className="w-4 h-4 text-slate-400" /> Personalizado
          </button>
        </div>
      </div>

      {/* Upsells (Visual Shortcut) */}
      <div className="flex items-center gap-8">
        <div className="w-1/4 text-right flex items-center justify-end gap-1">
          <label className="text-[13px] text-slate-500 font-medium whitespace-nowrap">Upsells</label>
          <HelpCircle className="w-3.5 h-3.5 text-slate-300 pointer-events-none" />
        </div>
        <div className="w-3/4">
          <button 
            onClick={() => setActiveTab('upsells')}
            className="flex items-center gap-2 px-4 h-9 bg-white border border-slate-200 rounded text-[13px] text-blue-600 font-bold hover:bg-blue-50 transition-colors"
          >
            <Plus className="w-4 h-4" /> Agregar producto/servicio
          </button>
        </div>
      </div>

    </div>
  );

  // ============================================
  // TAB 2: iCal (Lista canales, Export/Import) - iGMS 2.0 Parity
  // ============================================
  const renderICalTab = () => (
    <div className="flex bg-white min-h-[500px] animate-in fade-in duration-300">
      {/* Contenido Principal */}
      <div className="flex-1 p-8 pr-4">
        
        {/* Sección: Importar */}
        <div className="mb-12">
          <h3 className="text-[14px] font-bold text-slate-800 mb-4">Importar a través de iCal</h3>
          <button 
            onClick={() => setFormData(p => ({ ...p, showIcalImporter: true }))}
            className="h-9 px-4 border border-slate-200 rounded text-[13px] text-slate-700 font-bold hover:bg-slate-50 transition-colors"
          >
            Agregar iCal
          </button>
          
          {/* Lista de iCals Importados (Ejemplo de uno conectado) */}
          {formData.icalUrl && (
            <div className="mt-4 flex items-center justify-between p-3 border border-slate-100 rounded-md bg-slate-50/50 group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-white border border-slate-200 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <div className="text-[13px] font-bold text-slate-800">Sincronización Externa</div>
                  <div className="text-[11px] text-slate-400 truncate max-w-xs">{formData.icalUrl}</div>
                </div>
              </div>
              <button 
                onClick={() => setFormData(p => ({ ...p, icalUrl: '' }))}
                className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Sección: Exportar */}
        <div className="border-t border-slate-100 pt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest leading-none">Exportar a través de iCal</h3>
            <button className="text-[11px] font-bold text-blue-600 hover:underline">Restablecer Token</button>
          </div>

          <div className="space-y-4">
            {/* Reservas */}
            <div className="flex items-center gap-6">
              <div className="w-20 shrink-0">
                 <span className="text-[13px] text-slate-500 font-medium">Reservas</span>
              </div>
              <div className="flex-1 flex items-center gap-2">
                 <div className="flex-1 h-9 px-3 bg-slate-50 border border-slate-200 rounded flex items-center overflow-hidden">
                    <span className="text-[12px] text-slate-500 font-mono truncate select-all">
                      https://api.clearhost.com/ical/export/{property?.id || '68c72'}/reservas.ics
                    </span>
                 </div>
                 <button 
                    onClick={() => {
                        navigator.clipboard.writeText(`https://api.clearhost.com/ical/export/${property?.id || '68c72'}/reservas.ics`);
                        alert('Copiado al portapapeles');
                    }}
                    className="text-[13px] font-bold text-blue-600 hover:text-blue-800 px-2"
                 >
                    Copiar
                 </button>
              </div>
            </div>

            {/* Tareas */}
            <div className="flex items-center gap-6">
              <div className="w-20 shrink-0">
                 <span className="text-[13px] text-slate-500 font-medium">Tareas</span>
              </div>
              <div className="flex-1 flex items-center gap-2">
                 <div className="flex-1 h-9 px-3 bg-slate-50 border border-slate-200 rounded flex items-center overflow-hidden">
                    <span className="text-[12px] text-slate-500 font-mono truncate select-all">
                      https://api.clearhost.com/ical/export/{property?.id || '68c72'}/tareas.ics
                    </span>
                 </div>
                 <button 
                    onClick={() => {
                        navigator.clipboard.writeText(`https://api.clearhost.com/ical/export/${property?.id || '68c72'}/tareas.ics`);
                        alert('Copiado al portapapeles');
                    }}
                    className="text-[13px] font-bold text-blue-600 hover:text-blue-800 px-2"
                 >
                    Copiar
                 </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Sidebar de Ayuda (Contextual) */}
      <div className="w-[300px] border-l border-slate-100 p-8 flex flex-col items-center text-center">
        <div className="w-24 h-24 mb-8">
           <img 
             src="/assets/icons/ical-sync-illustration.png" 
             alt="iCal Sync" 
             className="w-full h-full object-contain opacity-70"
             onError={(e) => {
                e.target.src = "https://cdn-icons-png.flaticon.com/512/3652/3652191.png";
             }}
           />
        </div>
        <h4 className="text-[15px] font-bold text-slate-800 mb-3">iCal</h4>
        <p className="text-[12px] text-slate-500 leading-relaxed mb-6">
          La sincronización del calendario puede ser útil si tienes tus anuncios en diferentes plataformas de reservas.
          Por ejemplo, has publicado la misma propiedad en diferentes plataformas como TripAdvisor, VRBO, etc., a través de iCal a una única interfaz para que puedas gestionar tu negocio desde un solo lugar.
          Esto te permite controlar tus reservas desde varias plataformas de terceros y evitar reservas duplicadas.
        </p>
        <a href="#" className="flex items-center gap-1 text-[12px] text-blue-600 font-bold hover:underline">
          Más información en Centro de ayuda <ArrowRight className="w-3 h-3" />
        </a>
      </div>

      {/* Dialogo Slide-over: Agregar iCal */}
      <AnimatePresence>
        {formData.showIcalImporter && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setFormData(p => ({ ...p, showIcalImporter: false }))}
              className="fixed inset-0 bg-slate-900/10 backdrop-blur-sm z-[100]"
            />
            {/* Panel */}
            <motion.div 
              initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-[400px] bg-white shadow-2xl z-[101] flex flex-col"
            >
              <div className="p-6 flex items-center justify-between border-b border-slate-100 shrink-0">
                <h3 className="text-[16px] font-bold text-slate-800">Agregar iCal</h3>
                <button 
                   onClick={() => setFormData(p => ({ ...p, showIcalImporter: false }))}
                   className="p-1 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="flex-1 p-6 space-y-6">
                 <div>
                    <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-2">Nombre del Calendario</label>
                    <input 
                      type="text" 
                      placeholder="ej. Airbnb Villa"
                      value={formData.icalName}
                      onChange={(e) => setFormData(p => ({ ...p, icalName: e.target.value }))}
                      className="w-full h-10 px-3 border border-slate-200 rounded text-[13px] focus:border-blue-400 outline-none"
                    />
                 </div>
                 <div>
                    <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-2">Dirección del Calendario (URL)</label>
                    <input 
                      type="text" 
                      placeholder="https://www.airbnb.com/calendar/ical/..."
                      value={formData.icalUrl}
                      onChange={(e) => setFormData(p => ({ ...p, icalUrl: e.target.value }))}
                      className="w-full h-10 px-3 border border-slate-200 rounded text-[13px] focus:border-blue-400 outline-none"
                    />
                    <p className="mt-2 text-[11px] text-slate-400 leading-relaxed italic">
                      Pega aquí el enlace .ics de tu plataforma externa.
                    </p>
                 </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3 shrink-0">
                 <button 
                   onClick={() => setFormData(p => ({ ...p, showIcalImporter: false }))}
                   className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[13px] rounded transition-colors"
                 >
                   Agregar
                 </button>
                 <button 
                   onClick={() => setFormData(p => ({ ...p, showIcalImporter: false }))}
                   className="flex-1 h-10 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-[13px] rounded transition-colors"
                 >
                   Cancelar
                 </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );

  // ============================================
  // TAB 3: Precios (Smart Pricing & Fijos)
  // ============================================
  const renderPreciosTab = () => (
    <div className="max-w-3xl mx-auto space-y-6 pt-6 pb-20 animate-in fade-in duration-300">
       
       <div className="bg-teal-50/50 border border-teal-100 rounded-lg p-5 flex items-start gap-4">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shrink-0 border border-teal-200 shadow-sm">
             <DollarSign className="w-5 h-5 text-teal-600" />
          </div>
          <div className="flex-1">
             <div className="flex items-center gap-3">
               <h3 className="text-[15px] font-bold text-teal-900">Smart Pricing (Precios Dinámicos)</h3>
               {/* Toggle Green */}
               <div 
                  className={`w-10 h-5 flex items-center rounded-full p-1 cursor-pointer transition-colors ${smartPricing ? 'bg-teal-500' : 'bg-slate-300'}`}
                  onClick={() => setSmartPricing(!smartPricing)}
               >
                  <div className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${smartPricing ? 'translate-x-5' : ''}`}></div>
               </div>
             </div>
             <p className="text-[13px] text-teal-800/80 mt-1 max-w-lg">
                Al activar Smart Pricing, los precios base serán ignorados por las noches que tengan reglas dinámicas establecidas en el Multi-Calendario.
             </p>
          </div>
       </div>

       <div className="grid grid-cols-2 gap-6 mt-8">
          <div>
            <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-2">Moneda por Defecto</label>
            <select name="moneda" value={formData.moneda} onChange={handleChange} className="w-full h-11 px-3 border border-slate-200 rounded-md text-[14px] bg-white text-slate-900">
               <option value="USD">Dólar Estadounidense (USD)</option>
               <option value="EUR">Euro (EUR)</option>
               <option value="DOP">Peso Dominicano (DOP)</option>
            </select>
          </div>
          <div>
            <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-2">Precio Base por noche</label>
            <div className="relative">
              <input type="number" name="precioBase" value={formData.precioBase} onChange={handleChange} className="w-full h-11 pl-9 pr-3 border border-slate-200 rounded-md text-[14px] bg-white outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500" />
              <DollarSign className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-2">Tarifa de Limpieza</label>
            <div className="relative">
              <input type="number" name="tarifaLimpieza" value={formData.tarifaLimpieza} onChange={handleChange} className="w-full h-11 pl-9 pr-3 border border-slate-200 rounded-md text-[14px] bg-white outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500" />
              <DollarSign className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-2">Depósito de Seguridad</label>
            <div className="relative">
              <input type="number" name="deposito" value={formData.deposito} onChange={handleChange} className="w-full h-11 pl-9 pr-3 border border-slate-200 rounded-md text-[14px] bg-white outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500" />
              <DollarSign className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            </div>
          </div>
       </div>
    </div>
  );

  // ============================================
  // TAB 4: Gestión (Dueños y Comisiones estricto iGMS)
  // ============================================
  const renderGestionTab = () => (
    <div className="max-w-3xl mx-auto space-y-8 pt-6 pb-20 animate-in fade-in duration-300">
      
      <div className="flex items-start gap-8">
        <div className="w-1/4 text-right pt-2"><label className="text-[14px] text-slate-700 font-semibold">Propietario de Propiedad</label></div>
        <div className="w-3/4">
          <select name="propietario_id" value={formData.propietario_id} onChange={handleChange} className="w-full h-11 px-3 bg-white border border-slate-300 rounded-md text-[14px] text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 shadow-sm transition-all">
            <option value="" disabled hidden>Sin propietario asignado</option>
            {propietarios.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
          </select>
          <p className="text-[12px] text-slate-500 mt-2">Asigna un propietario a esta propiedad para calcular sus ganancias automatizadas al final de mes.</p>
        </div>
      </div>

      <hr className="border-slate-100" />

      <div className="flex items-start gap-8">
        <div className="w-1/4 text-right pt-2"><label className="text-[14px] text-slate-700 font-semibold">Tarifa de Gestión</label></div>
        <div className="w-3/4 space-y-4">
          
          <div className="inline-flex w-full overflow-hidden rounded-lg border border-slate-300 bg-slate-50 p-1 shadow-sm">
            {['ninguno', 'basico', 'avanzado'].map((lvl) => {
              const labels = { ninguno: "Ninguno", basico: "Básico", avanzado: "Avanzado" };
              const isActive = nivelGestion === lvl;
              return (
                <button
                  key={lvl} onClick={() => setNivelGestion(lvl)}
                  className={`flex-1 py-2 text-[13px] font-semibold rounded-md transition-all duration-200 ${isActive ? 'bg-white text-teal-700 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
                >
                  {labels[lvl]}
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            {nivelGestion === 'ninguno' && (
              <motion.div key="ninguno" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="bg-slate-50 border border-slate-200 rounded-lg p-6 mt-4 flex justify-center text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center"><Info className="w-6 h-6 text-slate-400" /></div>
                  <p className="text-[14px] text-slate-500 leading-relaxed max-w-sm">
                    Propiedad autogestionada. No se calcularán comisiones de terceros ni se asignarán reportes de propietarios.
                  </p>
                </div>
              </motion.div>
            )}

            {nivelGestion === 'basico' && (
              <motion.div key="basico" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="bg-white border border-slate-200 rounded-lg p-6 mt-4 space-y-5 shadow-sm">
                <div className="px-4 py-3 bg-slate-50 rounded-md border border-slate-200 mb-6 flex gap-2">
                   <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                   <p className="text-[12px] font-mono text-slate-600 font-medium">Fórmula a aplicar: <span className="text-teal-700 font-bold bg-teal-50 px-1 py-0.5 rounded">(Total cobrado – Tarifa de limpieza) × Tarifa de gestión</span></p>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Tarifa de Gestión (%)</label>
                    <div className="relative">
                      <input type="number" name="comisionPorcentaje" value={formData.comisionPorcentaje} onChange={handleChange} className="w-full h-10 pl-3 pr-8 bg-slate-50 border border-slate-200 rounded-md text-[14px] focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none" />
                      <Percent className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Tarifa Fija (Mensual)</label>
                    <div className="relative">
                      <input type="number" name="tarifaFija" value={formData.tarifaFija} onChange={handleChange} className="w-full h-10 pl-8 pr-3 bg-slate-50 border border-slate-200 rounded-md text-[14px] focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none" />
                      <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center w-5 h-5 rounded border border-slate-300 bg-white group-hover:border-teal-500 transition-colors">
                      <input type="checkbox" checked={formData.incluirLimpieza} onChange={e => setFormData(p => ({...p, incluirLimpieza: e.target.checked}))} className="peer sr-only" />
                      <CheckCircle className="w-3.5 h-3.5 text-teal-600 opacity-0 peer-checked:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-[13px] text-slate-700 font-medium">Incluir gastos de limpieza en el reporte del propietario (Transferir a owner)</span>
                  </label>
                </div>
              </motion.div>
            )}

            {nivelGestion === 'avanzado' && (
              <motion.div key="avanzado" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="mt-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 flex gap-4 text-blue-900 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-100 rounded-bl-full opacity-50 pointer-events-none"></div>
                  <Layers className="w-7 h-7 text-blue-500 flex-shrink-0 relative z-10" />
                  <div className="relative z-10">
                    <h4 className="text-[15px] font-bold text-blue-900 mb-2">Configuración avanzada de múltiples reglas</h4>
                    <p className="text-[13px] text-blue-800/80 leading-relaxed mb-4 max-w-lg">
                      El modo avanzado te permite aplicar comisiones dinámicas basadas en canales de reservas, temporadas y tipos de cargos específicos (limpieza, impuestos, comodidades extras).
                    </p>
                    <button className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2">
                      <Plus className="w-4 h-4"/> Añadir regla de comisión avanzada
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );

  // ============================================
  // TAB 5: Limpieza (Cleaning / Checklist Textarea Gigante)
  // ============================================
  const renderLimpiezaTab = () => (
    <div className="max-w-4xl mx-auto space-y-6 pt-6 pb-20 animate-in fade-in duration-300">
       <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
             <div className="flex justify-between items-start mb-2">
                <h4 className="text-[14px] font-bold text-slate-800">Tareas Automáticas</h4>
                <div 
                   className={`w-9 h-4.5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${autoCleaning ? 'bg-teal-500' : 'bg-slate-300'}`}
                   onClick={() => setAutoCleaning(!autoCleaning)}
                >
                   <div className={`bg-white w-3.5 h-3.5 rounded-full shadow-sm transform transition-transform ${autoCleaning ? 'translate-x-4.5' : ''}`}></div>
                </div>
             </div>
             <p className="text-[12px] text-slate-500 leading-relaxed">Generar automáticamente tarea de limpieza al detectar un check-out en el calendario.</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
             <div className="flex justify-between items-start mb-2">
                <h4 className="text-[14px] font-bold text-slate-800">Fotos Obligatorias</h4>
                <div 
                   className={`w-9 h-4.5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${requirePhotos ? 'bg-teal-500' : 'bg-slate-300'}`}
                   onClick={() => setRequirePhotos(!requirePhotos)}
                >
                   <div className={`bg-white w-3.5 h-3.5 rounded-full shadow-sm transform transition-transform ${requirePhotos ? 'translate-x-4.5' : ''}`}></div>
                </div>
             </div>
             <p className="text-[12px] text-slate-500 leading-relaxed">El listado no se considerará "Limpio" hasta que el Staff suba imágenes de evidencia desde su app.</p>
          </div>
       </div>

       <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm flex flex-col min-h-[500px]">
          <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex items-center gap-3">
             <List className="w-5 h-5 text-slate-500" />
             <div>
                <h3 className="text-[15px] font-bold text-slate-800">Plantilla de Checklist del Staff</h3>
                <p className="text-[12px] text-slate-500 mt-0.5">Escribe las instrucciones que el equipo de limpieza verá para marcar como hechas.</p>
             </div>
          </div>
          <textarea 
             name="checklist" value={formData.checklist} onChange={handleChange}
             className="flex-1 w-full p-5 text-[14px] leading-loose text-slate-700 bg-white outline-none focus:ring-inset focus:ring-2 focus:ring-teal-500/50 resize-none font-mono"
             placeholder="- Vaciar nevera y basureros&#10;- Doblar las toallas como cisnes&#10;- Rellenar los frascos de café"
          ></textarea>
       </div>
    </div>
  );

  // ============================================
  // TAB 6: MODO SIGILOSO (Snooze State)
  // ============================================
  const renderModoSigilosoTab = () => (
    <div className="max-w-3xl mx-auto space-y-6 pt-6 pb-20 animate-in fade-in duration-300">
       <div className="bg-orange-50 border border-orange-200 rounded-lg p-5 flex gap-4 text-orange-900 shadow-sm">
          <ShieldAlert className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-[15px] font-bold mb-1">Pausa Temporal Operativa (Modo Sigiloso)</h4>
            <p className="text-[13px] text-orange-800/90 leading-relaxed">
              El Modo Sigiloso detiene temporalmente las automatizaciones de software sobre el calendario activo (sin afectar directamente la publicación en Airbnb). Usa esto cuando bloquees la propiedad por remodelaciones personales o cancelaciones de fuerza mayor.
            </p>
          </div>
       </div>

       <div className="grid gap-4 mt-6">
          <div className="bg-white p-5 border border-slate-200 rounded-lg flex items-center justify-between shadow-sm cursor-pointer hover:border-slate-300 transition-colors" onClick={()=>setPauseMessages(!pauseMessages)}>
             <div className="flex gap-4 items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${pauseMessages ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>
                   <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[14px] font-bold text-slate-800">Pausar mensajería automática</h4>
                  <p className="text-[12px] text-slate-500 mt-0.5">No se enviarán correos ni SMS automatizados a los huéspedes alojados.</p>
                </div>
             </div>
             <div className={`w-10 h-5 flex items-center rounded-full p-1 transition-colors ${pauseMessages ? 'bg-orange-500' : 'bg-slate-300'}`}>
                <div className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${pauseMessages ? 'translate-x-5' : ''}`}></div>
             </div>
          </div>

          <div className="bg-white p-5 border border-slate-200 rounded-lg flex items-center justify-between shadow-sm cursor-pointer hover:border-slate-300 transition-colors" onClick={()=>setPauseTasks(!pauseTasks)}>
             <div className="flex gap-4 items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${pauseTasks ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>
                   <EyeOff className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[14px] font-bold text-slate-800">Pausar tareas programadas</h4>
                  <p className="text-[12px] text-slate-500 mt-0.5">Detiene la creación automática de eventos de limpieza e inspecciones del staff.</p>
                </div>
             </div>
             <div className={`w-10 h-5 flex items-center rounded-full p-1 transition-colors ${pauseTasks ? 'bg-orange-500' : 'bg-slate-300'}`}>
                <div className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${pauseTasks ? 'translate-x-5' : ''}`}></div>
             </div>
          </div>
       </div>
    </div>
  );
  
  // ============================================
  // TAB 7: UPSELLS (Ventas Adicionales)
  // ============================================
  const renderUpsellsTab = () => (
    <div className="max-w-4xl mx-auto space-y-6 pt-6 pb-20 animate-in fade-in duration-300">
      
      {/* Warning Box */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 text-amber-900">
        <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[13px] leading-relaxed">
          <strong>Atención:</strong> Las solicitudes de Check-in temprano y Check-out tardío requieren coordinación con su equipo de limpieza. Asegúrese de que sus flujos de trabajo permitan estos cambios antes de activarlos.
        </p>
      </div>

      {/* Predefined Upsells */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Early Check-in */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <h3 className="text-[14px] font-bold text-slate-800">Check-in temprano</h3>
            </div>
            <div 
              className={`w-9 h-5 flex items-center rounded-full p-1 cursor-pointer transition-colors ${formData.earlyCheckin.enabled ? 'bg-teal-500' : 'bg-slate-300'}`}
              onClick={() => setFormData(p => ({...p, earlyCheckin: {...p.earlyCheckin, enabled: !p.earlyCheckin.enabled}}))}
            >
              <div className={`bg-white w-3 h-3 rounded-full shadow-sm transform transition-transform ${formData.earlyCheckin.enabled ? 'translate-x-4' : ''}`}></div>
            </div>
          </div>
          <div className="p-5 space-y-4">
            {formData.earlyCheckin.variants.map((variant, idx) => (
              <div key={variant.id} className="flex items-center gap-4">
                <div className="flex-1 text-[13px] text-slate-600">{variant.label}</div>
                <div className="relative w-24">
                  <span className="absolute left-2.5 top-1.5 text-[12px] text-slate-400">$</span>
                  <input 
                    type="number" value={variant.price} 
                    onChange={(e) => {
                      const newVariants = [...formData.earlyCheckin.variants];
                      newVariants[idx].price = e.target.value;
                      setFormData(p => ({...p, earlyCheckin: {...p.earlyCheckin, variants: newVariants}}));
                    }}
                    className="w-full h-8 pl-6 pr-2 border border-slate-200 rounded text-[13px] focus:border-teal-500 outline-none"
                  />
                </div>
                <input 
                  type="checkbox" checked={variant.enabled}
                  onChange={(e) => {
                    const newVariants = [...formData.earlyCheckin.variants];
                    newVariants[idx].enabled = e.target.checked;
                    setFormData(p => ({...p, earlyCheckin: {...p.earlyCheckin, variants: newVariants}}));
                  }}
                  className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
              </div>
            ))}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300" />
                <span className="text-[12px] text-slate-500">Agregar impuesto/IVA</span>
              </label>
              <div className="flex items-center gap-1">
                <input type="number" placeholder="0" className="w-12 h-8 px-2 border border-slate-200 rounded text-[13px] outline-none" />
                <span className="text-[12px] text-slate-400">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Late Check-out */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <h3 className="text-[14px] font-bold text-slate-800">Check-out tardío</h3>
            </div>
            <div 
              className={`w-9 h-5 flex items-center rounded-full p-1 cursor-pointer transition-colors ${formData.lateCheckout.enabled ? 'bg-teal-500' : 'bg-slate-300'}`}
              onClick={() => setFormData(p => ({...p, lateCheckout: {...p.lateCheckout, enabled: !p.lateCheckout.enabled}}))}
            >
              <div className={`bg-white w-3 h-3 rounded-full shadow-sm transform transition-transform ${formData.lateCheckout.enabled ? 'translate-x-4' : ''}`}></div>
            </div>
          </div>
          <div className="p-5 space-y-4">
            {formData.lateCheckout.variants.map((variant, idx) => (
              <div key={variant.id} className="flex items-center gap-4">
                <div className="flex-1 text-[13px] text-slate-600">{variant.label}</div>
                <div className="relative w-24">
                  <span className="absolute left-2.5 top-1.5 text-[12px] text-slate-400">$</span>
                  <input 
                    type="number" value={variant.price} 
                    onChange={(e) => {
                      const newVariants = [...formData.lateCheckout.variants];
                      newVariants[idx].price = e.target.value;
                      setFormData(p => ({...p, lateCheckout: {...p.lateCheckout, variants: newVariants}}));
                    }}
                    className="w-full h-8 pl-6 pr-2 border border-slate-200 rounded text-[13px] focus:border-teal-500 outline-none"
                  />
                </div>
                <input 
                  type="checkbox" checked={variant.enabled}
                  onChange={(e) => {
                    const newVariants = [...formData.lateCheckout.variants];
                    newVariants[idx].enabled = e.target.checked;
                    setFormData(p => ({...p, lateCheckout: {...p.lateCheckout, variants: newVariants}}));
                  }}
                  className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
              </div>
            ))}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300" />
                <span className="text-[12px] text-slate-500">Agregar impuesto/IVA</span>
              </label>
              <div className="flex items-center gap-1">
                <input type="number" placeholder="0" className="w-12 h-8 px-2 border border-slate-200 rounded text-[13px] outline-none" />
                <span className="text-[12px] text-slate-400">%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Upsells */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
           <h3 className="text-[15px] font-bold text-slate-800">Otros productos/servicios</h3>
           <span className="text-[12px] text-slate-400">{formData.customUpsells.length} productos</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {formData.customUpsells.map((upsell, idx) => (
             <div key={idx} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:border-teal-300 transition-colors cursor-pointer group relative">
                <div className="flex gap-4">
                   <div className="w-16 h-16 bg-slate-100 rounded-md flex items-center justify-center shrink-0 overflow-hidden">
                      {upsell.image ? <img src={upsell.image} className="w-full h-full object-cover" /> : <Image className="w-6 h-6 text-slate-300" />}
                   </div>
                   <div className="flex-1 min-w-0">
                      <h4 className="text-[13px] font-bold text-slate-800 truncate">{upsell.name}</h4>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{upsell.description}</p>
                      <div className="mt-2 text-[12px] font-bold text-teal-700">Desde ${upsell.variations?.[0]?.price || 0}</div>
                   </div>
                </div>
                <button 
                  onClick={() => handleOpenUpsellEditor(upsell)}
                  className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDeleteUpsell(upsell); }}
                  className="absolute bottom-2 right-2 p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
             </div>
          ))}

          {/* Add Button Area */}
          <button 
            onClick={() => handleOpenUpsellEditor()}
            className="border-2 border-dashed border-slate-200 rounded-lg p-6 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 hover:border-teal-300 transition-all group min-h-[100px]"
          >
            <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-teal-600 group-hover:border-teal-100 group-hover:bg-teal-50 transition-colors">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-[13px] font-bold text-slate-500 group-hover:text-teal-700 px-4 text-center">Agregar otro producto/servicio personalizado...</span>
          </button>
        </div>
      </div>
    </div>
  );

  // ============================================
  // SIDE PANEL: UPSELL EDITOR (Milimétrico iGMS)
  // ============================================
  const renderUpsellSideEditor = () => (
    <AnimatePresence>
      {showUpsellEditor && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowUpsellEditor(false)}
            className="fixed inset-0 bg-slate-900/40 z-[100] backdrop-blur-sm"
          />
          <motion.div 
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-[500px] bg-white z-[101] shadow-2xl flex flex-col"
          >
            {/* Drawer Header */}
            <div className="h-16 px-6 border-b border-slate-200 flex items-center justify-between shrink-0">
               <h3 className="text-[16px] font-bold text-slate-800">
                 {editingUpsell ? 'Editar producto/servicio' : 'Nuevo producto/servicio'}
               </h3>
               <button onClick={() => setShowUpsellEditor(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                 <X className="w-5 h-5" />
               </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* Imagen y descripción Section */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Imagen y descripción</h4>
                  <div className="h-px flex-1 bg-slate-100"></div>
                </div>
                
                {/* Image Upload Dropzone */}
                <div className="flex gap-6 items-start">
                   <div className="w-32 h-32 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-slate-50 cursor-pointer transition-colors shrink-0">
                      <Image className="w-6 h-6 text-slate-300" />
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Subir Foto</span>
                   </div>
                   <div className="flex-1 space-y-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">Nombre del producto</label>
                        <input 
                          type="text" value={tempUpsell.name}
                          onChange={(e) => setTempUpsell({...tempUpsell, name: e.target.value})}
                          placeholder="ej. Pack de Bienvenida" 
                          className="w-full h-10 px-3 border border-slate-200 rounded text-[14px] outline-none focus:border-teal-500 transition-colors" 
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">Descripción</label>
                        <textarea 
                          value={tempUpsell.description}
                          onChange={(e) => setTempUpsell({...tempUpsell, description: e.target.value})}
                          placeholder="Describe el producto o servicio..." 
                          className="w-full h-24 p-3 border border-slate-200 rounded text-[13px] outline-none focus:border-teal-500 resize-none"
                        ></textarea>
                      </div>
                   </div>
                </div>
              </div>

              {/* Variaciones de Precio */}
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1">
                    <h4 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Variaciones de precio</h4>
                    <div className="h-px flex-1 bg-slate-100"></div>
                  </div>
                </div>

                <div className="space-y-3">
                   {tempUpsell.variations.map((v, vIdx) => (
                     <div key={vIdx} className="flex gap-3">
                        <div className="flex-1">
                           <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase">Nombre de variación</label>
                           <input 
                            type="text" value={v.name}
                            onChange={(e) => {
                              const newV = [...tempUpsell.variations];
                              newV[vIdx].name = e.target.value;
                              setTempUpsell({...tempUpsell, variations: newV});
                            }}
                            placeholder="Estándar" className="w-full h-9 px-3 border border-slate-200 rounded text-[13px] outline-none" 
                           />
                        </div>
                        <div className="w-28">
                           <label className="block text-[10px] text-slate-400 font-bold mb-1 uppercase">Precio</label>
                           <div className="relative">
                              <span className="absolute left-2.5 top-2 text-[12px] text-slate-400">$</span>
                              <input 
                                type="number" value={v.price}
                                onChange={(e) => {
                                  const newV = [...tempUpsell.variations];
                                  newV[vIdx].price = e.target.value;
                                  setTempUpsell({...tempUpsell, variations: newV});
                                }}
                                placeholder="0" className="w-full h-9 pl-6 pr-3 border border-slate-200 rounded text-[13px] outline-none" 
                              />
                           </div>
                        </div>
                        <div className="pt-5">
                           <button 
                            onClick={() => {
                              const newV = tempUpsell.variations.filter((_, i) => i !== vIdx);
                              setTempUpsell({...tempUpsell, variations: newV});
                            }}
                            className="h-9 w-9 flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors"
                           >
                              <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                     </div>
                   ))}
                   <button 
                    onClick={() => setTempUpsell({...tempUpsell, variations: [...tempUpsell.variations, { name: '', price: 0 }]})}
                    className="text-[12px] font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1.5 mt-2"
                   >
                      <Plus className="w-3.5 h-3.5" /> Agregar otra variación
                   </button>
                </div>
              </div>

              {/* Configuración de venta */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Configuración de venta</h4>
                  <div className="h-px flex-1 bg-slate-100"></div>
                </div>

                <div className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-200/50">
                  <div className="flex items-center justify-between">
                    <div>
                       <h5 className="text-[13px] font-bold text-slate-700">Múltiples cantidades</h5>
                       <p className="text-[11px] text-slate-500">Permitir que el huésped compre más de una unidad.</p>
                    </div>
                    <div 
                      onClick={() => setTempUpsell({...tempUpsell, allowQuantity: !tempUpsell.allowQuantity})}
                      className={`w-9 h-5 flex items-center rounded-full p-1 cursor-pointer transition-colors ${tempUpsell.allowQuantity ? 'bg-teal-500' : 'bg-slate-300'}`}
                    >
                       <div className={`bg-white w-3 h-3 rounded-full shadow-sm transform transition-transform ${tempUpsell.allowQuantity ? 'translate-x-4' : ''}`}></div>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                    <div className="flex-1">
                       <h5 className="text-[13px] font-bold text-slate-700">Impuestos aplicables</h5>
                       <p className="text-[11px] text-slate-500">Porcentaje de IVA o Tasas Locales.</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                       <input 
                        type="number" value={tempUpsell.tax}
                        onChange={(e) => setTempUpsell({...tempUpsell, tax: e.target.value})}
                        placeholder="0" className="w-12 h-8 px-2 border border-slate-200 rounded text-[13px] outline-none" 
                       />
                       <span className="text-[12px] text-slate-400 font-bold">%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Visibilidad */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Visibilidad y Canales</h4>
                  <div className="h-px flex-1 bg-slate-100"></div>
                </div>

                <div className="space-y-3">
                  <label 
                    onClick={() => setTempUpsell({...tempUpsell, visibility: {...tempUpsell.visibility, direct: !tempUpsell.visibility.direct}})}
                    className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg hover:border-teal-200 cursor-pointer transition-colors group"
                  >
                     <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${tempUpsell.visibility.direct ? 'bg-teal-600 border-teal-600' : 'border-slate-300'}`}>
                        {tempUpsell.visibility.direct && <CheckCircle className="w-3 h-3 text-white" />}
                     </div>
                     <div className="flex-1">
                        <span className="text-[13px] font-bold text-slate-700 block">Proceso de reserva directa</span>
                        <span className="text-[11px] text-slate-500">Mostrar en el widget de reserva de ClearHost.</span>
                     </div>
                  </label>
                  <label 
                    onClick={() => setTempUpsell({...tempUpsell, visibility: {...tempUpsell.visibility, ai: !tempUpsell.visibility.ai}})}
                    className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg hover:border-teal-200 cursor-pointer transition-colors group"
                  >
                     <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${tempUpsell.visibility.ai ? 'bg-teal-600 border-teal-600' : 'border-slate-300'}`}>
                        {tempUpsell.visibility.ai && <CheckCircle className="w-3 h-3 text-white" />}
                     </div>
                     <div className="flex-1">
                        <span className="text-[13px] font-bold text-slate-700 block flex items-center gap-2">
                           Post-reserva / ClearBot <span className="bg-blue-100 text-blue-600 text-[9px] px-1.5 py-0.5 rounded uppercase font-extrabold tracking-tighter">Próximamente</span>
                        </span>
                        <span className="text-[11px] text-slate-500">El agente IA ofrecerá este servicio durante la conversación.</span>
                     </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="h-20 px-6 border-t border-slate-200 flex items-center gap-3 bg-slate-50/80 shrink-0">
               <button onClick={() => setShowUpsellEditor(false)} className="flex-1 h-11 bg-white border border-slate-300 text-slate-700 font-bold text-[14px] rounded-lg hover:bg-slate-50 transition-colors">
                  Cancelar
               </button>
               <button 
                  onClick={handleSaveUpsell}
                  className="flex-2 flex items-center justify-center gap-2 h-11 bg-teal-600 text-white font-bold text-[14px] rounded-lg hover:bg-teal-700 transition-all shadow-md shadow-teal-600/20 active:scale-95 px-8"
               >
                  <Save className="w-4 h-4" /> Guardar Producto
               </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] relative">
         {/* HEADER SUPERIOR */}
         {/* HEADER SUPERIOR */}
         <div className="flex items-center justify-between h-14 px-4 bg-white border-b border-slate-200 shrink-0 z-10 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
            <button 
               onClick={onCancel}
               className="flex items-center text-[13px] text-slate-600 hover:text-slate-900 font-bold transition-colors px-3 py-1.5 rounded-md hover:bg-slate-100"
            >
               <ChevronLeft className="w-4 h-4 mr-1" /> Volver
            </button>
            <div className="flex-1 text-center">
               <span className="text-[14px] font-bold text-slate-800 tracking-wide">Editor de Propiedades Avanzado</span>
            </div>
            <div className="w-24 flex justify-end"></div> 
         </div>

         {/* BLOQUE PRINCIPAL PROPIEDAD IGMS */}
         <div className="bg-[#1A365D] text-white px-8 py-5 flex items-center justify-between shrink-0 h-24">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-white rounded-md flex items-center justify-center relative shadow-md shrink-0">
                  <Home className="w-6 h-6 text-slate-800" />
                  <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></div>
               </div>
               <div className="min-w-0">
                  <h1 className="text-[20px] font-bold leading-tight flex items-center gap-2 truncate">
                     {formData.alias || 'Nueva Propiedad sin nombre'}
                  </h1>
                  <p className="text-[13px] text-blue-200 mt-1 flex items-center gap-2 opacity-90 truncate">
                     {formData.direccion || 'Dirección no asignada'}
                  </p>
                  <p className="text-[12px] text-blue-300 mt-0.5 hover:text-white hover:underline cursor-pointer transition-colors w-max">
                     Agregar una nota privada...
                  </p>
               </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-md text-[13px] font-semibold transition-all backdrop-blur-sm shrink-0">
               <Calendar className="w-4 h-4" />
               Calendario
            </button>
         </div>

         {/* BARRA DE PESTAÑAS (TABS HORIZONTALES IGMS) */}
         <div className="bg-white border-b border-slate-200 px-8 flex gap-8 shrink-0 relative z-10 shadow-sm overflow-x-auto">
            {tabs.map((tab) => (
               <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                     relative py-4 text-[13px] font-extrabold uppercase tracking-wider transition-colors duration-200 whitespace-nowrap
                     ${activeTab === tab.id ? 'text-teal-700' : 'text-slate-500 hover:text-slate-800'}
                  `}
               >
                  {tab.label}
                  {activeTab === tab.id && (
                     <motion.div 
                        layoutId="activeIgmsTabLineFullscreen" 
                        className="absolute bottom-0 left-0 w-full h-[4px] bg-teal-600 rounded-t-lg"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                     />
                  )}
                  {tab.id === 'sigiloso' && (pauseMessages || pauseTasks) && (
                     <div className="absolute right-[-12px] top-[14px] w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                  )}
               </button>
            ))}
         </div>

         {/* CONTENEDOR FLEX DE ÁREA DE CONTENIDO Y BARRA LATERAL (CHANNELS) */}
         <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 overflow-y-auto bg-slate-50/50 p-2 relative">
               <div className="bg-transparent min-h-full pb-10">
                  {activeTab === 'general' && renderGeneralTab()}
                  {activeTab === 'upsells' && renderUpsellsTab()}
                  {activeTab === 'ical' && renderICalTab()}
                  {activeTab === 'precios' && renderPreciosTab()}
                  {activeTab === 'gestion' && renderGestionTab()}
                  {activeTab === 'limpieza' && renderLimpiezaTab()}
                  {activeTab === 'sigiloso' && renderModoSigilosoTab()}
               </div>
            </div>

            {/* SIDE EDITOR FOR UPSELLS */}
            {renderUpsellSideEditor()}

            {/* Panel lateral derecho (Canales) */}
            <div className="w-[320px] bg-white border-l border-slate-200 overflow-y-auto shrink-0 flex flex-col p-6 shadow-[-4px_0_15px_-5px_rgba(0,0,0,0.05)] z-10 relative">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="text-[17px] font-extrabold text-slate-800 tracking-tight">Canales</h3>
                  <button className="btn btn-outline h-auto py-1 px-3 text-[12px] font-bold text-blue-600 border-blue-100 bg-blue-50/50 hover:bg-blue-100 hover:border-blue-200 gap-1.5">
                     <Edit2 className="w-3.5 h-3.5" /> Editar
                  </button>
               </div>

               <div className="space-y-5">
                  <div className="flex gap-3">
                     <div className="w-8 h-8 rounded-full bg-[#FF5A5F]/10 flex items-center justify-center shrink-0 border border-[#FF5A5F]/20">
                        <svg className="w-5 h-5 text-[#FF5A5F]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.5 9.5c0 1.93-1.57 3.5-3.5 3.5s-3.5-1.57-3.5-3.5S11.07 8 13 8s3.5 1.57 3.5 3.5z"/></svg>
                     </div>
                     <div>
                        <a href="#" className="text-[13px] text-teal-700 font-bold hover:underline block leading-tight mb-1">{formData.alias || 'Airbnb Listing'}</a>
                        <div className="flex items-center gap-1.5">
                           <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)]"></div>
                           <span className="text-[10px] font-extrabold text-emerald-600 tracking-wider flex items-center gap-1"><CheckCircle className="w-3 h-3"/> PUBLICADO</span>
                        </div>
                     </div>
                  </div>
                  
                  <div className="flex gap-3 pt-3 border-t border-slate-100">
                     <div className="w-8 h-8 rounded-full bg-[#003580]/10 flex items-center justify-center shrink-0 border border-[#003580]/20">
                        <svg className="w-5 h-5 text-[#003580]" viewBox="0 0 24 24" fill="currentColor"><path d="M2.25 6h19.5c.414 0 .75.336.75.75v10.5a.75.75 0 0 1-.75.75H2.25A.75.75 0 0 1 1.5 17.25V6.75c0-.414.336-.75.75-.75zm0-1.5A2.25 2.25 0 0 0 0 6.75v10.5A2.25 2.25 0 0 0 2.25 19.5h19.5A2.25 2.25 0 0 0 24 17.25V6.75A2.25 2.25 0 0 0 21.75 4.5H2.25z"/></svg>
                     </div>
                     <div>
                        <a href="#" className="text-[13px] text-teal-700 font-bold hover:underline block leading-tight mb-1">{formData.alias || 'Booking.com Listing'}</a>
                        <div className="flex items-center gap-1.5">
                           <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)]"></div>
                           <span className="text-[10px] font-extrabold text-emerald-600 tracking-wider flex items-center gap-1"><CheckCircle className="w-3 h-3"/> CONECTADO</span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* FOOTER FIXED */}
         <div className="h-16 bg-white border-t border-slate-200 px-8 flex items-center justify-end gap-4 shrink-0 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.03)] relative z-20">
            <button 
               onClick={onCancel}
               className="btn btn-outline px-8"
            >
               Cancelar
            </button>
            <button 
               onClick={() => onSave(formData)}
               className="btn btn-primary px-8"
            >
               Guardar Todo
            </button>
         </div>
    </div>
  );
};

export default PropertyEditor_V2;
