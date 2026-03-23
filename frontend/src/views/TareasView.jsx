import React, { useState } from 'react';
import api, { 
  verificarTarea, 
  asignarTarea, 
  generarLinkWhatsApp 
} from '../services/api';
import { EstadoBadge } from '../components/AdminCommon';
import AdminWeeklyCalendar from '../components/AdminWeeklyCalendar';

export default function TareasView({ data, propiedades, staffList, onAction, onRefresh, showToast }) {
  const [assigning, setAssigning] = useState(null);
  const [evidencia, setEvidencia] = useState(null); // tarea seleccionada para ver evidencia
  const [vista, setVista] = useState('calendario4d'); // 'calendario4d', 'calendario7d' o 'tabla'

  const handleWhatsApp = async (id) => {
    try {
      const res = await generarLinkWhatsApp(id);
      window.open(res.link, '_blank');
    } catch(err) {
      alert("No se pudo generar link de WhatsApp");
    }
  };

  const getPropName = (t) => {
    const p = propiedades?.find(pr => pr.id === t.propiedad_id);
    return p?.nombre || '—';
  };

  const getStaffName = (t) => {
    if (t.nombre_asignado) return t.nombre_asignado;
    if (!t.asignado_a) return null;
    const s = staffList?.find(st => st.id === t.asignado_a);
    return s?.nombre || null;
  };

  const staffLimpieza = (staffList || []).filter(s => s.rol === 'STAFF');

  const handleVerificar = async (id) => {
    try {
      await verificarTarea(id);
      showToast('Tarea verificada ✓');
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al verificar');
    }
  };

  const handleAsignar = async (tareaId, staffId, horaInicio) => {
    setAssigning(tareaId);
    try {
      await asignarTarea(tareaId, staffId || null, horaInicio);
      showToast('Tarea asignada');
      onRefresh();
    } catch (err) {
      alert('Error al asignar tarea');
    } finally {
      setAssigning(null);
    }
  };

  const handleTimeChange = (tareaId, hora, currentStaffId) => {
    handleAsignar(tareaId, currentStaffId, hora);
  };

  const handleEdit = (tarea) => {
    onAction({ type: 'tarea', edit: tarea });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta tarea?")) return;
    try {
      await api.delete(`/tareas/${id}`);
      showToast('Tarea eliminada');
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al eliminar tarea');
    }
  };

  return (
    <div className="admin-fade-in">
      <div className="admin-topbar">
        <div>
          <h2>Tareas de Limpieza</h2>
          <div className="topbar-subtitle">Gestión, asignación y verificación de tareas</div>
        </div>
        <div className="topbar-actions">
          <div className="view-toggle" style={{display: 'inline-flex', gap: 5, marginRight: 15, background: 'var(--surface)', padding: 4, borderRadius: 8}}>
            <button className={`btn-admin btn-admin-sm ${vista === 'tabla' ? 'btn-admin-primary' : 'btn-admin-outline'}`} onClick={() => setVista('tabla')} style={{border: 'none'}}>📋 Tabla</button>
            <button className={`btn-admin btn-admin-sm ${vista === 'calendario' || vista === 'calendario4d' ? 'btn-admin-primary' : 'btn-admin-outline'}`} onClick={() => setVista('calendario4d')} style={{border: 'none'}}>⚡ Operativa (4D)</button>
            <button className={`btn-admin btn-admin-sm ${vista === 'calendario7d' ? 'btn-admin-primary' : 'btn-admin-outline'}`} onClick={() => setVista('calendario7d')} style={{border: 'none'}}>📅 Semanal (7D)</button>
          </div>
          <button className="btn-admin btn-admin-primary" style={{marginRight: 10}} onClick={() => onAction({ type: 'tarea' })}>
            ＋ Nueva Tarea
          </button>
          <button className="btn-admin btn-admin-outline" onClick={onRefresh}>🔄 Actualizar</button>
        </div>
      </div>

      <div className="admin-table-wrapper">
        <div className="admin-table-header">
          <h3>{vista === 'tabla' ? 'Todas las Tareas' : 'Calendario de Urgencias'}</h3>
          <span className="table-count">{data.length} tareas</span>
        </div>
        {data.length === 0 ? (
          <div className="admin-empty">
            <div className="empty-icon">🧹</div>
            <h4>Sin tareas</h4>
            <p>Las tareas se crean automáticamente al crear reservas.</p>
          </div>
        ) : vista === 'tabla' ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th># ID</th>
                <th>Propiedad</th>
                <th>Huésped</th>
                <th>Fecha</th>
                <th>Asignado a</th>
                <th>Estado</th>
                <th>Checklist</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.map(t => {
                const checkItems = t.checklist || [];
                const checkDone = checkItems.filter(i => i.completado).length;
                return (
                  <tr key={t.id}>
                    <td>
                      <div className="admin-badge admin-badge-neutral" style={{fontWeight: 800}}>
                        T-{t.id_secuencial || '—'}
                      </div>
                    </td>
                    <td>
                      <div className="table-name">{getPropName(t)}</div>
                    </td>
                    <td>
                      <div className="table-name">{t.nombre_huesped || '—'}</div>
                    </td>
                    <td>
                      <div className="table-name">{t.fecha_programada}</div>
                      <div className="table-sub">
                        <input 
                          type="time" 
                          value={(t.hora_inicio || '11:00').substring(0, 5)} 
                          onChange={(e) => handleTimeChange(t.id, e.target.value, t.asignado_a)}
                          style={{
                            border: '1px solid var(--border)',
                            borderRadius: '4px',
                            padding: '2px 4px',
                            fontSize: '11px',
                            marginTop: '4px',
                            cursor: 'pointer'
                          }}
                        />
                      </div>
                    </td>
                    <td>
                      <div className="assign-cell">
                        <select
                          className="select-assign"
                          value={t.asignado_a || ''}
                          onChange={(e) => handleAsignar(t.id, e.target.value)}
                          disabled={assigning === t.id || t.estado === 'VERIFICADA'}
                          style={{
                            color: t.asignado_a ? 'var(--text)' : 'var(--text-tertiary)',
                            borderColor: !t.asignado_a && t.estado === 'PENDIENTE'
                              ? 'var(--color-warning)' : undefined,
                          }}
                        >
                          <option value="">⚠ Sin asignar</option>
                          {staffLimpieza.map(s => (
                            <option key={s.id} value={s.id}>
                              {s.nombre} ({s.rol === 'LIMPIEZA' ? '🧹' : '🔧'})
                            </option>
                          ))}
                        </select>
                        {assigning === t.id && <span className="assign-spinner">⏳</span>}
                      </div>
                    </td>
                    <td><EstadoBadge estado={t.estado} /></td>
                    <td>
                      <span className="admin-badge admin-badge-neutral">
                        {checkDone}/{checkItems.length}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="btn-admin btn-admin-outline btn-admin-sm"
                          onClick={() => setEvidencia(t)}
                          title="Ver evidencia"
                        >
                          👁 Ver
                        </button>
                        {['COMPLETADA', 'CLEAN_AND_READY'].includes(t.estado) && (
                          <button
                            className="btn-admin btn-admin-primary btn-admin-sm"
                            onClick={() => handleVerificar(t.id)}
                          >
                            ✓ Verificar
                          </button>
                        )}
                        {['PENDIENTE', 'ASIGNADA_NO_CONFIRMADA'].includes(t.estado) && (
                          <button
                            className="btn-admin btn-admin-outline btn-admin-sm"
                            style={{color: '#EF4444', borderColor: '#EF4444'}}
                            onClick={() => handleDelete(t.id)}
                            title="Eliminar tarea"
                          >
                            🗑
                          </button>
                        )}
                        <button
                          className="btn-admin btn-admin-sm"
                          style={{background:'var(--primary)', color:'white', border:'none', marginLeft:5}}
                          onClick={() => handleWhatsApp(t.id)}
                          title="Enviar a WhatsApp"
                        >
                          <i className="fab fa-whatsapp"></i> WhatsApp
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <AdminWeeklyCalendar 
            tareas={data} 
            propiedades={propiedades} 
            getStaffName={getStaffName} 
            handleAsignar={handleAsignar}
            handleTimeChange={handleTimeChange}
            staffLimpieza={staffLimpieza}
            handleWhatsApp={handleWhatsApp}
            handleDelete={handleDelete}
            handleEdit={handleEdit}
            numDays={vista === 'calendario7d' ? 7 : 4}
          />
        )}
      </div>

      {/* Modal de evidencia */}
      {evidencia && (
        <div className="modal-overlay" onClick={() => setEvidencia(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{maxWidth:700, maxHeight:'90vh', overflow:'auto'}}>
            <div className="modal-header">
              <h3>📋 Evidencia T-{evidencia.id_secuencial}: {getPropName(evidencia)}</h3>
              <button className="modal-close" onClick={() => setEvidencia(null)}>✕</button>
            </div>
            <div className="modal-body" style={{padding: 20}}>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20}}>
                <div><strong>Fecha:</strong> {evidencia.fecha_programada}</div>
                <div><strong>Estado:</strong> <EstadoBadge estado={evidencia.estado} /></div>
                <div><strong>Asignado:</strong> {getStaffName(evidencia) || 'Sin asignar'}</div>
                <div><strong>Huésped:</strong> {evidencia.nombre_huesped || 'N/A'}</div>
              </div>

              <h4 style={{marginBottom:8}}>✅ Checklist ({(evidencia.checklist || []).filter(i=>i.completado).length}/{(evidencia.checklist || []).length})</h4>
              {(evidencia.checklist && evidencia.checklist.length > 0) ? (
                <div style={{display:'flex', flexDirection:'column', gap:6, marginBottom:20}}>
                  {evidencia.checklist.map((item, i) => (
                    <div key={i} style={{display:'flex', alignItems:'center', gap:8, padding:'6px 10px', borderRadius:8, background: item.completado ? '#e8f5e9' : '#fff3e0'}}>
                      <span>{item.completado ? '✅' : '⬜'}</span>
                      <span style={{flex:1}}>{item.item}</span>
                      {item.requerido && <span style={{fontSize:11, color:'#e65100', fontWeight:600}}>Obligatorio</span>}
                    </div>
                  ))}
                </div>
              ) : <p style={{color:'var(--text-tertiary)', marginBottom:20}}>Sin checklist registrado.</p>}

              <h4 style={{marginBottom:8}}>📸 Fotos ANTES</h4>
              {(evidencia.fotos_antes && evidencia.fotos_antes.length > 0) ? (
                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px,1fr))', gap:10, marginBottom:20}}>
                  {evidencia.fotos_antes.map((f, i) => (
                    <a key={i} href={f.url} target="_blank" rel="noreferrer">
                      <img src={f.url} alt={`antes-${i}`} style={{width:'100%', borderRadius:10, border:'2px solid #e0e0e0', cursor:'pointer'}} />
                    </a>
                  ))}
                </div>
              ) : <p style={{color:'var(--text-tertiary)', marginBottom:20}}>Sin fotos de antes.</p>}

              <h4 style={{marginBottom:8}}>📸 Fotos DESPUÉS</h4>
              {(evidencia.fotos_despues && evidencia.fotos_despues.length > 0) ? (
                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px,1fr))', gap:10, marginBottom:20}}>
                  {evidencia.fotos_despues.map((f, i) => (
                    <a key={i} href={f.url} target="_blank" rel="noreferrer">
                      <img src={f.url} alt={`despues-${i}`} style={{width:'100%', borderRadius:10, border:'2px solid #a5d6a7', cursor:'pointer'}} />
                    </a>
                  ))}
                </div>
              ) : <p style={{color:'var(--text-tertiary)', marginBottom:20}}>Sin fotos de después.</p>}

              {evidencia.notas_staff && (
                <div style={{marginTop:10}}>
                  <h4>📝 Notas del Staff</h4>
                  <p style={{background:'#f5f5f5', padding:12, borderRadius:8}}>{evidencia.notas_staff}</p>
                </div>
              )}

              {['COMPLETADA', 'CLEAN_AND_READY'].includes(evidencia.estado) && (
                <button
                  className="btn-admin btn-admin-primary"
                  style={{width:'100%', marginTop:16}}
                  onClick={async () => {
                    await handleVerificar(evidencia.id);
                    setEvidencia(null);
                  }}
                >
                  ✓ Verificar y Aprobar Tarea
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
