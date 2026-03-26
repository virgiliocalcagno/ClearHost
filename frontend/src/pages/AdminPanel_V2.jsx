import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ReservasView_V2 } from '../views/ReservasView_V2';
import { PropiedadesView_V2 } from '../views/PropiedadesView_V2';

// Colores Slate Precision Atómicos (vistos en las imágenes)
const COLORS = {
  surface: '#fcf8fa',
  primary: '#0F172A', // Slate 900
  accent: '#0d9488',  // Teal 600
  accentLight: '#3cddc7', // Tertiary Fixed Dim
  onSurface: '#1b1b1d',
  onSurfaceVariant: '#45464d',
  containerLow: '#f6f3f5'
};

const AdminPanel_V2 = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState({
    propiedades: [],
    reservas: [],
    tareas: [],
    staff: [],
    propietarios: [],
    zonas: []
  });

  const [modal, setModal] = useState({ show: false, type: '', edit: null });
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  const navigate = useNavigate();

  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 4000);
  };

  const fetchData = async () => {
    try {
      const [p, r, t, s, ow, z] = await Promise.all([
        api.get('/propiedades/').then(res => res.data),
        api.get('/reservas/').then(res => res.data),
        api.get('/tareas/').then(res => res.data),
        api.get('/staff/').then(res => res.data),
        api.get('/propietarios/').then(res => res.data),
        api.get('/zonas/').then(res => res.data)
      ]);
      setData({ propiedades: p, reservas: r, tareas: t, staff: s, propietarios: ow, zonas: z });
    } catch (error) {
      console.error("Error fetching V2 data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async (cfg) => {
    if (cfg.type === 'propiedad_delete') {
       if (confirm('¿Desactivar esta propiedad?')) {
          try {
            await api.delete(`/propiedades/${cfg.id}`);
            showToast('Propiedad desactivada', 'success');
            fetchData();
          } catch(e) { showToast('Error al desactivar', 'error'); }
       }
       return;
    }
    setModal({ show: true, type: cfg.type, edit: cfg.edit });
  };

  const menuItems = [
    { id: 'dashboard', label: 'Panel', icon: 'dashboard' },
    { id: 'reservas', label: 'Reservas', icon: 'description' },
    { id: 'propiedades', label: 'Propiedades', icon: 'domain' },
    { id: 'huespedes', label: 'Huéspedes', icon: 'group' },
    { id: 'mantenimiento', label: 'Mantenimiento', icon: 'build' },
    { id: 'reportes', label: 'Reportes', icon: 'analytics' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'reservas':
        return (
          <ReservasView_V2 
            data={data.reservas} 
            propiedades={data.propiedades} 
            onAction={handleAction}
            onRefresh={fetchData}
            showToast={showToast}
          />
        );
      case 'propiedades':
        return (
          <PropiedadesView_V2 
            data={data.propiedades} 
            propietarios={data.propietarios}
            onAction={handleAction}
            onRefresh={fetchData}
            showToast={showToast}
          />
        );
      default:
        return (
          <div className="p-8 text-center mt-20">
            <h2 className="text-2xl font-bold text-slate-400 uppercase tracking-widest">Módulo en Desarrollo</h2>
            <p className="text-slate-500 mt-2">Próximamente bajo el estándar Slate Precision</p>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-[#fcf8fa] font-['Inter'] selection:bg-[#62fae3] selection:text-[#00201c]">
      {/* SideNavBar - Slate Precision Atelier */}
      <aside className="h-screen w-64 fixed left-0 top-0 bg-[#0F172A] flex flex-col py-6 z-50 shadow-xl font-['Manrope']">
        <div className="flex items-center gap-3 px-2 mb-10">
          <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-900/20">
            <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>Domain</span>
          </div>
          <div>
            <h1 className="text-white font-black text-xl tracking-tighter leading-none">ClearHost</h1>
            <p className="text-[10px] text-teal-500 font-bold uppercase tracking-widest mt-1">Admin Panel V2</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-2">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium tracking-tight ${
                activeTab === item.id 
                  ? 'bg-slate-800 text-[#3cddc7] border-l-4 border-[#3cddc7]' 
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
              }`}
            >
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="px-4 mt-auto">
          <button 
            onClick={() => handleAction({ type: 'propiedad' })}
            className="w-full bg-[#3cddc7] hover:bg-[#32b9a7] text-slate-950 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 mb-6 shadow-lg shadow-[#3cddc7]/10 active:scale-95"
          >
            <span className="material-symbols-outlined">add_circle</span> 
            Agregar Propiedad
          </button>
          
          <div className="space-y-1">
            <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white transition-all text-sm">
              <span className="material-symbols-outlined">settings</span>
              <span>Ajustes</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white transition-all text-sm">
              <span className="material-symbols-outlined">help_outline</span>
              <span>Soporte</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Canvas */}
      <main className="ml-64 flex-1 flex flex-col min-h-screen relative">
        {/* TopNavBar */}
        <header className="flex justify-between items-center w-full px-8 h-14 sticky top-0 z-40 bg-slate-50/80 backdrop-blur-md border-b border-slate-200/50">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-full max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
              <input 
                className="w-full pl-10 pr-4 py-1.5 bg-slate-200/50 border-none rounded-md text-sm focus:ring-2 focus:ring-[#3cddc7] transition-all outline-none" 
                placeholder="Buscar reservas o propiedades..." 
                type="text"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <nav className="hidden lg:flex items-center gap-6 text-sm font-['Manrope'] font-semibold">
              <span className="text-[#0d9488] font-bold">Suite de Propiedades</span>
              <span className="text-slate-400">|</span>
              <div className="flex gap-4">
                <button className="text-slate-500 hover:bg-slate-200/50 px-2 py-1 rounded-md transition-all">Resumen</button>
                <button className="text-[#0d9488] font-bold px-2 py-1 rounded-md transition-all border-b-2 border-[#0d9488]">Calendario</button>
                <button className="text-slate-500 hover:bg-slate-200/50 px-2 py-1 rounded-md transition-all">Analíticas</button>
              </div>
            </nav>

            <div className="flex items-center gap-3 border-l border-slate-200 pl-6 h-8">
              <button className="p-2 text-slate-500 hover:bg-slate-200/50 rounded-md transition-all relative">
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button className="p-2 text-slate-500 hover:bg-slate-200/50 rounded-md transition-all">
                <span className="material-symbols-outlined">mail</span>
              </button>
              <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-900 border border-slate-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-xl">account_circle</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <section className="flex-1 animate-in fade-in duration-700">
          {renderContent()}
        </section>

        {/* Premium Toast Notification */}
        {toast.show && (
          <div className={`fixed bottom-8 right-8 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border transition-all animate-in slide-in-from-right-10 duration-500 ${
            toast.type === 'success' ? 'bg-[#131b2e] border-[#3cddc7]/50 text-[#3cddc7]' :
            toast.type === 'error' ? 'bg-[#93000a] text-white border-red-500/50' :
            'bg-slate-900 border-slate-700 text-slate-50'
          }`}>
            <span className="material-symbols-outlined text-xl">
              {toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'report' : 'info'}
            </span>
            <span className="font-['Manrope'] text-sm font-bold uppercase tracking-widest">{toast.message}</span>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPanel_V2;
