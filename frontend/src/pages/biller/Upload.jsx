import { useState } from 'react';
import { api } from '../../services/api';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

export default function BillerUpload() {
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    try {
      const data = await api.upload(file, { description });
      setResult(data);
      setFile(null);
      setDescription('');
    } catch (err) {
      alert('Error al subir: ' + (err.response?.data?.error || err.message));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Subir Documentos</h2>
        <p className="text-gray-500 mt-1">Sube documentos PDF, imágenes, CSV o Excel</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div
          className={`
            border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
            ${dragOver ? 'border-primary bg-blue-50' : 'border-gray-300 hover:border-primary hover:bg-gray-50'}
          `}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); setFile(e.dataTransfer.files[0]); }}
          onClick={() => document.getElementById('file-input').click()}
        >
          <input id="file-input" type="file" className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.csv,.xlsx,.xls,.xml"
            onChange={e => setFile(e.target.files[0])} />
          <div className="text-4xl text-gray-300 mb-3">📁</div>
          <p className="text-gray-600 font-medium">
            {file ? file.name : 'Arrastra o haz clic para seleccionar'}
          </p>
          {file && (
            <p className="text-sm text-gray-400 mt-1">{(file.size / 1024).toFixed(0)} KB</p>
          )}
        </div>

        <input
          type="text"
          placeholder="Descripción (opcional)"
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />

        <Button type="submit" loading={uploading} disabled={!file} className="w-full">
          {uploading ? 'Subiendo...' : '📤 Subir Documento'}
        </Button>
      </form>

      {result && (
        <Card>
          <div className="flex items-center gap-2 text-success mb-3">
            <span className="text-lg">✅</span>
            <h3 className="font-semibold">Documento subido exitosamente</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Archivo:</span><span className="font-medium">{result.original_name}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Tipo:</span><span>{result.type}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Tamaño:</span><span>{(result.size / 1024).toFixed(0)} KB</span></div>
          </div>
        </Card>
      )}
    </div>
  );
}
