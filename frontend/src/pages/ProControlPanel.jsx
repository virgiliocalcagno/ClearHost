import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import ProVisionLayout from '../layouts/ProVisionLayout';
import PropiedadesView from '../views/PropiedadesView';
import CalendarioMultipleView from '../views/CalendarioMultipleView';
import { TareasView_V2 } from '../views/TareasView_V2';
import ModalForm from '../components/ModalForm';

const ProControlPanel = () => {
  const { moduleId = 'tablero' } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    propiedades: [],
    reservas: [],
    tareas: [],
    staff: [],
    propietarios: [],
    zonas: [],
    inventario: []
  });
  
  const [modal, setModal] = useState({ show: false, type: '', edit: null });
  const [toast, setToast] = useState({ show: false, msg: '' });

  const showToast = (msg) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: '' }), 3000);
  };

  const fetchData = async () => {
    try {
      const safe = (promise) => promise.then(r => r.data).catch(() => []);
      const [propiedades, reservas, tareas, staff, propietarios, zonas, inventario] = await Promise.all([
        safe(api.get('/propiedades/')),
        safe(api.get('/reservas/')),
        safe(api.get('/tareas/')),
        safe(api.get('/staff/')),
        safe(api.get('/propietarios/')),
        safe(api.get('/zonas/')),
        safe(api.get('/propietarios/all/inventario/')),
      ]);

      setData({ propiedades, reservas, tareas, staff, propietarios, zonas, inventario });
    } catch (error) {
      console.error("Error fetching pro-control data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getModuleName = (id) => {
    const names = {
        tablero: 'Tablero',
        inbox: 'Inbox',
        dispositivos: 'Dispositivos inteligentes',
        calendario: 'Calendario múltiple',
        reseñas: 'Reseñas',
        tareas: 'Tareas',
        equipo: 'Equipo y Miembros',
        registros: 'Registros de entrada',
        anuncios: 'Cuentas y Anuncios',
        propiedades: 'Propiedades',
        directo: 'Directo & Upsells',
        sitios: 'Sitios web',
        claves: 'Claves',
        informes: 'Informes',
        documentos: 'Documentos'
    };
    return names[id] || id;
  };

  const renderModule = () => {
    switch (moduleId) {
      case 'propiedades':
        return <PropiedadesView data={data.propiedades} propietarios={data.propietarios} staffList={data.staff} onAction={setModal} onRefresh={fetchData} showToast={showToast} />;
      case 'calendario':
        return <CalendarioMultipleView reservas={data.reservas} propiedades={data.propiedades} onAction={setModal} onRefresh={fetchData} showToast={showToast} />;
      case 'tareas':
        return (
          <TareasView_V2 
            data={data.tareas} 
            propiedades={data.propiedades} 
            staffLimpieza={data.staff}
            inventario={data.inventario}
            onAction={(cfg) => setModal({ ...cfg, show: true })}
            onRefresh={fetchData} 
            showToast={showToast}
            handleAsignar={async (id, sId) => {
              await api.put(`/tareas/${id}`, { asignado_a: sId });
            }}
            handleWhatsApp={async (id) => {
              const res = await api.get(`/tareas/${id}/whatsapp`);
              window.open(res.data.link, '_blank');
            }}
          />
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-[#7c839b]">
             <div className="w-16 h-16 bg-[#eff4ff] rounded-2xl flex items-center justify-center mb-4">
                <i className="fas fa-hard-hat text-4xl text-[#3B82F6] opacity-40"></i>
             </div>
             <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#0b1c30]">Módulo en Desarrollo</p>
             <p className="text-[10px] mt-2 italic text-[#7c839b]">Implementando arquitectura ProVision para {getModuleName(moduleId)}</p>
          </div>
        );
    }
  };

  if (loading) return (
     <div className="h-screen w-screen bg-[#f8f9ff] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-[#3B82F6] border-t-transparent rounded-full animate-spin"></div>
        <div className="flex flex-col items-center">
           <h1 className="text-[#0b1c30] font-semibold text-lg tracking-[-0.02em]">ProVision</h1>
           <span className="text-[#7c839b] text-[10px] font-bold uppercase tracking-[0.05em] mt-1">Sistema de Gestión</span>
        </div>
     </div>
  );

  return (
    <ProVisionLayout activeModule={getModuleName(moduleId)}>
      {renderModule()}

      {/* Modal Reutilizado */}
      <ModalForm 
        show={modal.show}
        type={modal.type}
        editData={modal.edit}
        onClose={() => setModal({ show: false, type: '', edit: null })}
        onSave={async (formData) => {
            try {
              let endpoint = '';
              const type = modal.type.split('-')[0]; // manejar staff-edit etc
              
              switch (type) {
                case 'tarea': endpoint = '/tareas/'; break;
                case 'propiedad': endpoint = '/propiedades/'; break;
                case 'reserva': endpoint = '/reservas/'; break;
                case 'staff': endpoint = '/staff/'; break;
                case 'propietario': endpoint = '/propietarios/'; break;
                case 'incidencia': endpoint = '/incidencias/'; break;
                case 'gasto': endpoint = '/gastos-operativos/'; break;
                case 'adelanto': endpoint = '/adelantos-staff/'; break;
                default: endpoint = `/${type}s/`;
              }

              // Normalizar data si es necesario (ej: UUIDs)
              const payload = { ...formData };
              
              if (type === 'tarea' && !payload.reserva_id) {
                delete payload.reserva_id; // Dejar que el backend maneje el nulo
              }

              if (modal.edit && modal.edit.id) {
                // Edición
                await api.put(`${endpoint}${modal.edit.id}`, payload);
                showToast(`${type.toUpperCase()} actualizada correctamente`);
              } else {
                // Creación (Usar servicio explícito para Tareas)
                if (type === 'tarea') {
                  const { crearTarea } = await import('../services/api');
                  await crearTarea(payload);
                } else {
                   await api.post(endpoint, payload);
                }
                showToast(`${type.toUpperCase()} creada con éxito`);
              }

              setModal({ show: false, type: '', edit: null });
              fetchData();
            } catch (error) {
              console.error("Error al guardar:", error);
              const errorMsg = error.response?.data?.detail || "Error de conexión con el servidor";
              showToast(`Error: ${errorMsg}`);
            }
        }}
        propiedades={data.propiedades}
        propietarios={data.propietarios}
        zonas={data.zonas}
        staffList={data.staff}
      />

      {/* ProVision Toast - Alineado con v1 */}
      {toast.show && (
        <div className="fixed bottom-10 right-10 bg-gradient-to-br from-[#131b2e] to-[#7c839b] text-white px-8 py-4 rounded-lg font-semibold text-xs uppercase tracking-[0.05em] shadow-[0_8px_32px_rgba(11,28,48,0.2)] z-[100] animate-in slide-in-from-bottom-4">
           {toast.msg}
        </div>
      )}
    </ProVisionLayout>
  );
};

export default ProControlPanel;
