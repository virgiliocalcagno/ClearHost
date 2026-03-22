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
        propiedad: { activa: true, num_habitaciones: 2, zona_id: '', cobro_propietario: 0, pago_staff: 0, moneda_cobro: 'MXN', moneda_pago: 'MXN' },
        reserva: { fuente: 'MANUAL', num_huespedes: 2, estado: 'CONFIRMADA' },
        staff: { disponible: true, rol: 'STAFF', zona_id: '' },
        incidencia: { urgente: false, estado: 'PENDIENTE', tipo: 'DAÑO' },
        gasto: { fecha: new Date().toISOString().split('T')[0], categoria_cargo: 'MANTENIMIENTO' },
        adelanto: { staff_id: '', monto: 0, moneda: 'MXN', notas: '' }
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
                  <select name="moneda_cobro" value={formData.moneda_cobro || 'MXN'} onChange={handleChange} className="select-field" style={{flex: 1}}>
                    <option value="MXN">MXN</option>
                    <option value="USD">USD</option>
                    <option value="DOP">DOP</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Pago al Staff (Operativo)</label>
                <div style={{display: 'flex', gap: '5px'}}>
                  <input type="number" name="pago_staff" value={formData.pago_staff || 0} onChange={handleChange} className="input-field" style={{flex: 2}} />
                  <select name="moneda_pago" value={formData.moneda_pago || 'MXN'} onChange={handleChange} className="select-field" style={{flex: 1}}>
                    <option value="MXN">MXN</option>
                    <option value="USD">USD</option>
                    <option value="DOP">DOP</option>
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
                <label>Teléfono (WhatsApp)</label>
                <input name="telefono" value={formData.telefono || ''} onChange={handleChange} className="input-field" />
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
            {type === 'staff' && (
               <div className="form-group">
                <label>Contraseña (Temporal)</label>
                <input type="password" name="password" onChange={handleChange} required className="input-field" />
              </div>
            )}
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
                <select name="moneda" value={formData.moneda || 'MXN'} onChange={handleChange} className="select-field">
                  <option value="MXN">MXN</option>
                  <option value="USD">USD</option>
                  <option value="DOP">DOP</option>
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

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h3>{editData ? '✏️ Editar' : '＋ Nuevo'} {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {renderForm()}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-admin btn-admin-outline" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-admin btn-admin-primary">Guardar Cambios</button>
          </div>
        </form>
      </div>
    </div>
  );
}
