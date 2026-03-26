import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ReservasView_V2 } from '../views/ReservasView_V2';
import { PropiedadesView_V2 } from '../views/PropiedadesView_V2';
import DashboardView_V2 from '../views/DashboardView_V2';
import TareasView_V2 from '../views/TareasView_V2';
import StaffView_V2 from '../views/StaffView_V2';
import PropietariosView_V2 from '../views/PropietariosView_V2';
import MantenimientoView_V2 from '../views/MantenimientoView_V2';
import LiquidacionView_V2 from '../views/LiquidacionView_V2';
import NominaView_V2 from '../views/NominaView_V2';
import ModalReserva_V2 from '../components/ModalReserva_V2';

// Colores Slate Precision Atómicos
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
    incidencias: [],
    gastos: [],
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
      const [p, r, t, s, ow, inc, g, z] = await Promise.all([
        api.get('/propiedades/').then(res => res.data),
        api.get('/reservas/').then(res => res.data),
        api.get('/tareas/').then(res => res.data),
        api.get('/staff/').then(res => res.data),
        api.get('/propietarios/').then(res => res.data),
        api.get('/incidencias/').then(res => res.data),
        api.get('/gastos/').then(res => res.data),
        api.get('/zonas/').then(res => res.data)
      ]);
      setData({ 
        propiedades: p, 
        reservas: r, 
        tareas: t, 
        staff: s, 
        propietarios: ow, 
        incidencias: inc,
        gastos: g,
        zonas: z 
      });
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

  const handleSave = async (formData) => {
    try {
      let endpoint = '';
      let payload = { ...formData };

      // Limpieza de datos
      if (payload.num_huespedes) payload.num_huespedes = parseInt(payload.num_huespedes);
      
      switch (modal.type) {
        case 'reserva': endpoint = '/reservas'; break;
        default: return;
      }

      if (modal.edit) {
        await api.put(`${endpoint}/${modal.edit.id}`, payload);
        showToast('Reserva actualizada', 'success');
      } else {
        await api.post(endpoint, payload);
        showToast('Reserva creada', 'success');
      }
      
      setModal({ show: false, type: '', edit: null });
      
      // Espera para tareas automáticas en backend
      if (!modal.edit && modal.type === 'reserva') {
        await new Promise(r => setTimeout(r, 800));
      }
      
      fetchData();
    } catch (error) {
      console.error("Error saving V2 data:", error);
      showToast('Error al guardar datos', 'error');
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'propiedades', label: 'Propiedades', icon: 'domain' },
    { id: 'tareas', label: 'Tareas', icon: 'cleaning_services' },
    { id: 'reservas', label: 'Reservas', icon: 'calendar_month' },
    { id: 'staff', label: 'Staff', icon: 'badge' },
    { id: 'propietarios', label: 'Propietarios', icon: 'handshake' },
    { id: 'mantenimiento', label: 'Mantenimiento', icon: 'build' },
    { id: 'liquidacion', label: 'Liquidación', icon: 'payments' },
    { id: 'nomina', label: 'Nómina', icon: 'savings' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView_V2 
            stats={{
              propiedades: data.propiedades.length,
              reservasActivas: data.reservas.filter(r => r.estado === 'CONFIRMADA').length,
              tareasPendientes: data.tareas.filter(t => t.estado === 'PENDIENTE').length,
              tareasCompletadas: data.tareas.filter(t => t.estado === 'COMPLETADA').length,
              staffDisponible: data.staff.length
            }}
            data={data}
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
      case 'tareas':
        return (
          <TareasView_V2 
            data={data.tareas}
            propiedades={data.propiedades}
            staffList={data.staff}
            onAction={handleAction}
            onRefresh={fetchData}
            showToast={showToast}
          />
        );
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
      case 'staff':
        return (
          <StaffView_V2 
            data={data.staff}
            onAction={handleAction}
            onRefresh={fetchData}
            showToast={showToast}
          />
        );
      case 'propietarios':
        return (
          <PropietariosView_V2 
            data={data.propietarios}
            propiedades={data.propiedades}
            onAction={handleAction}
            onRefresh={fetchData}
            showToast={showToast}
            navigate={navigate}
          />
        );
      case 'mantenimiento':
        return (
          <MantenimientoView_V2 
            data={data.incidencias}
            propiedades={data.propiedades}
            onAction={handleAction}
            onRefresh={fetchData}
            showToast={showToast}
          />
        );
      case 'liquidacion':
        return (
          <LiquidacionView_V2 
            gastos={data.gastos}
            propiedades={data.propiedades}
            onAction={handleAction}
            onRefresh={fetchData}
            showToast={showToast}
          />
        );
      case 'nomina':
        return (
          <NominaView_V2 
            staffList={data.staff}
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
    <div className="v2-theme">
      <div className="flex h-screen bg-slate-50 font-['Inter'] overflow-hidden">
        {/* SideNavBar - Slate Precision Atelier */}
        <aside className="w-64 bg-[#0F172A] flex flex-col py-6 z-50 shadow-xl font-['Manrope'] border-r border-slate-800/40">
          <div className="flex items-center gap-3 px-6 mb-10">
            <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-900/20">
              <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>Domain</span>
            </div>
            <div>
              <h1 className="text-white font-black text-xl tracking-tighter leading-none">ClearHost</h1>
              <p className="text-[10px] text-teal-500 font-bold uppercase tracking-widest mt-1">Admin Panel V2</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1 px-4 overflow-y-auto custom-scrollbar">
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium tracking-tight group ${
                  activeTab === item.id 
                    ? 'bg-slate-800 text-[#3cddc7] border-l-4 border-[#3cddc7]' 
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                }`}
              >
                <span className="material-symbols-outlined text-xl transition-transform group-hover:scale-110">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="px-4 mt-auto pt-6 border-t border-slate-800/40">
            <button 
              onClick={() => handleAction({ type: 'propiedad' })}
              className="w-full bg-[#3cddc7] hover:bg-[#32b9a7] text-slate-950 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 mb-4 shadow-lg shadow-[#3cddc7]/10 active:scale-95"
            >
              <span className="material-symbols-outlined">add_circle</span> 
              Nueva Propiedad
            </button>
            
            <button 
              onClick={() => { localStorage.clear(); navigate('/login'); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-all text-sm"
            >
              <span className="material-symbols-outlined">logout</span>
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </aside>

        {/* Main Canvas */}
        <main className="flex-1 flex flex-col min-h-screen relative overflow-hidden bg-slate-50/50">
          {/* TopNavBar */}
          <header className="flex justify-between items-center w-full px-8 h-16 sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/60 font-['Manrope']">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative w-full max-w-md">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                <input 
                  className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-[#3cddc7] transition-all outline-none text-slate-600" 
                  placeholder="Buscar en el Atelier..." 
                  type="text"
                />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="hidden lg:flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-slate-400">
                <span className="flex items-center gap-1.5 text-emerald-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Cloud Active
                </span>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span>v2.0.4</span>
              </div>

              <div className="flex items-center gap-2 border-l border-slate-200 pl-6 h-8">
                <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-all relative">
                  <span className="material-symbols-outlined">notifications</span>
                  <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></span>
                </button>
                <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-900 border-2 border-white shadow-sm flex items-center justify-center ml-2">
                  <span className="material-symbols-outlined text-white text-xl">account_circle</span>
                </div>
              </div>
            </div>
          </header>

          {/* Content Area */}
          <section className="flex-1 overflow-y-auto p-10 custom-scrollbar relative">
            {/* Header decorativo sutil */}
            <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-slate-100 to-transparent pointer-events-none -z-10" />
            
            <div className="fade-in">
              <div className="mb-8">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                  {menuItems.find(i => i.id === activeTab)?.label}
                  <span className="w-2 h-2 rounded-full bg-[#3cddc7] shadow-[0_0_10px_#3cddc7]" />
                </h2>
                <p className="text-slate-500 text-sm font-medium mt-1">
                  Atelier / {menuItems.find(i => i.id === activeTab)?.label}
                </p>
              </div>
              
              {renderContent()}
            </div>
          </section>

          {/* Premium Toast Notification */}
          {toast.show && (
            <div className="fixed bottom-8 right-8 z-[2000] flex items-center gap-3 px-6 py-4 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-800 animate-in slide-in-from-right-10 duration-500">
              <div className="w-2 h-2 rounded-full bg-[#3cddc7] animate-pulse" />
              <span className="font-['Manrope'] text-sm font-bold tracking-wide">{toast.message}</span>
            </div>
          )}
        </main>

        {/* Modal Manager V2 */}
        {modal.show && modal.type === 'reserva' && (
          <ModalReserva_V2 
            show={modal.show}
            editData={modal.edit}
            onClose={() => setModal({ show: false, type: '', edit: null })}
            onSave={handleSave}
            propiedades={data.propiedades}
          />
        )}
      </div>
    </div>
  );
};

export default AdminPanel_V2;
