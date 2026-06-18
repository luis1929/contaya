import { useState } from 'react';
import { api } from '../services/api';

export default function Upload() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    try {
      const data = await api.upload(file);
      setResult(data);
    } catch (err) {
      alert('Error al subir: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h2>Subir Documento</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept=".pdf,.jpg,.png,.csv,.xlsx"
          onChange={e => setFile(e.target.files[0])}
        />
        <button type="submit" disabled={!file || uploading}>
          {uploading ? 'Subiendo...' : 'Subir'}
        </button>
      </form>
      {result && (
        <div>
          <h3>Documento procesado</h3>
          <p>Archivo: {result.original_name}</p>
          <p>Tipo: {result.type}</p>
        </div>
      )}
    </div>
  );
}
