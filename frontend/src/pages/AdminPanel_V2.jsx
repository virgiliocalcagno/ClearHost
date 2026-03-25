import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { asignarTarea, generarLinkWhatsApp } from '../services/api';
import ModalForm from '../components/ModalForm';

// Vistas V2
import { TareasView_V2 } from '../views/TareasView_V2';
import { VistaOperativa_V2 } from '../views/VistaOperativa_V2';
import { VistaSemanal_V2 } from '../views/VistaSemanal_V2';

const AdminPanel_V2 = () => {
  const [activeTab, setActiveTab] = useState('semanal'); // semanal, operativa, tareas
  const [dayOffset, setDayOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    propiedades: [],
    reservas: [],
    tareas: [],
    staff: [],
    propietarios: [],
    zonas: []
  });

  const [modal, setModal] = useState({ show: false, type: '', edit: null });
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const [p, r, t, s, ow, z] = await Promise.all([
        api.get('/propiedades'),
        api.get('/reservas'),
        api.get('/tareas'),
        api.get('/staff'),
        api.get('/propietarios'),
        api.get('/zonas')
      ]);

      setData({
        propiedades: p.data,
        reservas: r.data,
        tareas: t.data,
        staff: s.data,
        propietarios: ow.data,
        zonas: z.data
      });
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAsignar = async (tareaId, staffId, horaInicio) => {
    try {
      await asignarTarea(tareaId, staffId || null, horaInicio);
      fetchData();
    } catch (err) {
      alert('Error al asignar tarea');
    }
  };

  const handleWhatsApp = async (id) => {
    try {
      const res = await generarLinkWhatsApp(id);
      window.open(res.link, '_blank');
    } catch(err) {
      alert("No se pudo generar link de WhatsApp");
    }
  };

  const handleSave = async (formData) => {
    try {
        let endpoint = '';
        let method = 'POST';
        let payload = { ...formData };
        
        switch (modal.type) {
            case 'tarea': endpoint = '/tareas'; break;
            case 'propiedad': endpoint = '/propiedades'; break;
            case 'reserva': endpoint = '/reservas'; break;
            default: return;
        }

        if (modal.edit) {
            method = 'PUT';
            await api.put(`${endpoint}/${modal.edit.id}`, payload);
        } else {
            await api.post(endpoint, payload);
        }
        
        setModal({ show: false, type: '', edit: null });
        fetchData();
    } catch (error) {
        alert("Error al guardar cambios");
    }
  };

  const staffLimpieza = (data.staff || []).filter(s => s.rol === 'STAFF' || s.rol === 'LIMPIEZA');

  const renderContent = () => {
    if (loading) return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-[#62fae3] border-t-black rounded-full animate-spin" />
        <p className="font-black text-xs uppercase tracking-[0.3em] text-[#545f73]">Cargando Entorno Pro V2...</p>
      </div>
    );

    switch (activeTab) {
      case 'semanal':
        return <VistaSemanal_V2 data={data.reservas} propiedades={data.propiedades} />;
      case 'operativa':
        return (
          <VistaOperativa_V2 
            tareas={data.tareas} 
            propiedades={data.propiedades} 
            handleAsignar={handleAsignar}
            handleTimeChange={handleAsignar}
            staffLimpieza={staffLimpieza}
            handleWhatsApp={handleWhatsApp}
            dayOffset={dayOffset}
            setDayOffset={setDayOffset}
          />
        );
      case 'tareas':
        return (
          <TareasView_V2 
            data={data.tareas} 
            propiedades={data.propiedades} 
            onAction={(cfg) => setModal({ ...cfg, show: true })}
            handleAsignar={handleAsignar}
            handleWhatsApp={handleWhatsApp}
            staffLimpieza={staffLimpieza}
            onRefresh={fetchData}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#fcf8fa] text-[#000000] font-sans selection:bg-[#62fae3] selection:text-black">
      <header className="h-24 flex items-center justify-between px-12 bg-[#fcf8fa]">
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-[#62fae3] font-black text-2xl shadow-xl hover:rotate-6 transition-transform">CH</div>
          <h1 className="text-2xl font-black tracking-tighter">ClearHost <span className="text-[#545f73] font-light italic ml-1">Pro v2.1</span></h1>
        </div>
        <div className="flex items-center gap-8 bg-[#f6f3f5] p-2 pl-6 rounded-full">
          <div className="text-right">
            <p className="text-xs font-black uppercase tracking-widest leading-none mb-1">Administrator</p>
            <p className="text-[10px] text-[#545f73] font-bold">CONTROL CENTER</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-2xl shadow-sm border-4 border-[#f6f3f5]">👤</div>
        </div>
      </header>

      <main className="pb-40 pt-10 px-12">
        <div className="max-w-[1700px] mx-auto">
          {renderContent()}
        </div>
      </main>

      {/* Dock Flotante */}
      <nav className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-white/90 backdrop-blur-2xl rounded-[3rem] p-3 flex items-center gap-3 shadow-[0_30px_60px_rgba(0,0,0,0.15)] border border-white/20">
          <button 
            onClick={() => setActiveTab('semanal')}
            className={`px-10 py-5 rounded-full font-black text-[11px] uppercase tracking-[0.2em] transition-all ${activeTab === 'semanal' ? 'bg-[#000000] text-[#62fae3] shadow-lg' : 'text-[#545f73] hover:bg-[#f6f3f5]'}`}
          >
            Semanal 7D
          </button>
          <button 
            onClick={() => setActiveTab('operativa')}
            className={`px-10 py-5 rounded-full font-black text-[11px] uppercase tracking-[0.2em] transition-all ${activeTab === 'operativa' ? 'bg-[#000000] text-[#62fae3] shadow-lg' : 'text-[#545f73] hover:bg-[#f6f3f5]'}`}
          >
            Operativa 4D
          </button>
          <button 
            onClick={() => setActiveTab('tareas')}
            className={`px-10 py-5 rounded-full font-black text-[11px] uppercase tracking-[0.2em] transition-all ${activeTab === 'tareas' ? 'bg-[#000000] text-[#62fae3] shadow-lg' : 'text-[#545f73] hover:bg-[#f6f3f5]'}`}
          >
            Tareas
          </button>
          <div className="w-px h-10 bg-[#e4e2e4] mx-2" />
          <button 
            onClick={() => { localStorage.clear(); navigate('/login'); }}
            className="w-14 h-14 rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 transition-all text-xl"
            title="Cerrar Sesión"
          >
            🚪
          </button>
        </div>
      </nav>

      {/* Modal Form */}
      <ModalForm 
        show={modal.show}
        type={modal.type}
        editData={modal.edit}
        onClose={() => setModal({ show: false, type: '', edit: null })}
        onSave={handleSave}
        propiedades={data.propiedades}
        propietarios={data.propietarios}
        zonas={data.zonas}
        staffList={data.staff}
      />
    </div>
  );
};

export default AdminPanel_V2;
