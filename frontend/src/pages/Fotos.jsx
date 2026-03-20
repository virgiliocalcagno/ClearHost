import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTareaDetalle, subirFoto, STATIC_BASE } from '../services/api';
import './Fotos.css';

export default function Fotos() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tarea, setTarea] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);
  const [uploadTipo, setUploadTipo] = useState('antes');

  useEffect(() => { loadTarea(); }, [id]);

  const loadTarea = async () => {
    try {
      const data = await getTareaDetalle(id);
      setTarea(data);
    } catch { navigate(`/tarea/${id}`); }
    finally { setLoading(false); }
  };

  const handleAddPhoto = (tipo) => {
    setUploadTipo(tipo);
    inputRef.current?.click();
  };

  const handleFileSelected = async (e) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const data = await subirFoto(id, uploadTipo, file);
        setTarea(data);
      }
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al subir foto');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /><span>Cargando...</span></div>;

  const fotosAntes = tarea?.fotos_antes || [];
  const fotosDespues = tarea?.fotos_despues || [];

  const renderSection = (titulo, fotos, tipo, accent, accentBg, icon) => (
    <div className="card foto-section fade-in">
      <div className="foto-header">
        <div className="foto-icon" style={{background: accentBg, color: accent}}>{icon}</div>
        <div className="foto-title-area">
          <h4>{titulo}</h4>
          <span className="foto-count">{fotos.length} foto{fotos.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="foto-grid">
        {fotos.map((foto, i) => (
          <div key={i} className="foto-thumb">
            <img src={`${STATIC_BASE}${foto.url}`} alt={`${tipo} ${i+1}`} />
            <span className="foto-time">
              {new Date(foto.uploaded_at).toLocaleTimeString('es-MX', {hour:'2-digit',minute:'2-digit'})}
            </span>
          </div>
        ))}

        {/* Placeholder punteado */}
        <button
          className="foto-add"
          style={{borderColor: accent}}
          onClick={() => handleAddPhoto(tipo)}
          disabled={uploading}
        >
          <div className="foto-add-circle" style={{background: accentBg, color: accent}}>📷</div>
          <span style={{color: accent}}>Agregar</span>
        </button>
      </div>

      {fotos.length < 1 && (
        <div className="foto-requirement">
          ℹ️ Mínimo 1 foto requerida
        </div>
      )}
    </div>
  );

  return (
    <div className="app-container">
      <div className="screen-header">
        <button className="back-btn" onClick={() => navigate(`/tarea/${id}`)}>←</button>
        <span className="screen-title">Evidencia Fotográfica</span>
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        style={{display:'none'}}
        onChange={handleFileSelected}
      />

      <div className="foto-content">
        {uploading && (
          <div className="foto-upload-bar fade-in">
            <div className="spinner" style={{width:18,height:18,borderWidth:2}} />
            <span>Subiendo foto...</span>
          </div>
        )}

        {renderSection('Fotos ANTES de limpiar', fotosAntes, 'antes', 'var(--warning)', 'var(--warning-light)', '⏳')}
        {renderSection('Fotos DESPUÉS de limpiar', fotosDespues, 'despues', 'var(--success)', 'var(--success-light)', '✅')}

        <div className="foto-info-card">
          ℹ️ Las fotos antes y después son obligatorias para marcar la propiedad como "Clean & Ready".
        </div>
      </div>
    </div>
  );
}
