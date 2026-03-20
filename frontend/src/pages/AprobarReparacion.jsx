import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './AprobarReparacion.css';

export default function AprobarReparacion() {
  const { token } = useParams();
  const [incidencia, setIncidencia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resultado, setResultado] = useState(null);

  useEffect(() => {
    loadIncidencia();
  }, [token]);

  const loadIncidencia = async () => {
    setLoading(true);
    try {
      // Endpoint para obtener info pública via token
      // Reutilizamos el endpoint de incidencias con un filtro especial o creamos uno público
      const res = await api.get(`/incidencias/public/pago/${token}`);
      setIncidencia(res.data);
    } catch (err) {
      setError('El enlace es inválido o el presupuesto ya fue gestionado.');
    } finally {
      setLoading(false);
    }
  };

  const handleAprobar = async () => {
    try {
      await api.get(`/incidencias/public/aprobar/${token}`);
      setResultado({ success: true, msg: '¡Presupuesto Aprobado! Ya estamos trabajando en ello.' });
    } catch (err) {
      alert('Error al procesar la aprobación.');
    }
  };

  if (loading) return <div className="pago-center">Cargando reporte...</div>;
  if (error) return <div className="pago-center error-bg">{error}</div>;
  if (resultado) return (
    <div className="pago-center success-bg">
      <div className="pago-card">
        <div className="pago-icon">✅</div>
        <h2>{resultado.msg}</h2>
        <p>Gracias por su confianza. Le avisaremos cuando la reparación esté completa.</p>
      </div>
    </div>
  );

  return (
    <div className="pago-container">
      <div className="pago-card">
        <div className="pago-header">
            <span className="pago-badge">📋 Reporte de Propiedad</span>
            <h1>Aprobación de Reparación</h1>
            <p className="pago-prop">Propiedad: <strong>{incidencia.nombre_propiedad}</strong></p>
        </div>

        <div className="pago-body">
            <h3>{incidencia.titulo}</h3>
            <p className="pago-desc">{incidencia.descripcion}</p>

            {incidencia.fotos && incidencia.fotos.length > 0 && (
                <div className="pago-fotos">
                    <h4>Evidencia Fotográfica:</h4>
                    <div className="pago-grid">
                        {incidencia.fotos.map((f, i) => (
                            <img key={i} src={f.url} alt="daño" />
                        ))}
                    </div>
                </div>
            )}

            <div className="pago-costs">
                <div className="cost-row">
                    <span>Mano de obra y materiales:</span>
                    <span className="cost-val">${incidencia.costo_estimado}</span>
                </div>
                <div className="cost-total">
                    <span>Total a autorizar:</span>
                    <span className="total-val">${incidencia.costo_estimado}</span>
                </div>
            </div>
        </div>

        <div className="pago-footer">
            <button className="btn-aprobar" onClick={handleAprobar}>
                Aprobar Presupuesto
            </button>
            <p className="pago-note">Al hacer clic, autoriza el gasto descrito anteriormente.</p>
        </div>
      </div>
    </div>
  );
}
