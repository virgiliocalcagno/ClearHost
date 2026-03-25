import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

// Vistas Reales (Reutilizando la lógica de negocio)
import TareasView from '../views/TareasView';
import ReservasView from '../views/ReservasView';

// Componentes Globales
import ModalForm from '../components/ModalForm';

/**
 * ManagerMobile - Interfaz Premium "ClearHost Pro"
 * Basada en el diseño de Stitch ID: 12948642603457684510
 */
const ManagerMobile = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('tareas'); // 'tareas' (Operativa) o 'reservas' (Calendario)
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        tareas: [],
        reservas: [],
        propiedades: [],
        staff: [],
        propietarios: [],
        incidencias: [],
        gastos: [],
        zonas: []
    });
    const [modal, setModal] = useState({ show: false, type: '', edit: null });
    const [toast, setToast] = useState({ show: false, message: '' });

    const showToast = (msg) => {
        setToast({ show: true, message: msg });
        setTimeout(() => setToast({ show: false, message: '' }), 3000);
    };

    const fetchData = async () => {
        try {
            const [t, r, p, s, ow, inc, g, z] = await Promise.all([
                api.get('/tareas'),
                api.get('/reservas'),
                api.get('/propiedades'),
                api.get('/staff'),
                api.get('/propietarios'),
                api.get('/incidencias'),
                api.get('/gastos'),
                api.get('/zonas')
            ]);
            setData({
                tareas: t.data,
                reservas: r.data,
                propiedades: p.data,
                staff: s.data,
                propietarios: ow.data,
                incidencias: inc.data,
                gastos: g.data,
                zonas: z.data
            });
        } catch (error) {
            console.error("Error fetching mobile data:", error);
            if (error.response?.status === 401) navigate('/login');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        
        // Sincronización Real-Time
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsHost = window.location.host.includes('localhost') 
            ? 'localhost:8000' 
            : 'backend-3bjrskykwq-uc.a.run.app';
        
        const ws = new WebSocket(`${protocol}//${wsHost}/ws/actualizaciones`);
        ws.onmessage = (e) => {
            if (e.data.includes('recargar_datos')) fetchData();
        };
        
        // Cargar Fuentes Premium (Manrope e Inter)
        const link = document.createElement('link');
        link.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@700;800&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,0&display=swap";
        link.rel = "stylesheet";
        document.head.appendChild(link);

        return () => {
            ws.close();
            document.head.removeChild(link);
        };
    }, []);

    const handleSave = async (formData) => {
        try {
            let endpoint = '';
            let payload = { ...formData };
            if (payload.pago_al_staff !== undefined) payload.pago_al_staff = parseFloat(payload.pago_al_staff) || 0;
            if (payload.reserva_id === "" || payload.reserva_id === "null") payload.reserva_id = null;
            if (payload.asignado_a === "" || payload.asignado_a === "null") payload.asignado_a = null;

            switch (modal.type) {
                case 'reserva': endpoint = '/reservas'; break;
                case 'tarea': endpoint = '/tareas'; break;
                default: endpoint = `/${modal.type}s`;
            }

            if (modal.edit) {
                await api.put(`${endpoint}/${modal.edit.id}`, payload);
                showToast('Actualizado con éxito');
            } else {
                await api.post(endpoint, payload);
                showToast('Creado con éxito');
            }

            setModal({ show: false, type: '', edit: null });
            fetchData();
        } catch (error) {
            alert("Error al guardar: " + (error.response?.data?.detail || error.message));
        }
    };

    const openModal = (config) => setModal({ ...config, show: true });

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-screen bg-[#fcf8fa]">
            <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
                <div className="absolute inset-0 rounded-full border-4 border-t-teal-500 animate-spin"></div>
            </div>
            <p className="mt-6 text-slate-500 font-manrope font-bold text-sm tracking-widest uppercase">ClearHost Pro</p>
        </div>
    );

    return (
        <div className="flex flex-col h-screen bg-[#fcf8fa] text-[#1b1b1d] antialiased overflow-hidden font-inter">
            {/* TopAppBar Custom - Diseño Premium */}
            <header className="fixed top-0 w-full z-50 h-14 flex justify-between items-center px-4 bg-white/80 backdrop-blur-md border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/')} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-100 active:scale-90 transition-transform">
                        <span className="material-symbols-outlined text-xl text-slate-800">menu</span>
                    </button>
                    <h1 className="font-manrope font-extrabold text-[#111c2d] tracking-tighter text-xl">
                        ClearHost <span className="text-teal-600">Pro</span>
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={fetchData} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-100 active:rotate-180 transition-transform active:scale-95">
                        <span className="material-symbols-outlined text-xl">refresh</span>
                    </button>
                    <button onClick={() => { localStorage.clear(); navigate('/login'); }} 
                            className="bg-slate-900 text-white text-[10px] font-manrope font-extrabold px-3 py-1.5 rounded-lg active:scale-95 transition-transform uppercase tracking-widest">
                        Salir
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 mt-14 pb-24 overflow-y-auto overflow-x-hidden pt-4">
                <div className="max-w-md mx-auto px-4">
                    {/* Switcher de Título / Subheader */}
                    <div className="mb-6 flex justify-between items-end">
                        <div>
                            <h2 className="font-manrope font-extrabold text-2xl text-slate-900 tracking-tight leading-none">
                                {activeTab === 'tareas' ? 'Operativa (4D)' : 'Calendario (Gantt)'}
                            </h2>
                            <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-widest opacity-60">
                                Gestión de Manager
                            </p>
                        </div>
                    </div>

                    {/* Vistas dinámicas */}
                    <div className="w-full">
                        {activeTab === 'tareas' ? (
                            <div className="admin-fade-in">
                                <TareasView 
                                    data={data.tareas} 
                                    propiedades={data.propiedades} 
                                    staffList={data.staff} 
                                    onAction={openModal} 
                                    onRefresh={fetchData} 
                                    showToast={showToast} 
                                />
                            </div>
                        ) : (
                            <div className="admin-fade-in">
                                <ReservasView 
                                    data={data.reservas} 
                                    propiedades={data.propiedades} 
                                    onAction={openModal} 
                                    onRefresh={fetchData} 
                                    showToast={showToast} 
                                />
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Floating Action Button - Estilo Stitch */}
            <button 
                onClick={() => openModal({ show: true, type: activeTab === 'tareas' ? 'tarea' : 'reserva', edit: null })}
                className="fixed right-6 bottom-24 w-15 h-15 bg-[#131b2e] text-white rounded-2xl flex items-center justify-center shadow-2xl active:scale-90 transition-all z-40 border border-slate-700"
            >
                <span className="material-symbols-outlined text-3xl font-light">add</span>
            </button>

            {/* Bottom Navigation - Estilo Premium Blur */}
            <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-xl border-t border-slate-100 flex justify-around items-center px-6 pb-2 z-50 rounded-t-3xl shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
                <button 
                    onClick={() => setActiveTab('tareas')}
                    className={`flex flex-col items-center justify-center gap-1.5 transition-all duration-300 w-24 rounded-2xl py-2 ${activeTab === 'tareas' ? 'text-teal-600 bg-teal-50 shadow-inner' : 'text-slate-400'}`}
                >
                    <span className={`material-symbols-outlined text-2xl ${activeTab === 'tareas' ? 'fill-1' : ''}`}>task_alt</span>
                    <span className="font-manrope text-[11px] font-extrabold uppercase tracking-wider">Operativa</span>
                </button>
                <button 
                    onClick={() => setActiveTab('reservas')}
                    className={`flex flex-col items-center justify-center gap-1.5 transition-all duration-300 w-24 rounded-2xl py-2 ${activeTab === 'reservas' ? 'text-teal-600 bg-teal-50 shadow-inner' : 'text-slate-400'}`}
                >
                    <span className={`material-symbols-outlined text-2xl ${activeTab === 'reservas' ? 'fill-1' : ''}`}>calendar_today</span>
                    <span className="font-manrope text-[11px] font-extrabold uppercase tracking-wider">Calendario</span>
                </button>
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

            {/* Premium Toasts */}
            {toast.show && (
                <div className="fixed bottom-28 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md text-white px-6 py-3 rounded-2xl shadow-2xl z-50 text-xs font-manrope font-bold flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300 border border-teal-500/20">
                    <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
                    {toast.message}
                </div>
            )}

            {/* Inyección de Estilos Globales para Componentes Internos */}
            <style jsx="true">{`
                .font-manrope { font-family: 'Manrope', sans-serif; }
                .font-inter { font-family: 'Inter', sans-serif; }
                .fill-1 { font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
                
                .admin-fade-in { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                
                /* Inyectar estilos para los componentes TareasView y ReservasView */
                .admin-topbar { background: transparent !important; padding: 0 !important; margin-bottom: 1rem !important; }
                .admin-topbar h2 { display: none !important; }
                .topbar-subtitle { display: none !important; }
                .topbar-actions { flex-wrap: nowrap !important; overflow-x: auto; padding-bottom: 0.5rem; gap: 0.5rem !important; scrollbar-width: none; }
                .topbar-actions::-webkit-scrollbar { display: none; }
                
                .btn-admin { 
                    background: white !important; 
                    color: #1e293b !important; 
                    border: 1px solid #f1f5f9 !important; 
                    box-shadow: 0 1px 3px rgba(0,0,0,0.02) !important;
                    border-radius: 12px !important;
                    font-family: 'Inter', sans-serif !important;
                    font-weight: 600 !important;
                    font-size: 11px !important;
                    padding: 8px 14px !important;
                    white-space: nowrap;
                }
                .btn-admin.primario { background: #131b2e !important; color: white !important; }

                .admin-table-wrapper { 
                    border: none !important; 
                    box-shadow: none !important; 
                    background: transparent !important;
                    padding: 0 !important;
                }
                
                /* Estilo de Tarjetas de Tareas Reales para que coincidan con Stitch */
                .tarea-card { 
                    background: white !important;
                    border-radius: 20px !important;
                    padding: 20px !important;
                    border: 1px solid #f8fafc !important;
                    box-shadow: 0 4px 12px rgba(15,23,42,0.03) !important;
                    margin-bottom: 1rem !important;
                }

                .gantt-container {
                    min-width: 1000px;
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.05);
                }

                /* Ocultar redundantes */
                .sidebar-toggle, .pc-only { display: none !important; }
            `}</style>
        </div>
    );
};

export default ManagerMobile;
