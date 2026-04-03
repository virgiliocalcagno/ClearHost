import React, { useState, useMemo } from 'react';
import { 
  Search, 
  LayoutGrid, 
  List, 
  UserPlus, 
  MoreVertical, 
  Mail, 
  Phone,
  Users,
  CheckCircle2,
  Clock,
  Filter,
  ChevronDown,
  Globe,
  Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './EquipoView.css';

const EquipoView = ({ data = [], onAction, onRefresh, showToast }) => {
  const [viewMode, setViewMode] = useState('list'); // iGMS prefiere lista por defecto
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Mapeo de roles a etiquetas amigables iGMS
  const roleLabels = {
    'SUPER_ADMIN': 'Administrador',
    'MANAGER_LOCAL': 'Gerente local',
    'STAFF': 'Limpiador / Staff',
    'OWNER': 'Propietario',
    'ACCOUNTANT': 'Contador'
  };

  const filteredMembers = useMemo(() => {
    return data.filter(member => {
      const name = member.nombre || '';
      const email = member.email || '';
      const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'all' || member.rol === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [data, searchTerm, roleFilter]);

  const renderList = () => (
    <div className="igms-table-container admin-fade-in">
      <table className="igms-table">
        <thead>
          <tr>
            <th className="w-[30%]">Miembro</th>
            <th className="w-[20%]">Contacto</th>
            <th className="w-[25%]">Acceso / Grupos</th>
            <th className="w-[15%]">Estado</th>
            <th className="w-[10%] text-right">Acción</th>
          </tr>
        </thead>
        <tbody>
          {filteredMembers.map((member) => (
            <tr 
              key={member.id} 
              className="igms-tr"
              onClick={() => onAction({ show: true, type: 'edit_staff', edit: member })}
            >
              <td>
                <div className="member-cell">
                  <div className="member-avatar-sm">
                    {member.nombre ? member.nombre[0].toUpperCase() : '?'}
                  </div>
                  <div className="member-meta">
                    <span className="member-name">{member.nombre}</span>
                    <span className="member-role">{roleLabels[member.rol] || member.rol}</span>
                  </div>
                </div>
              </td>
              <td>
                <div className="contact-cell">
                   <div className="contact-icon" title={member.email}><Mail size={14} /></div>
                   <div className="contact-icon" title={member.telefono}><Phone size={14} /></div>
                </div>
              </td>
              <td>
                <div className="access-cell">
                  <div className="access-summary">
                    <Globe size={14} className="text-slate-400" />
                    <span>{member.propiedades_acceso?.length || 0} Propiedades</span>
                  </div>
                  {member.etiquetas_acceso?.length > 0 && (
                    <div className="tag-summary">
                      <Tag size={12} className="text-teal-500" />
                      <span>{member.etiquetas_acceso.length} etiquetas</span>
                    </div>
                  )}
                </div>
              </td>
              <td>
                <div className={`status-badge ${member.status?.toLowerCase() || 'active'}`}>
                   <div className="status-dot"></div>
                   <span>{member.status === 'PENDING' ? 'Invitación' : 'Activo'}</span>
                </div>
              </td>
              <td className="text-right">
                <button className="row-action-btn">
                  <ChevronDown size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderGrid = () => (
    <div className="members-grid-v2">
      {filteredMembers.map((member) => (
        <div 
          key={member.id} 
          className="member-card-v2"
          onClick={() => onAction({ show: true, type: 'edit_staff', edit: member })}
        >
          <div className="card-top">
            <div className="member-avatar-lg">
              {member.nombre ? member.nombre[0].toUpperCase() : '?'}
            </div>
            <div className={`card-status ${member.status?.toLowerCase() || 'active'}`}></div>
          </div>
          <div className="card-info">
            <h4>{member.nombre}</h4>
            <p>{roleLabels[member.rol] || member.rol}</p>
          </div>
          <div className="card-stats">
            <div className="c-stat">
              <span>PROPIEDADES</span>
              <b>{member.propiedades_acceso?.length || 0}</b>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="equipo-view-modern">
      {/* Header Estilo iGMS */}
      <div className="view-header">
        <div className="view-title">
          <h1>Mi Equipo</h1>
          <p>Gestiona los miembros de tu equipo y sus permisos de acceso.</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn-igms-primary"
            onClick={() => onAction({ show: true, type: 'new_member' })}
          >
            <UserPlus size={18} /> Nuevo Miembro
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="view-toolbar">
        <div className="toolbar-left">
          <div className="igms-search">
            <Search size={18} className="text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="igms-filter">
            <Filter size={18} className="text-slate-400" />
            <select 
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">Todos los roles</option>
              <option value="SUPER_ADMIN">Administradores</option>
              <option value="MANAGER_LOCAL">Gerentes locales</option>
              <option value="STAFF">Staff</option>
            </select>
          </div>
        </div>
        
        <div className="toolbar-right">
          <div className="view-toggle-v2">
            <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')}><List size={18} /></button>
            <button className={viewMode === 'grid' ? 'active' : ''} onClick={() => setViewMode('grid')}><LayoutGrid size={18} /></button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="view-content">
        {filteredMembers.length > 0 ? (
          viewMode === 'list' ? renderList() : renderGrid()
        ) : (
          <div className="empty-state">
            <Users size={64} className="text-slate-200" />
            <h3>No se encontraron miembros</h3>
            <p>Ajusta los filtros o invita a alguien nuevo.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EquipoView;
