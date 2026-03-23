import React, { useState, useEffect } from 'react';

export default function ModalForm({ 
  show, 
  type, 
  editData, 
  onClose, 
  onSave, 
  propiedades = [], 
  propietarios = [], 
  zonas = [], 
  staffList = [] 
}) {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (editData) {
      setFormData(editData);
    } else {
      // Valores por defecto según tipo
      const defaults = {
        propiedad: { activa: true, num_habitaciones: 2, zona_id: '', cobro_propietario: 0, pago_staff: 0, moneda_cobro: 'DOP', moneda_pago: 'DOP' },
        reserva: { fuente: 'MANUAL', num_huespedes: 2, estado: 'CONFIRMADA' },
        staff: { disponible: true, rol: 'STAFF', zona_id: '' },
        tarea: { fecha_programada: new Date().toISOString().split('T')[0], tipo_tarea: 'LIMPIEZA_ENTRADA', estado: 'PENDIENTE', pago_al_staff: 0, moneda_tarea: 'DOP' },
        incidencia: { urgente: false, estado: 'PENDIENTE', tipo: 'DAÑO' },
        gasto: { fecha: new Date().toISOString().split('T')[0], categoria_cargo: 'MANTENIMIENTO' },
        adelanto: { staff_id: '', monto: 0, moneda: 'DOP', notas: '' }
      };
      setFormData(defaults[type] || {});
    }
  }, [editData, type, show]);

  if (!show) return null;

  const handleChange = (e) => {
    const { name, value, type: inputType, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: inputType === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const renderForm = () => {
    switch (type) {
      case 'propiedad':
        return (
          <>
            <div className="form-grid">
              <div className="form-group">
                <label>Nombre de la Propiedad</label>
                <input name="nombre" value={formData.nombre || ''} onChange={handleChange} required className="input-field" placeholder="Ej: Villa Paraíso" />
              </div>
              <div className="form-group">
                <label>Ciudad</label>
                <input name="ciudad" value={formData.ciudad || ''} onChange={handleChange} required className="input-field" placeholder="Ej: Cancún" />
              </div>
              <div className="form-group">
                <label>Propietario</label>
                <select name="propietario_id" value={formData.propietario_id || ''} onChange={handleChange} required className="select-field">
                  <option value="">Seleccionar Propietario</option>
                  {propietarios.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Zona (Crítico para Managers)</label>
                <select name="zona_id" value={formData.zona_id || ''} onChange={handleChange} required className="select-field">
                  <option value="">Seleccionar Zona</option>
                  {zonas.map(z => <option key={z.id} value={z.id}>{z.nombre}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Dirección Completa</label>
              <input name="direccion" value={formData.direccion || ''} onChange={handleChange} className="input-field" />
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label>iCal URL (Sincronización)</label>
                <input name="ical_url" value={formData.ical_url || ''} onChange={handleChange} className="input-field" placeholder="https://..." />
              </div>
              <div className="form-group">
                <label>Habitaciones</label>
                <input type="number" name="num_habitaciones" value={formData.num_habitaciones || ''} onChange={handleChange} className="input-field" />
              </div>
            </div>
            
            <div className="form-grid" style={{marginTop: '15px', padding: '15px', backgroundColor: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb'}}>
              <h4 style={{gridColumn: '1 / -1', marginBottom: '10px', color: '#111827'}}>Tarifario de Limpieza (Doble Tarifario)</h4>
              <div className="form-group">
                <label>Cobro al Propietario</label>
                <div style={{display: 'flex', gap: '5px'}}>
                  <input type="number" name="cobro_propietario" value={formData.cobro_propietario || 0} onChange={handleChange} className="input-field" style={{flex: 2}} />
                  <select name="moneda_cobro" value={formData.moneda_cobro || 'DOP'} onChange={handleChange} className="select-field" style={{flex: 1}}>
                    <option value="DOP">DOP</option>
                    <option value="USD">USD</option>
                    <option value="MXN">MXN</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Pago al Staff (Operativo)</label>
                <div style={{display: 'flex', gap: '5px'}}>
                  <input type="number" name="pago_staff" value={formData.pago_staff || 0} onChange={handleChange} className="input-field" style={{flex: 2}} />
                  <select name="moneda_pago" value={formData.moneda_pago || 'DOP'} onChange={handleChange} className="select-field" style={{flex: 1}}>
                    <option value="DOP">DOP</option>
                    <option value="USD">USD</option>
                    <option value="MXN">MXN</option>
                  </select>
                </div>
              </div>
            </div>
          </>
        );

      case 'reserva':
        return (
          <>
            <div className="form-group">
              <label>Propiedad</label>
              <select name="propiedad_id" value={formData.propiedad_id || ''} onChange={handleChange} required className="select-field">
                <option value="">Seleccionar Propiedad</option>
                {propiedades.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
            <div className="form-group">
               <label>Nombre del Huésped</label>
               <input name="nombre_huesped" value={formData.nombre_huesped || ''} onChange={handleChange} required className="input-field" />
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label>Check-in</label>
                <input type="date" name="check_in" value={formData.check_in || ''} onChange={handleChange} required className="input-field" />
              </div>
              <div className="form-group">
                <label>Check-out</label>
                <input type="date" name="check_out" value={formData.check_out || ''} onChange={handleChange} required className="input-field" />
              </div>
            </div>
            <div className="form-grid">
               <div className="form-group">
                <label>Fuente</label>
                <select name="fuente" value={formData.fuente || 'MANUAL'} onChange={handleChange} className="select-field">
                  <option value="AIRBNB">Airbnb</option>
                  <option value="BOOKING">Booking</option>
                  <option value="VRBO">VRBO</option>
                  <option value="MANUAL">Manual</option>
                </select>
              </div>
              <div className="form-group">
                <label>Huéspedes</label>
                <input type="number" name="num_huespedes" value={formData.num_huespedes || 2} onChange={handleChange} className="input-field" />
              </div>
            </div>
          </>
        );

      case 'staff':
      case 'staff-edit':
        return (
          <>
            <div className="form-section-header">👤 Datos Básicos</div>
            <div className="form-group">
              <label>Nombre Completo</label>
              <input name="nombre" value={formData.nombre || ''} onChange={handleChange} required className="input-field" placeholder="Nombre completo del staff..." />
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label>Email (Opcional)</label>
                <input type="email" name="email" value={formData.email || ''} onChange={handleChange} className="input-field" placeholder="ejemplo@correo.com" />
              </div>
              <div className="form-group">
                <label>Teléfono Principal (WhatsApp)</label>
                <input name="telefono" value={formData.telefono || ''} onChange={handleChange} required className="input-field" placeholder="Ej: 8295551234" />
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label>Rol</label>
                <select name="rol" value={formData.rol || 'STAFF'} onChange={handleChange} required className="select-field">
                  <option value="STAFF">Limpieza / Mantenimiento</option>
                  <option value="MANAGER_LOCAL">Manager Local</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label>Zona Asignada</label>
                <select name="zona_id" value={formData.zona_id || ''} onChange={handleChange} className="select-field">
                  <option value="">Sin zona (Ver todo)</option>
                  {zonas.map(z => <option key={z.id} value={z.id}>{z.nombre}</option>)}
                </select>
              </div>
            </div>

            <div className="form-section-header" style={{marginTop:'20px'}}>🪪 Documentación y Ubicación</div>
            <div className="form-grid">
              <div className="form-group">
                <label>Documento Identidad (Cédula/Pasaporte)</label>
                <input name="documento" value={formData.documento || ''} onChange={handleChange} required className="input-field" placeholder="001-0000000-0" />
              </div>
              <div className="form-group">
                <label>Teléfono de Emergencia</label>
                <input name="telefono_emergencia" value={formData.telefono_emergencia || ''} onChange={handleChange} className="input-field" placeholder="Contacto directo..." />
              </div>
            </div>
            <div className="form-group">
              <label>Dirección de Residencia</label>
              <input name="direccion" value={formData.direccion || ''} onChange={handleChange} className="input-field" placeholder="Calle, número, sector, ciudad..." />
            </div>

            <div className="form-section-header" style={{marginTop:'20px'}}>📞 Referencias Personales</div>
            <div className="references-list" style={{display:'flex', flexDirection:'column', gap:10}}>
              {(() => {
                const refs = Array.isArray(formData.referencias) ? formData.referencias : [];
                return (
                  <>
                    {refs.map((ref, i) => (
                      <div key={i} className="ref-item" style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 40px', gap:6, alignItems:'end', background:'#f3f4f6', padding:8, borderRadius:8}}>
                        <div>
                          <label style={{fontSize:10, color:'#666'}}>Nombre</label>
                          <input 
                            value={ref.nombre || ''} 
                            onChange={(e) => {
                              const newRefs = [...refs];
                              newRefs[i].nombre = e.target.value;
                              setFormData({...formData, referencias: newRefs});
                            }} 
                            className="input-field" 
                            style={{padding:'4px 8px'}}
                          />
                        </div>
                        <div>
                          <label style={{fontSize:10, color:'#666'}}>Teléfono</label>
                          <input 
                            value={ref.tel || ''} 
                            onChange={(e) => {
                              const newRefs = [...refs];
                              newRefs[i].tel = e.target.value;
                              setFormData({...formData, referencias: newRefs});
                            }} 
                            className="input-field" 
                            style={{padding:'4px 8px'}}
                          />
                        </div>
                        <div>
                          <label style={{fontSize:10, color:'#666'}}>Relación</label>
                          <input 
                            value={ref.rel || ''} 
                            onChange={(e) => {
                              const newRefs = [...refs];
                              newRefs[i].rel = e.target.value;
                              setFormData({...formData, referencias: newRefs});
                            }} 
                            className="input-field" 
                            style={{padding:'4px 8px'}}
                          />
                        </div>
                        <button 
                          type="button" 
                          onClick={() => {
                            const newRefs = refs.filter((_, idx) => idx !== i);
                            setFormData({...formData, referencias: newRefs});
                          }}
                          style={{height:32, width:32, borderRadius:6, border:'none', background:'#fee2e2', color:'#dc2626', cursor:'pointer'}}
                        >✕</button>
                      </div>
                    ))}
                    <button 
                      type="button" 
                      onClick={() => {
                        const newRefs = [...refs, {nombre:'', tel:'', rel:''}];
                        setFormData({...formData, referencias: newRefs});
                      }}
                      className="btn-admin btn-admin-outline"
                      style={{fontSize:12, padding:'6px 12px'}}
                    >＋ Añadir Referencia</button>
                  </>
                );
              })()}
            </div>

            <div className="form-section-header" style={{marginTop:'20px'}}>🔐 Seguridad (PIN / Password)</div>
            <div className="form-group">
              <label>{type === 'staff-edit' ? 'Cambiar PIN / Contraseña (Opcional)' : 'Asignar PIN / Contraseña'}</label>
              <input 
                type="text" 
                name="password" 
                onChange={handleChange} 
                className="input-field" 
                placeholder={type === 'staff-edit' ? 'Dejar en blanco para no cambiar' : 'Mínimo 4 caracteres'}
                required={type === 'staff'} 
              />
              <small style={{color:'var(--text-tertiary)'}}>
                {type === 'staff-edit' 
                  ? "Si ingresas un valor aquí, se sobreescribirá la clave anterior del usuario." 
                  : "Este será el acceso inicial del usuario."}
              </small>
            </div>
          </>
        );

      case 'tarea':
        return (
          <>
            <div className="form-group">
              <label>Propiedad</label>
              <select name="propiedad_id" value={formData.propiedad_id || ''} onChange={handleChange} required className="select-field">
                <option value="">Seleccionar Propiedad</option>
                {propiedades.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label>Fecha Programada</label>
                <input type="date" name="fecha_programada" value={formData.fecha_programada || ''} onChange={handleChange} required className="input-field" />
              </div>
              <div className="form-group">
                <label>Tipo de Tarea</label>
                <select name="tipo_tarea" value={formData.tipo_tarea || 'LIMPIEZA_ENTRADA'} onChange={handleChange} required className="select-field">
                  <option value="LIMPIEZA_ENTRADA">Limpieza Entrada (Check-in)</option>
                  <option value="LIMPIEZA_SALIDA">Limpieza Salida (Check-out)</option>
                  <option value="MANTENIMIENTO">Mantenimiento</option>
                  <option value="REPASO">Repaso / Retoque</option>
                  <option value="DILIGENCIA">Diligencia / Recado</option>
                  <option value="OTRO">Otro (Especificar...)</option>
                </select>
              </div>
            </div>
            {formData.tipo_tarea === 'OTRO' && (
              <div className="form-group">
                <label>Descripción de Tarea Personalizada</label>
                <input 
                  type="text" 
                  name="notas_staff" 
                  value={formData.notas_staff || ''} 
                  onChange={handleChange} 
                  placeholder="Ej: Instalar lámpara en balcón" 
                  className="input-field"
                  required
                />
              </div>
            )}
            <div className="form-grid">
              <div className="form-group">
                <label>Asignar a (Opcional)</label>
                <select name="asignado_a" value={formData.asignado_a || ''} onChange={handleChange} className="select-field">
                  <option value="">Sin asignar</option>
                  {staffList.filter(s => s.rol === 'STAFF').map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Estado</label>
                <select name="estado" value={formData.estado || 'PENDIENTE'} onChange={handleChange} className="select-field">
                  <option value="PENDIENTE">Pendiente</option>
                  <option value="ASIGNADA_NO_CONFIRMADA">Asignada (Sin confirmar)</option>
                  <option value="ACEPTADA">Aceptada</option>
                  <option value="COMPLETADA">Completada por Staff</option>
                </select>
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label>Pago al Staff</label>
                <input type="number" name="pago_al_staff" value={formData.pago_al_staff || 0} onChange={handleChange} className="input-field" />
              </div>
              <div className="form-group">
                <label>Moneda</label>
                <select name="moneda_tarea" value={formData.moneda_tarea || 'DOP'} onChange={handleChange} className="select-field">
                  <option value="DOP">DOP</option>
                  <option value="USD">USD</option>
                  <option value="MXN">MXN</option>
                </select>
              </div>
            </div>
          </>
        );

      case 'propietario':
        return (
          <>
            <div className="form-group">
              <label>Nombre Completo</label>
              <input name="nombre" value={formData.nombre || ''} onChange={handleChange} required className="input-field" />
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label>Email</label>
                <input type="email" name="email" value={formData.email || ''} onChange={handleChange} className="input-field" />
              </div>
              <div className="form-group">
                <label>Teléfono</label>
                <input name="telefono" value={formData.telefono || ''} onChange={handleChange} className="input-field" />
              </div>
            </div>
          </>
        );

      case 'incidencia':
        return (
          <>
            <div className="form-group">
              <label>Propiedad</label>
              <select name="propiedad_id" value={formData.propiedad_id || ''} onChange={handleChange} required className="select-field">
                <option value="">Seleccionar Propiedad</option>
                {propiedades.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Título de la Incidencia / Compra</label>
              <input name="titulo" value={formData.titulo || ''} onChange={handleChange} required className="input-field" placeholder="Ej: Fuga en baño, Compra de sábanas..." />
            </div>
            <div className="form-group">
              <label>Descripción detallada</label>
              <textarea name="descripcion" value={formData.descripcion || ''} onChange={handleChange} style={{width:'100%', height:'80px', padding:'10px', borderRadius:'8px', border:'1px solid var(--border)'}} />
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label>Tipo</label>
                <select name="tipo" value={formData.tipo || 'DAÑO'} onChange={handleChange} className="select-field">
                  <option value="DAÑO">Daño / Reparación</option>
                  <option value="COMPRA">Compra / Insumos</option>
                  <option value="MANTENIMIENTO">Mantenimiento Preventivo</option>
                </select>
              </div>
              <div className="form-group">
                <label>Costo Estimado ($)</label>
                <input type="number" name="costo_estimado" value={formData.costo_estimado || ''} onChange={handleChange} className="input-field" />
              </div>
            </div>
          </>
        );

      case 'gasto':
        return (
          <>
            <div className="form-group">
              <label>Propiedad</label>
              <select name="propiedad_id" value={formData.propiedad_id || ''} onChange={handleChange} required className="select-field">
                <option value="">Seleccionar Propiedad</option>
                {propiedades.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label>Monto ($)</label>
                <input type="number" name="monto" value={formData.monto || ''} onChange={handleChange} required className="input-field" />
              </div>
              <div className="form-group">
                <label>Fecha</label>
                <input type="date" name="fecha" value={formData.fecha || ''} onChange={handleChange} required className="input-field" />
              </div>
            </div>
            <div className="form-group">
                <label>Categoría</label>
                <select name="categoria_cargo" value={formData.categoria_cargo || 'MANTENIMIENTO'} onChange={handleChange} className="select-field">
                  <option value="LIMPIEZA">Limpieza</option>
                  <option value="MANTENIMIENTO">Mantenimiento</option>
                  <option value="REPARACION">Reparación (Deducción Dueño)</option>
                  <option value="SUMINISTROS">Suministros / Amenidades</option>
                  <option value="OTRO">Otro</option>
                </select>
            </div>
          </>
        );

      case 'adelanto':
        return (
          <>
            <div className="form-group">
              <label>Miembro del Staff</label>
              <select name="staff_id" value={formData.staff_id || ''} onChange={handleChange} required className="select-field">
                <option value="">Seleccionar Persona</option>
                {staffList.filter(s => s.rol === 'STAFF').map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label>Monto del Adelanto</label>
                <input type="number" name="monto" value={formData.monto || ''} onChange={handleChange} required className="input-field" />
              </div>
              <div className="form-group">
                <label>Moneda</label>
                <select name="moneda" value={formData.moneda || 'DOP'} onChange={handleChange} className="select-field">
                  <option value="DOP">DOP</option>
                  <option value="USD">USD</option>
                  <option value="MXN">MXN</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Notas / Concepto</label>
              <input name="notas" value={formData.notas || ''} onChange={handleChange} className="input-field" placeholder="Ej: Emergencia médica, préstamo mensual..." />
            </div>
          </>
        );

      default:
        return <p>Formulario no definido para {type}</p>;
    }
  };
  const modalTitle = `${editData ? '✏️ Editar' : '＋ Nuevo'} ${type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}`;

  return (
    <div className="modal-overlay">
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <h3>{modalTitle}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {renderForm()}
          </div>
          
          <div className="modal-footer">
            <button type="button" className="btn-admin btn-admin-outline" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-admin btn-admin-primary">
              {editData ? 'Guardar Cambios' : 'Crear Registro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
