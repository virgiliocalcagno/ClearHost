import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { 
  ShieldCheck, 
  Wifi, 
  Key, 
  MapPin, 
  FileText, 
  Camera, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Lock
} from 'lucide-react';

/**
 * WelcomePortal - Premium Guest Onboarding Experience
 * Features: Soft Auth, Registration, and Digital Key Delivery
 */
export default function WelcomePortal() {
  const { reservaId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  
  // State Management
  const [step, setStep] = useState('auth'); // auth -> register -> complete
  const [unlockDigits, setUnlockDigits] = useState('');
  const [signingUp, setSigningUp] = useState(false);
  const [formData, setFormData] = useState({
    nombre_legal: '',
    email: '',
    id_foto: null
  });

  useEffect(() => {
    loadInfo();
  }, [reservaId]);

  const loadInfo = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/welcome/${reservaId}`);
      setData(res.data);
      
      if (res.data.self_checkin_complete) {
        setStep('complete');
      } else if (!res.data.auth_required) {
        setStep('register');
      } else {
        setStep('auth');
      }
    } catch (err) {
      setError('No pudimos encontrar tu reserva. Por favor verifica el enlace.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async () => {
    try {
      setSigningUp(true);
      await api.post(`/welcome/${reservaId}/unlock`, { digits: unlockDigits });
      setStep('register');
    } catch (err) {
      alert('Los dígitos no coinciden. Inténtalo de nuevo.');
    } finally {
      setSigningUp(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    // En una v3 real, aquí subiríamos la foto a un servicio de OCR o S3
    // Por ahora, simulamos el éxito del registro
    try {
      setSigningUp(true);
      await api.post(`/welcome/${reservaId}/register`, {
        ...formData,
        id_foto: "id_dummy_path.jpg" // Placeholder para la lógica de backend
      });
      await loadInfo(); // Recargar para obtener WiFi y Códigos
      setStep('complete');
    } catch (err) {
      alert('Error al registrar datos. Inténtalo de nuevo.');
    } finally {
      setSigningUp(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
      <Loader2 className="w-12 h-12 text-teal-600 animate-spin" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
      <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
      <h1 className="text-2xl font-black text-slate-900 mb-2">¡Ups! Algo salió mal</h1>
      <p className="text-slate-500 max-w-sm">{error}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-teal-100 italic-none">
      {/* Header Branding */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-b border-slate-200 z-50">
        <div className="max-w-md mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="font-black tracking-tighter text-xl">CLEARHOST</span>
          </div>
          <div className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            {data?.propiedad_nombre}
          </div>
        </div>
      </nav>

      <main className="max-w-md mx-auto px-6 pt-24 pb-12">
        {/* Step: SOFT AUTH */}
        {step === 'auth' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8">
              <div className="w-16 h-16 bg-teal-50 rounded-3xl flex items-center justify-center mb-6">
                <Lock className="w-8 h-8 text-teal-600" />
              </div>
              <h1 className="text-4xl font-black tracking-tight mb-2">Verificación de Seguridad</h1>
              <p className="text-slate-500 leading-relaxed font-medium">
                Hola <span className="text-teal-600 font-bold">{data.nombre_huesped}</span>. 
                Por seguridad, ingresa los <span className="font-bold text-slate-900">últimos 4 dígitos</span> del teléfono registrado en tu reserva.
              </p>
            </div>

            <div className="space-y-4">
              <input 
                type="text" 
                maxLength={4}
                placeholder="0000"
                value={unlockDigits}
                onChange={(e) => setUnlockDigits(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-white border-2 border-slate-200 rounded-2xl px-6 py-5 text-3xl font-black tracking-[1em] text-center focus:border-teal-500 outline-none transition-all shadow-sm"
              />
              <button 
                onClick={handleUnlock}
                disabled={unlockDigits.length < 4 || signingUp}
                className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-800 disabled:opacity-50 transition-all active:scale-[0.98] shadow-xl"
              >
                {signingUp ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Desbloquear Portal'}
              </button>
            </div>
          </div>
        )}

        {/* Step: REGISTER */}
        {step === 'register' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8">
              <h1 className="text-4xl font-black tracking-tight mb-2">Casi listo...</h1>
              <p className="text-slate-500 leading-relaxed">
                Necesitamos completar el registro oficial para entregarte tus códigos de acceso.
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-6">
              <div className="space-y-4">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Datos del Huésped</label>
                <input 
                  required
                  placeholder="Nombre completo legal"
                  className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-teal-500/20"
                  value={formData.nombre_legal}
                  onChange={e => setFormData({...formData, nombre_legal: e.target.value})}
                />
                <input 
                  required
                  type="email"
                  placeholder="Correo electrónico"
                  className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-teal-500/20"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div className="space-y-4">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Verificación de Identidad</label>
                <div className="relative group">
                  <input 
                    type="file" 
                    accept="image/*"
                    capture="environment"
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    onChange={e => setFormData({...formData, id_foto: e.target.files[0]})}
                  />
                  <div className={`w-full py-12 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center gap-3 transition-all ${formData.id_foto ? 'border-teal-500 bg-teal-50/50' : 'border-slate-200 bg-white group-hover:border-slate-300'}`}>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${formData.id_foto ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      {formData.id_foto ? <CheckCircle2 /> : <Camera />}
                    </div>
                    <span className={`text-xs font-bold ${formData.id_foto ? 'text-teal-600' : 'text-slate-400'}`}>
                      {formData.id_foto ? '¡Foto cargada!' : 'Haz clic para tomar foto del ID'}
                    </span>
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                disabled={signingUp}
                className="w-full bg-teal-600 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 hover:bg-teal-700 disabled:opacity-50 transition-all active:scale-[0.98] shadow-xl"
              >
                {signingUp ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Finalizar Registro'}
              </button>
            </form>
          </div>
        )}

        {/* Step: COMPLETE (The Prize) */}
        {step === 'complete' && (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <div className="mb-10 text-center">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h1 className="text-4xl font-black tracking-tight mb-2">¡Bienvenido!</h1>
              <p className="text-slate-500 italic">Disfruta tu estancia en {data.propiedad_nombre}</p>
            </div>

            <div className="grid gap-4">
              {/* Wifi Card */}
              <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                    <Wifi className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Conexión WiFi</h3>
                    <p className="font-bold text-slate-900">{data.wifi_nombre || 'No disponible'}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Password</span>
                  <span className="font-black text-slate-900 tracking-tighter cursor-pointer" onClick={() => {
                    navigator.clipboard.writeText(data.wifi_password);
                    alert('Copiado al portapapeles');
                  }}>{data.wifi_password || '********'}</span>
                </div>
              </div>

              {/* Door Code Card */}
              <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                      <Key className="w-6 h-6 text-teal-400" />
                    </div>
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40">Código de Acceso</h3>
                      <p className="font-bold">Puerta Principal</p>
                    </div>
                  </div>
                  
                  <div className="text-center py-6 bg-white/5 rounded-3xl border border-white/10 mb-6">
                    <span className="text-6xl font-black tracking-[0.2em]">{data.codigo_puerta || '1234'}</span>
                  </div>
                  
                  <p className="text-xs text-white/50 leading-relaxed font-medium">
                    <MapPin className="w-3 h-3 inline mr-1" />
                    {data.instrucciones_acceso || 'Utiliza el código en la chapa inteligente.'}
                  </p>
                </div>
                {/* Decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 blur-3xl rounded-full translate-x-12 -translate-y-12"></div>
              </div>

              {/* Rules Card */}
              <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Reglas del Edificio</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{data.reglas_edificio || 'No fumar. No fiestas. Respetar las horas de silencio.'}</p>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="text-center py-12">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Powered by ClearHost AI</p>
      </footer>
    </div>
  );
}
