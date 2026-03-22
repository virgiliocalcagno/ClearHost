import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './AdminPanel.css';

// Vistas
import DashboardView from '../views/DashboardView';
import PropiedadesView from '../views/PropiedadesView';
import TareasView from '../views/TareasView';
import ReservasView from '../views/ReservasView';
import StaffView from '../views/StaffView';
import PropietariosView from '../views/PropietariosView';
import MantenimientoView from '../views/MantenimientoView';
import LiquidacionView from '../views/LiquidacionView';
import NominaView from '../views/NominaView';

// Componentes
import ModalForm from '../components/ModalForm';

const AdminPanel = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    propiedades: 0,
    reservasActivas: 0,
    tareasPendientes: 0,
    tareasCompletadas: 0,
    staffDisponible: 0
  });

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

  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ show: false, type: '', edit: null });
  const [toast, setToast] = useState({ show: false, message: '' });

  const showToast = (msg) => {
    setToast({ show: true, message: msg });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  };

  const fetchData = async () => {
    try {
      const [p, r, t, s, ow, inc, g, z] = await Promise.all([
        api.get('/propiedades'),
        api.get('/reservas'),
        api.get('/tareas'),
        api.get('/staff'),
        api.get('/propietarios'),
        api.get('/incidencias'),
        api.get('/gastos'),
        api.get('/zonas')
      ]);

      const props = p.data;
      const tasks = t.data;
      const staff = s.data;

      setData({
        propiedades: props,
        reservas: r.data,
        tareas: tasks,
        staff: staff,
        propietarios: ow.data,
        incidencias: inc.data,
        gastos: g.data,
        zonas: z.data
      });

      setStats({
        propiedades: props.length,
        reservasActivas: r.data.filter(res => res.estado === 'CONFIRMADA').length,
        tareasPendientes: tasks.filter(tk => tk.estado === 'PENDIENTE' || tk.estado === 'ASIGNADA_NO_CONFIRMADA').length,
        tareasCompletadas: tasks.filter(tk => tk.estado === 'COMPLETADA' || tk.estado === 'CLEAN_AND_READY' || tk.estado === 'VERIFICADA').length,
        staffDisponible: staff.filter(m => m.disponible).length
      });

    } catch (error) {
      console.error("Error fetching admin data:", error);
      if (error.response?.status === 401) navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (formData) => {
    try {
      let endpoint = '';
      let method = 'POST';
      
      switch (modal.type) {
        case 'propiedad': endpoint = '/propiedades'; break;
        case 'reserva': endpoint = '/reservas'; break;
        case 'staff': endpoint = '/staff'; break;
        case 'staff-edit': endpoint = `/staff/${formData.id}`; method = 'PUT'; break;
        case 'propietario': endpoint = '/propietarios'; break;
        case 'incidencia': endpoint = '/incidencias'; break;
        case 'gasto': endpoint = '/gastos'; break;
        case 'adelanto': endpoint = '/staff/adelantos'; break;
        default: return;
      }

      if (modal.edit && modal.type !== 'staff-edit') {
        method = 'PUT';
        const id = modal.edit.id;
        await api.put(`${endpoint}/${id}`, formData);
        showToast('Actualizado con éxito');
      } else if (method === 'PUT') {
        await api.put(endpoint, formData);
        showToast('Actualizado con éxito');
      } else {
        await api.post(endpoint, formData);
        showToast('Creado con éxito');
      }
      
      setModal({ show: false, type: '', edit: null });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.detail || "Error al guardar");
    }
  };

  const renderContent = () => {
    const commonProps = { onRefresh: fetchData, showToast };
    
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView stats={stats} data={data} />;
      case 'propiedades':
        return <PropiedadesView data={data.propiedades} propietarios={data.propietarios} onAction={setModal} {...commonProps} />;
      case 'tareas':
        return <TareasView data={data.tareas} propiedades={data.propiedades} staffList={data.staff} {...commonProps} />;
      case 'reservas':
        return <ReservasView data={data.reservas} propiedades={data.propiedades} onAction={setModal} {...commonProps} />;
      case 'staff':
        return <StaffView data={data.staff} onAction={setModal} {...commonProps} />;
      case 'propietarios':
        return <PropietariosView data={data.propietarios} propiedades={data.propiedades} onAction={setModal} navigate={navigate} {...commonProps} />;
      case 'mantenimiento':
        return <MantenimientoView data={data.incidencias} propiedades={data.propiedades} onAction={setModal} {...commonProps} />;
      case 'liquidacion':
        return <LiquidacionView gastos={data.gastos} propiedades={data.propiedades} reservas={data.reservas} onAction={setModal} {...commonProps} />;
      case 'nomina':
        return <NominaView staffList={data.staff} onAction={setModal} {...commonProps} />;
      default:
        return <DashboardView stats={stats} data={data} />;
    }
  };

  if (loading) return (
    <div className="admin-loading">
      <div className="loader"></div>
      <p>Cargando panel de control...</p>
    </div>
  );

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo">CH</div>
          <h1>ClearHost <span>v2.0</span></h1>
        </div>
        
        <nav className="sidebar-nav">
          <button className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <span className="nav-icon">📊</span> Dashboard
          </button>
          <button className={`nav-item ${activeTab === 'propiedades' ? 'active' : ''}`} onClick={() => setActiveTab('propiedades')}>
            <span className="nav-icon">🏠</span> Propiedades
          </button>
          <button className={`nav-item ${activeTab === 'tareas' ? 'active' : ''}`} onClick={() => setActiveTab('tareas')}>
            <span className="nav-icon">🧹</span> Tareas
          </button>
          <button className={`nav-item ${activeTab === 'reservas' ? 'active' : ''}`} onClick={() => setActiveTab('reservas')}>
            <span className="nav-icon">📅</span> Reservas
          </button>
          <div className="nav-divider">Recursos</div>
          <button className={`nav-item ${activeTab === 'staff' ? 'active' : ''}`} onClick={() => setActiveTab('staff')}>
            <span className="nav-icon">👥</span> Staff
          </button>
          <button className={`nav-item ${activeTab === 'propietarios' ? 'active' : ''}`} onClick={() => setActiveTab('propietarios')}>
            <span className="nav-icon">🤝</span> Propietarios
          </button>
          <button className={`nav-item ${activeTab === 'mantenimiento' ? 'active' : ''}`} onClick={() => setActiveTab('mantenimiento')}>
            <span className="nav-icon">🔧</span> Mantenimiento
          </button>
          <button className={`nav-item ${activeTab === 'liquidacion' ? 'active' : ''}`} onClick={() => setActiveTab('liquidacion')}>
            <span className="nav-icon">💸</span> Liquidación
          </button>
          <button className={`nav-item ${activeTab === 'nomina' ? 'active' : ''}`} onClick={() => setActiveTab('nomina')}>
            <span className="nav-icon">💰</span> Nómina
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="btn-logout" onClick={() => { localStorage.clear(); navigate('/login'); }}>
            🚪 Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        {renderContent()}
      </main>

      {/* Modal Form Unificado */}
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

      {/* Toast Notification */}
      {toast.show && (
        <div className="admin-toast">
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
