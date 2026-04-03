import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Home, Save, User, CreditCard, Globe, Users, Camera, Sparkles } from 'lucide-react';
import api from '../services/api';

/**
 * NuevaReservaModal.jsx (v2.0)
 * -------------------
 * Sistema: ProVision / Slate Precision
 * Pantalla: Rediseño 1:1 basado en captura del cliente.
 * Función: Alta de reserva con Sincronización Inteligente (OCR).
 */
const NuevaReservaModal = ({ propiedades = [], onClose, onRefresh, showToast, initialData = {} }) => {
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const fileInputRef = useRef(null);
  const isEditing = !!initialData.id;
  const isExternal = isEditing && initialData.fuente !== 'MANUAL';

  const [formData, setFormData] = useState({
    propiedad_id: initialData.propiedad_id || '',
    nombre_huesped: initialData.nombre_huesped || '',
    doc_identidad: initialData.doc_identidad || '',
    nacionalidad: initialData.nacionalidad || '',
    telefono_huesped: initialData.telefono_huesped || '',
    check_in: initialData.check_in || '',
    check_out: initialData.check_out || '',
    fuente: initialData.fuente || 'MANUAL',
    num_huespedes: initialData.num_huespedes || 2,
    estado: initialData.estado || 'CONFIRMADA'
  });

  // Manejar el escaneo de ID (OCR Simulado)
  const handleScanClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setScanning(true);
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      if (showToast) showToast('Iniciando Sincronización Inteligente...');
      console.log('--- ENVIANDO A OCR ---');
      
      const response = await api.post('/ocr/escanear-documento', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      console.log('--- RESPUESTA OCR ---', response.data);
      const { nombre_huesped, documento_identidad, doc_identidad, nacionalidad, telefono_huesped } = response.data;
      
      const identityValue = doc_identidad || documento_identidad;

      setFormData(prev => ({
        ...prev,
        nombre_huesped: (nombre_huesped && nombre_huesped !== "REVISAR") ? nombre_huesped : prev.nombre_huesped,
        doc_identidad: (identityValue && !identityValue.includes("REVISAR")) ? identityValue : prev.doc_identidad,
        nacionalidad: (nacionalidad && nacionalidad !== "ERROR") ? nacionalidad : prev.nacionalidad,
        telefono_huesped: telefono_huesped || prev.telefono_huesped
      }));

      if (showToast) showToast('✨ Datos completados automáticamente');
    } catch (error) {
      console.error('Error detallado en escaneo:', error);
      if (showToast) showToast('Error al escanear documento');
    } finally {
      setScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.propiedad_id) {
        alert("Por favor selecciona una propiedad");
        return;
    }

    setLoading(true);
    try {
      let savedReserva;
      if (isEditing) {
        const res = await api.put(`/reservas/${initialData.id}`, formData);
        savedReserva = res.data;
        if (showToast) showToast('¡Cambios guardados con éxito!');
      } else {
        const res = await api.post('/reservas', formData);
        savedReserva = res.data;
        if (showToast) showToast('¡Creación de Registro Exitosa!');
      }
      if (onRefresh) onRefresh(savedReserva, isEditing ? 'UPDATE' : 'CREATE');
      onClose();
    } catch (error) {
      console.error('Error al procesar reserva:', error);
      const detail = error.response?.data?.detail || 'Error técnico al guardar el registro.';
      alert(`ERROR: ${detail}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Estás seguro de que deseas cancelar esta reserva manual? Esta acción no se puede deshacer.')) return;
    
    setLoading(true);
    try {
        await api.delete(`/reservas/${initialData.id}`);
        if (showToast) showToast('Reserva cancelada correctamente');
        if (onRefresh) onRefresh(initialData, 'DELETE');
        onClose();
    } catch (error) {
        alert(error.response?.data?.detail || 'Error al cancelar la reserva');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      {/* Backdrop iGMS Style */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
      />

      {/* Modal Container */}
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 10 }}
        className="relative w-full max-w-[500px] bg-white rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.2)] overflow-hidden font-manrope"
      >
        {/* Header */}
        <div className="px-8 py-6 flex items-center justify-between border-b border-slate-50">
          <h2 className="text-[20px] font-extrabold text-[#0b1c30] flex items-center gap-2">
            {isEditing ? (
                 <><i className="fas fa-edit text-blue-500 mr-1"></i> Editar Reserva</>
            ) : (
                <><span className="text-xl">+</span> Nuevo Reserva</>
            )}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        {/* External Reservation Warning */}
        {isExternal && (
          <div className="px-8 mt-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[12px] font-bold text-amber-800 leading-tight">Reserva Sincronizada (Solo Lectura)</p>
                <p className="text-[11px] text-amber-700/80 mt-0.5 font-medium">Esta reserva proviene de {formData.fuente}. Los cambios deben realizarse directamente en la plataforma de origen.</p>
              </div>
            </div>
          </div>
        )}

        {/* Sync Module (Blue Card) - Hidden for external bookings */}
        {!isExternal && (
          <div className="px-8 pt-4">
            <div className="bg-[#eff6ff] border border-[#dbeafe] rounded-2xl p-5 flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                 <div className="flex items-center gap-2 text-[#2563eb] font-bold text-[13px] uppercase tracking-wide">
                    <Sparkles className="w-4 h-4" /> Sincronización Inteligente
                 </div>
                 <p className="text-[11px] text-[#2563eb]/70 font-medium">Escanea el ID/Pasaporte para auto-completar</p>
              </div>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                onChange={handleFileChange} 
                accept="image/*"
                capture="environment" 
              />
              
              <button 
                type="button"
                onClick={handleScanClick}
                disabled={scanning}
                className="px-4 py-2.5 bg-[#2563eb] text-white rounded-xl text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-2 hover:bg-[#1d4ed8] active:scale-95 transition-all shadow-lg shadow-blue-500/20"
              >
                <Camera className="w-4 h-4" />
                {scanning ? 'Escaneando...' : 'ESCANEAR ID'}
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="max-h-[70vh] overflow-y-auto px-8 py-6 custom-scrollbar">
          <form id="reserva-form" onSubmit={handleSubmit} className="space-y-5">
            
            {/* Propiedad */}
            <div className="group">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.05em] mb-1.5">Propiedad</label>
              <select 
                required
                disabled={isExternal}
                value={formData.propiedad_id}
                onChange={(e) => setFormData({...formData, propiedad_id: e.target.value})}
                className="w-full h-11 px-4 bg-[#f8fafc] border border-slate-100 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all appearance-none cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <option value="">Seleccionar Propiedad</option>
                {propiedades.filter(p => p.activa !== false || (isEditing && p.id === formData.propiedad_id)).map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>

            {/* Nombre */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.05em] mb-1.5">Nombre del Huésped</label>
              <input 
                required
                type="text"
                placeholder="Nombre completo..."
                value={formData.nombre_huesped}
                onChange={(e) => setFormData({...formData, nombre_huesped: e.target.value})}
                disabled={isExternal}
                className="w-full h-11 px-4 bg-[#f8fafc] border border-slate-100 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-500 outline-none transition-all disabled:opacity-70"
              />
            </div>

            {/* Doc & Nacionalidad */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.05em] mb-1.5">Doc. Identidad</label>
                <div className="relative">
                  <input 
                    type="text"
                    disabled={isExternal}
                    placeholder="ID o Pasaporte"
                    value={formData.doc_identidad}
                    onChange={(e) => setFormData({...formData, doc_identidad: e.target.value})}
                    className="w-full h-11 px-4 bg-[#f8fafc] border border-slate-100 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-500 outline-none transition-all disabled:opacity-70"
                  />
                  <CreditCard className="absolute right-3 top-3 w-4 h-4 text-slate-300" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.05em] mb-1.5">Nacionalidad</label>
                <div className="relative">
                   <input 
                    type="text"
                    disabled={isExternal}
                    placeholder="Ej: DOM, ESP"
                    value={formData.nacionalidad}
                    onChange={(e) => setFormData({...formData, nacionalidad: e.target.value})}
                    className="w-full h-11 px-4 bg-[#f8fafc] border border-slate-100 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-500 outline-none transition-all disabled:opacity-70"
                   />
                   <Globe className="absolute right-3 top-3 w-4 h-4 text-slate-300" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.05em] mb-1.5">Número de Teléfono</label>
              <div className="relative">
                <input 
                  type="tel"
                  disabled={isExternal}
                  placeholder="+1 809 000 0000"
                  value={formData.telefono_huesped}
                  onChange={(e) => setFormData({...formData, telefono_huesped: e.target.value})}
                  className="w-full h-11 px-4 bg-[#f8fafc] border border-slate-100 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-500 outline-none transition-all disabled:opacity-70"
                />
                <i className="fas fa-phone absolute right-3 top-3 w-4 h-4 text-slate-300"></i>
              </div>
            </div>

            {/* Fechas */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.05em] mb-1.5">Check-in</label>
                <input 
                  required
                  type="date"
                  disabled={isExternal}
                  value={formData.check_in}
                  onChange={(e) => setFormData({...formData, check_in: e.target.value})}
                  className="w-full h-11 px-4 bg-[#f8fafc] border border-slate-100 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-500 outline-none transition-all disabled:opacity-70"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.05em] mb-1.5">Check-out</label>
                <input 
                  required
                  type="date"
                  disabled={isExternal}
                  value={formData.check_out}
                  onChange={(e) => setFormData({...formData, check_out: e.target.value})}
                  className="w-full h-11 px-4 bg-[#f8fafc] border border-slate-100 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-500 outline-none transition-all disabled:opacity-70"
                />
              </div>
            </div>

            {/* Fuente & Huéspedes */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.05em] mb-1.5">Fuente</label>
                <select 
                  disabled={isExternal}
                  value={formData.fuente}
                  onChange={(e) => setFormData({...formData, fuente: e.target.value})}
                  className="w-full h-11 px-4 bg-[#f8fafc] border border-slate-100 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-500 outline-none transition-all disabled:opacity-70"
                >
                  <option value="MANUAL">Manual</option>
                  <option value="AIRBNB">Airbnb</option>
                  <option value="BOOKING">Booking</option>
                  <option value="VRBO">Vrbo</option>
                  <option value="OTRO">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.05em] mb-1.5">Huéspedes</label>
                <input 
                  type="number"
                  min="1"
                  disabled={isExternal}
                  value={formData.num_huespedes}
                  onChange={(e) => setFormData({...formData, num_huespedes: parseInt(e.target.value)})}
                  className="w-full h-11 px-4 bg-[#f8fafc] border border-slate-100 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-500 outline-none transition-all disabled:opacity-70"
                />
              </div>
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="px-8 py-6 bg-slate-50 rounded-b-[24px] flex flex-col sm:flex-row gap-3">
          {isEditing && formData.fuente === 'MANUAL' && (
             <button 
                type="button" 
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 h-12 bg-rose-50 border border-rose-100 text-rose-600 font-bold text-[13px] rounded-xl hover:bg-rose-100 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <i className="fas fa-trash-alt"></i> Cancelar
              </button>
          )}
          
          <button 
                type="button" 
                onClick={onClose}
                className={`btn btn-outline flex-1 h-12 ${isExternal ? 'flex-[2]' : ''}`}
              >
                Cerrar
          </button>

          {!isExternal && (
            <button 
              form="reserva-form"
              disabled={loading || scanning}
              type="submit"
              className={`btn ${isEditing ? 'btn-primary' : 'btn-success'} flex-[1.5] h-12 gap-2 disabled:opacity-50`}
            >
              {loading ? 'Procesando...' : isEditing ? 'Guardar Cambios' : 'Crear Registro'}
            </button>
          )}
        </div>

      </motion.div>
    </div>
  );
};

export default NuevaReservaModal;
