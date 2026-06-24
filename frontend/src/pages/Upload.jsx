import { useState } from 'react';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import ImpersonateBanner from '../components/ImpersonateBanner';
import '../App.css';

const s = {
  page: {
    minHeight: '100vh',
    background: 'var(--gray-50)',
    color: 'var(--gray-800)',
    fontFamily: 'system-ui, sans-serif',
  },
  top: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem',
    borderBottom: '1px solid var(--gray-200)',
    background: 'var(--white)',
    boxShadow: 'var(--shadow-sm)',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  logo: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: 'var(--primary-dark)',
    textDecoration: 'none',
    transition: 'var(--transition)',
  },
  logoHover: {
    color: 'var(--primary)',
  },
  back: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: 'var(--gray-600)',
    textDecoration: 'none',
    fontSize: '0.9rem',
    fontWeight: '500',
    padding: '0.5rem 1rem',
    borderRadius: 'var(--radius)',
    transition: 'var(--transition)',
    marginRight: '1rem',
  },
  backHover: {
    background: 'var(--gray-100)',
    color: 'var(--gray-800)',
  },
  logout: {
    background: 'none',
    border: '1px solid var(--gray-300)',
    color: 'var(--gray-600)',
    padding: '0.5rem 1rem',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: '500',
    transition: 'var(--transition)',
  },
  logoutHover: {
    background: 'var(--gray-100)',
    color: 'var(--gray-800)',
  },
  main: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '2rem',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: '700',
    marginBottom: '1rem',
    color: 'var(--gray-900)',
  },
  subtitle: {
    color: 'var(--gray-600)',
    fontSize: '0.95rem',
    marginBottom: '2rem',
    lineHeight: '1.5',
  },
  uploadCard: {
    background: 'var(--white)',
    border: '2px dashed var(--gray-300)',
    borderRadius: 'var(--radius-md)',
    padding: '3rem',
    textAlign: 'center',
    transition: 'var(--transition)',
    cursor: 'pointer',
    marginBottom: '2rem',
  },
  uploadCardHover: {
    borderColor: 'var(--primary)',
    background: 'var(--gray-50)',
  },
  uploadCardActive: {
    borderColor: 'var(--primary)',
    background: 'var(--gray-100)',
  },
  fileInput: {
    display: 'none',
  },
  uploadIcon: {
    fontSize: '3rem',
    color: 'var(--gray-400)',
    marginBottom: '1rem',
  },
  uploadText: {
    color: 'var(--gray-600)',
    fontSize: '1rem',
    marginBottom: '0.5rem',
  },
  uploadHint: {
    color: 'var(--gray-500)',
    fontSize: '0.85rem',
  },
  fileName: {
    color: 'var(--primary)',
    fontWeight: '600',
    marginTop: '1rem',
    fontSize: '0.9rem',
  },
  btn: {
    padding: '0.75rem 2rem',
    background: 'var(--primary)',
    color: 'var(--white)',
    border: 'none',
    borderRadius: 'var(--radius)',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'var(--transition)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  btnHover: {
    background: 'var(--primary-dark)',
    transform: 'translateY(-1px)',
    boxShadow: 'var(--shadow-md)',
  },
  btnDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  resultCard: {
    background: 'var(--white)',
    border: '1px solid var(--gray-200)',
    borderRadius: 'var(--radius-md)',
    padding: '2rem',
    marginTop: '2rem',
    boxShadow: 'var(--shadow-sm)',
    animation: 'fadeIn 0.5s ease-out',
  },
  resultTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    marginBottom: '1rem',
    color: 'var(--gray-900)',
  },
  resultItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.75rem 0',
    borderBottom: '1px solid var(--gray-100)',
  },
  resultLabel: {
    color: 'var(--gray-600)',
    fontWeight: '500',
  },
  resultValue: {
    color: 'var(--gray-900)',
    fontWeight: '600',
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4rem',
    color: 'var(--gray-600)',
    fontSize: '1rem',
    gap: '1rem',
  },
};

