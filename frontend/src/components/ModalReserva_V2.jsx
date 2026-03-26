import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';

const COLORS = {
  surface: '#fcf8fa',
  primary: '#0F172A',
  accent: '#0d9488',
  accentLight: '#3cddc7',
  containerLow: '#f6f3f5'
};

export default function ModalReserva_V2({ 
  show, 
  editData, 
  onClose, 
  onSave, 
  propiedades = []
}) {
  const [formData, setFormData] = useState({
    fuente: 'MANUAL',
    num_huespedes: 2,
    estado: 'CONFIRMADA',
    check_in: '',
    check_out: '',
    nombre_huesped: '',
    documento_identidad: '',
    nacionalidad: '',
    propiedad_id: ''
  });
  const [escaneando, setEscaneando] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (show) {
      if (editData) {
        setFormData(editData);
      } else {
        setFormData({
          fuente: 'MANUAL',
          num_huespedes: 2,
          estado: 'CONFIRMADA',
          check_in: '',
          check_out: '',
          nombre_huesped: '',
          documento_identidad: '',
          nacionalidad: '',
          propiedad_id: ''
        });
      }
    }
  }, [show, editData]);

  const handleScanDocument = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setEscaneando(true);
    const formDataOCR = new FormData();
    formDataOCR.append('file', file);

    try {
      const res = await api.post('/ocr/escanear-documento', formDataOCR, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const { documento_identidad, nacionalidad, nombre_huesped } = res.data;
      
      setFormData(prev => ({
        ...prev,
        nombre_huesped: nombre_huesped || prev.nombre_huesped,
        documento_identidad: documento_identidad || prev.documento_identidad,
        nacionalidad: nacionalidad || prev.nacionalidad
      }));
      
    } catch (err) {
      console.error("Error en OCR:", err);
      // alert("No se pudo escanear el documento.");
    } finally {
      setEscaneando(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div 
        className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-slate-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header - Slate Precision Style */}
        <div className="px-8 pt-8 pb-4 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-black text-slate-900 font-['Manrope'] tracking-tight">
              {editData ? 'Editar Reserva' : 'Nueva Reserva'}
            </h2>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
              Gestión de Huéspedes • ClearHost V2
            </p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center transition-all text-slate-400 hover:text-slate-900"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-8 py-4 custom-scrollbar">
          {/* AI Scan Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6 flex items-center justify-between group hover:border-teal-500/30 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600">
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 font-['Manrope']">Escaneo Inteligente</h4>
                <p className="text-[11px] text-slate-500 font-medium">Auto-completa con foto de ID o Pasaporte</p>
              </div>
            </div>
            
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleScanDocument} 
            />
            
            <button 
              type="button"
              disabled={escaneando}
              onClick={() => fileInputRef.current.click()}
              className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm ${
                escaneando 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                : 'bg-teal-600 text-white hover:bg-teal-700 active:scale-95'
              }`}
            >
              {escaneando ? (
                <>
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Procesando...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">photo_camera</span>
                  Escanear ID
                </>
              )}
            </button>
          </div>

          <div className="space-y-6">
            {/* Seccion 1: Propiedad y Huésped */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Propiedad</label>
                <select 
                  name="propiedad_id" 
                  value={formData.propiedad_id || ''} 
                  onChange={handleChange} 
                  required 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-950 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="">Seleccionar Propiedad</option>
                  {propiedades.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre del Huésped</label>
                <input 
                  name="nombre_huesped" 
                  value={formData.nombre_huesped || ''} 
                  onChange={handleChange} 
                  required 
                  placeholder="Nombre completo..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-950 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Seccion 2: Identificación */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Doc. Identidad</label>
                <input 
                  name="documento_identidad" 
                  value={formData.documento_identidad || ''} 
                  onChange={handleChange} 
                  placeholder="Cédula o Pasaporte"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Nacionalidad</label>
                <input 
                  name="nacionalidad" 
                  value={formData.nacionalidad || ''} 
                  onChange={handleChange} 
                  placeholder="Ej: DOM, ESP, USA"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Seccion 3: Estancia */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="col-span-1 md:col-span-1 space-y-1.5">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Check-in</label>
                <input 
                  type="date" 
                  name="check_in" 
                  value={formData.check_in || ''} 
                  onChange={handleChange} 
                  required 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all h-[46px]"
                />
              </div>
              <div className="col-span-1 md:col-span-1 space-y-1.5">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Check-out</label>
                <input 
                  type="date" 
                  name="check_out" 
                  value={formData.check_out || ''} 
                  onChange={handleChange} 
                  required 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all h-[46px]"
                />
              </div>
              <div className="col-span-1 md:col-span-1 space-y-1.5">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Fuente</label>
                <select 
                  name="fuente" 
                  value={formData.fuente || 'MANUAL'} 
                  onChange={handleChange} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all appearance-none cursor-pointer h-[46px]"
                >
                  <option value="AIRBNB">Airbnb</option>
                  <option value="BOOKING">Booking</option>
                  <option value="VRBO">VRBO</option>
                  <option value="MANUAL">Manual</option>
                </select>
              </div>
              <div className="col-span-1 md:col-span-1 space-y-1.5">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Huéspedes</label>
                <input 
                  type="number" 
                  name="num_huespedes" 
                  value={formData.num_huespedes || 2} 
                  onChange={handleChange} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all h-[46px]"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-8 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
          <button 
            type="button" 
            onClick={onClose}
            className="px-6 py-3 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-all font-['Manrope']"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            form="form-reserva-v2"
            onClick={handleSubmit}
            className="px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-teal-600/20 active:scale-95 font-['Manrope'] flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">save</span>
            {editData ? 'Actualizar Reserva' : 'Crear Reserva'}
          </button>
        </div>
      </div>
    </div>
  );
}
