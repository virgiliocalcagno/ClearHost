import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Shield, 
  Home, 
  Bell, 
  Check, 
  Trash2, 
  Mail, 
  Phone, 
  ChevronRight,
  Info,
  Layers,
  Globe,
  Settings,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './MemberManagementSidebar.css';

const MemberManagementSidebar = ({ show, member, onClose, onSave, onDelete, properties = [] }) => {
  const [activeTab, setActiveTab] = useState('personal');
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    rol: 'STAFF',
    status: 'ACTIVE',
    permisos: {
      calendario: true,
      tareas: true,
      precios: false,
      inbox: false,
      finanzas: false,
      canales: false
    },
    propiedades_acceso: [],
    etiquetas_acceso: [],
    acceso_total: false,
    notificaciones_pref: {
      email: { active: true, events: ['new_task', 'booking_change'] },
      sms: { active: false, events: [] },
      push: { active: true, events: ['new_task'] }
    }
  });

  useEffect(() => {
    if (member) {
      setFormData({
        ...member,
        permisos: member.permisos || formData.permisos,
        propiedades_acceso: member.propiedades_acceso || [],
        notificaciones_pref: member.notificaciones_pref || formData.notificaciones_pref,
        status: member.status || 'ACTIVE'
      });
    } else {
      // Reset for new member
      setFormData({
        nombre: '',
        email: '',
        telefono: '',
        rol: 'STAFF',
        status: 'PENDING',
        permisos: {
          calendario: true,
          tareas: true,
          precios: false,
          inbox: false,
          finanzas: false,
          canales: false
        },
        propiedades_acceso: [],
        etiquetas_acceso: [],
        acceso_total: false,
        notificaciones_pref: {
          email: { active: true, events: ['new_task'] },
          sms: { active: false, events: [] },
          push: { active: true, events: ['new_task'] }
        }
      });
    }
  }, [member, show]);

  if (!show) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const togglePermission = (key) => {
    setFormData(prev => ({
      ...prev,
      permisos: { ...prev.permisos, [key]: !prev.permisos[key] }
    }));
  };

  const toggleProperty = (id) => {
    setFormData(prev => {
      const ids = prev.propiedades_acceso.includes(id)
        ? prev.propiedades_acceso.filter(i => i !== id)
        : [...prev.propiedades_acceso, id];
      return { ...prev, propiedades_acceso: ids };
    });
  };

  const toggleNotifChannel = (channel) => {
    setFormData(prev => ({
      ...prev,
      notificaciones_pref: {
        ...prev.notificaciones_pref,
        [channel]: { ...prev.notificaciones_pref[channel], active: !prev.notificaciones_pref[channel].active }
      }
    }));
  };

  return (
    <AnimatePresence>
      <div className="sidebar-overlay" onClick={onClose}>
        <motion.div 
          className="member-sidebar"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sidebar-header">
            <div className="header-top">
              <button className="close-btn" onClick={onClose}><X size={20} /></button>
              <div className="member-badge">
                <div className={`status-dot ${formData.status === 'ACTIVE' ? 'bg-green-500' : 'bg-amber-400'}`}></div>
                <span>{formData.status === 'ACTIVE' ? 'Activo' : 'Invitación Pendiente'}</span>
              </div>
            </div>
            
            <div className="member-info-summary">
              {formData.status === 'PENDING' && (
                <div className="pending-notice">
                  <Clock size={16} />
                  <span>Invitación pendiente de aceptar</span>
                  <button 
                    className="resend-btn"
                    onClick={() => alert("Invitación reenviada a " + formData.email)}
                  >
                    Reenviar
                  </button>
                </div>
              )}

              {formData.last_activity && (
                <div className="activity-info">
                  <span>Última actividad:</span>
                  <b>{new Date(formData.last_activity).toLocaleString()}</b>
                </div>
              )}
              <div className="avatar-large">
                {formData.nombre ? formData.nombre.charAt(0) : <User />}
              </div>
              <div className="title-area">
                <h2>{formData.nombre || 'Nuevo Miembro'}</h2>
                <span className="role-label">{formData.rol}</span>
              </div>
            </div>

            <div className="sidebar-tabs">
              <button 
                className={`tab-btn ${activeTab === 'personal' ? 'active' : ''}`}
                onClick={() => setActiveTab('personal')}
              >
                Personal
              </button>
              <button 
                className={`tab-btn ${activeTab === 'permisos' ? 'active' : ''}`}
                onClick={() => setActiveTab('permisos')}
              >
                Permisos
              </button>
              <button 
                className={`tab-btn ${activeTab === 'acceso' ? 'active' : ''}`}
                onClick={() => setActiveTab('acceso')}
              >
                Acceso
              </button>
              <button 
                className={`tab-btn ${activeTab === 'notificaciones' ? 'active' : ''}`}
                onClick={() => setActiveTab('notificaciones')}
              >
                Avisos
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="sidebar-body">
            {activeTab === 'personal' && (
              <div className="tab-content personal-tab">
                <div className="form-section">
                  <label>Nombre y Apellido</label>
                  <input 
                    name="nombre" 
                    value={formData.nombre} 
                    onChange={handleChange} 
                    placeholder="Ej. Juan Pérez"
                    className="sidebar-input"
                  />
                </div>
                <div className="form-section">
                  <label>Correo Electrónico</label>
                  <div className="input-with-icon">
                    <Mail size={16} />
                    <input 
                      name="email" 
                      value={formData.email} 
                      onChange={handleChange} 
                      placeholder="juan@clearhost.pro"
                      className="sidebar-input"
                    />
                  </div>
                </div>
                <div className="form-section">
                  <label>WhatsApp / Teléfono</label>
                  <div className="input-with-icon">
                    <Phone size={16} />
                    <input 
                      name="telefono" 
                      value={formData.telefono} 
                      onChange={handleChange} 
                      placeholder="+1 829..."
                      className="sidebar-input"
                    />
                  </div>
                </div>
                <div className="form-section">
                  <label>Rol en el Equipo</label>
                  <select name="rol" value={formData.rol} onChange={handleChange} className="sidebar-select">
                    <option value="SUPER_ADMIN">Administrador</option>
                    <option value="MANAGER_LOCAL">Gerente de Operaciones</option>
                    <option value="STAFF">Equipo de Limpieza / Campo</option>
                    <option value="OWNER">Propietario / Dueño</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === 'permisos' && (
              <div className="tab-content permisos-tab">
                <p className="tab-desc">Define qué módulos puede ver y gestionar este miembro.</p>
                <div className="permissions-list">
                  {Object.keys(formData.permisos).map(key => (
                    <div key={key} className="perm-item">
                      <div className="perm-info">
                        <span className="capitalize">{key === 'canales' ? 'Gestión de Canales' : key}</span>
                        <p className="text-[11px] text-slate-500">Acceso total al módulo de {key}.</p>
                      </div>
                      <label className="switch">
                        <input 
                          type="checkbox" 
                          checked={formData.permisos[key]} 
                          onChange={() => togglePermission(key)} 
                        />
                        <span className="slider round"></span>
                      </label>
                    </div>
                  ))}
                </div>
                <div className="permission-alert">
                  <Info size={14} />
                  <span>Los administradores tienen acceso total por defecto.</span>
                </div>
              </div>
            )}

            {activeTab === 'acceso' && (
              <div className="tab-content acceso-tab">
                <div className="master-switch">
                  <div className="flex flex-col">
                    <span className="font-bold text-sm">Acceso a todas las propiedades</span>
                    <span className="text-[11px] text-slate-500">Incluyendo nuevas propiedades futuras</span>
                  </div>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={formData.acceso_total} 
                      onChange={() => setFormData(prev => ({...prev, acceso_total: !prev.acceso_total}))} 
                    />
                    <span className="slider round"></span>
                  </label>
                </div>

                {!formData.acceso_total && (
                  <div className="property-selection-area">
                    <div className="section-title">Propiedades Individuales</div>
                    <div className="property-scroll-list">
                      {properties.map(prop => (
                        <div 
                          key={prop.id} 
                          className={`sidebar-prop-card ${formData.propiedades_acceso.includes(prop.id) ? 'selected' : ''}`}
                          onClick={() => toggleProperty(prop.id)}
                        >
                          <div className="check-indicator">
                            {formData.propiedades_acceso.includes(prop.id) && <Check size={12} />}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-sm">{prop.nombre}</span>
                            <span className="text-[10px] text-slate-500 uppercase">{prop.ciudad}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'notificaciones' && (
              <div className="tab-content notif-tab">
                <p className="tab-desc">Configura cómo recibe alertas este compañero.</p>
                
                {['email', 'push', 'sms'].map(channel => (
                  <div key={channel} className="channel-group">
                    <div className="channel-header" onClick={() => toggleNotifChannel(channel)}>
                      <div className="flex items-center gap-3">
                        <div className={`channel-icon ${formData.notificaciones_pref[channel].active ? 'active' : ''}`}>
                          {channel === 'email' ? <Mail size={16} /> : channel === 'sms' ? <Phone size={16} /> : <Bell size={16} />}
                        </div>
                        <span className="capitalize font-bold">{channel === 'sms' ? 'Mensajes de Texto' : channel}</span>
                      </div>
                      <label className="switch pointer-events-none">
                        <input type="checkbox" checked={formData.notificaciones_pref[channel].active} readOnly />
                        <span className="slider round"></span>
                      </label>
                    </div>
                    {formData.notificaciones_pref[channel].active && (
                      <div className="channel-events">
                        <div className="event-item">
                          <span>Nueva Tarea Asignada</span>
                          <Check size={14} className="text-teal-600" />
                        </div>
                        <div className="event-item">
                          <span>Cambio en Reserva</span>
                          <Check size={14} className="text-teal-600" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sidebar-footer">
            <div className="footer-left">
              <button className="btn-save" onClick={() => onSave(formData)}>
                Guardar Cambios
              </button>
              <button className="btn-cancel" onClick={onClose}>
                Cancelar
              </button>
            </div>
            {member && (
              <button className="btn-delete" onClick={() => onDelete(member.id)}>
                <Trash2 size={18} />
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default MemberManagementSidebar;