export default function Upload() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const navigate = useNavigate();

  const handleFileSelect = (selectedFile) => {
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null); // Clear previous result
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFileSelect(droppedFile);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    
    setUploading(true);
    try {
      const data = await api.upload(file);
      setResult(data);
      setFile(null); // Clear file after successful upload
    } catch (err) {
      alert('Error al subir el archivo: ' + (err.message || 'Intenta nuevamente'));
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div style={s.page}>
      <ImpersonateBanner />
      <div style={s.top}>
        <a
          href="/"
          style={s.logo}
          onMouseEnter={e => e.currentTarget.style.color = s.logoHover.color}
          onMouseLeave={e => e.currentTarget.style.color = s.logo.color}
        >
          Contaya
        </a>
        <div>
          <a
            href="/dashboard"
            style={s.back}
            onMouseEnter={e => e.currentTarget.style.background = s.backHover.background}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            ← Volver al Dashboard
          </a>
          <button
            style={s.logout}
            onClick={handleLogout}
            onMouseEnter={e => e.currentTarget.style.background = s.logoutHover.background}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            Cerrar sesión
          </button>
        </div>
      </div>
      
      <div style={s.main}>
        <h1 style={s.title}>Subir Documentos</h1>
        <p style={s.subtitle}>
          Sube documentos PDF, imágenes, CSV o Excel para procesarlos en tu cuenta.
          Los documentos se almacenan de forma segura y están disponibles para su consulta.
        </p>

        <div
          style={{
            ...s.uploadCard,
            ...(isDragging ? s.uploadCardActive : {}),
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input').click()}
          onMouseEnter={e => !isDragging && (e.currentTarget.style.borderColor = s.uploadCardHover.borderColor)}
          onMouseLeave={e => !isDragging && (e.currentTarget.style.borderColor = s.uploadCard.borderColor)}
        >
          <div style={s.uploadIcon}>📁</div>
          <div style={s.uploadText}>
            {file ? 'Archivo seleccionado:' : 'Arrastra y suelta tu archivo aquí'}
          </div>
          <div style={s.uploadHint}>
            {file ? file.name : 'o haz clic para seleccionar'}
          </div>
          {file && (
            <div style={s.fileName}>
              📄 {file.name} ({Math.round(file.size / 1024)} KB)
            </div>
          )}
          <input
            id="file-input"
            type="file"
            style={s.fileInput}
            accept=".pdf,.jpg,.jpeg,.png,.csv,.xlsx,.xls"
            onChange={e => handleFileSelect(e.target.files[0])}
          />
        </div>

        <button
          style={{
            ...s.btn,
            ...(uploading || !file ? s.btnDisabled : {}),
          }}
          onClick={handleSubmit}
          disabled={uploading || !file}
          onMouseEnter={e => !uploading && file && (e.currentTarget.style.background = s.btnHover.background)}
          onMouseLeave={e => !uploading && file && (e.currentTarget.style.background = s.btn.background)}
        >
          {uploading ? (
            <>
              <div className="loading-spinner" style={{ width: '1rem', height: '1rem' }} />
              Subiendo...
            </>
          ) : (
            '📤 Subir Documento'
          )}
        </button>

        {result && (
          <div style={s.resultCard} className="fade-in">
            <h3 style={s.resultTitle}>✅ Documento subido exitosamente</h3>
            <div style={s.resultItem}>
              <span style={s.resultLabel}>Archivo:</span>
              <span style={s.resultValue}>{result.original_name}</span>
            </div>
            <div style={s.resultItem}>
              <span style={s.resultLabel}>Tipo:</span>
              <span style={s.resultValue}>{result.type}</span>
            </div>
            <div style={s.resultItem}>
              <span style={s.resultLabel}>Tamaño:</span>
              <span style={s.resultValue}>{Math.round(result.size / 1024)} KB</span>
            </div>
            <div style={{ ...s.resultItem, borderBottom: 'none' }}>
              <span style={s.resultLabel}>Fecha de subida:</span>
              <span style={s.resultValue}>
                {new Date(result.created_at).toLocaleDateString('es-CO')}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
