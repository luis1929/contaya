import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';

const RUT_FIELDS = [
  { key: 'document_number', label: 'NIT', type: 'text' },
  { key: 'verification_digit', label: 'DV', type: 'text' },
  { key: 'commercial_name', label: 'Razón Social', type: 'text' },
  { key: 'address', label: 'Dirección', type: 'text' },
  { key: 'ciudad', label: 'Ciudad', type: 'text' },
  { key: 'regimen', label: 'Régimen', type: 'text' },
  { key: 'email', label: 'Correo Electrónico', type: 'email' },
  { key: 'document_type', label: 'Tipo Documento', type: 'text' },
];

export default function RutUpload() {
  const [file, setFile] = useState(null);
  const [extracted, setExtracted] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [alert, setAlert] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const handleFile = (f) => {
    if (!f || f.type !== 'application/pdf') {
      setAlert({ type: 'error', message: 'Solo se aceptan archivos PDF' });
      return;
    }
    setFile(f);
    setAlert(null);
    processFile(f);
  };

  const processFile = async (f) => {
    setLoading(true);
    setAlert(null);
    try {
      const data = await api.uploadRut(f);
      setExtracted(data);
      const prefill = {};
      RUT_FIELDS.forEach(({ key }) => {
        if (data[key]) prefill[key] = data[key];
      });
      setForm(prefill);
    } catch (err) {
      setAlert({ type: 'error', message: 'Error al procesar el PDF: ' + (err.response?.data?.error || err.message) });
    } finally {
      setLoading(false);
    }
  };

  const setFormField = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    if (!form.commercial_name?.trim()) {
      setAlert({ type: 'error', message: 'La Razón Social es requerida' });
      return;
    }
    setSaving(true);
    setAlert(null);
    try {
      const body = {
        name: form.commercial_name,
        document_number: form.document_number,
        document_type: form.document_type || 'NIT',
        verification_digit: form.verification_digit,
        email: form.email,
        address: form.address,
        ciudad: form.ciudad,
        regimen: form.regimen,
        rut_metadata: extracted || {},
      };
      await api.createClient(body);
      setAlert({ type: 'success', message: 'Cliente creado correctamente' });
      setTimeout(() => navigate('/clientes'), 1500);
    } catch (err) {
      setAlert({ type: 'error', message: 'Error al crear cliente: ' + (err.response?.data?.error || err.message) });
    } finally {
      setSaving(false);
    }
  };

  const handleSyncFacturatech = async () => {
    if (!form.document_number?.trim()) {
      setAlert({ type: 'error', message: 'Debe tener un NIT para sincronizar con FacturaTech' });
      return;
    }
    setSyncing(true);
    setAlert(null);
    try {
      const resp = await api.syncClientFacturatech({ document_number: form.document_number });
      setAlert({ type: 'success', message: resp.message || 'Sincronización iniciada. Los datos se actualizarán en segundo plano.' });
    } catch (err) {
      setAlert({ type: 'error', message: 'Error: ' + (err.response?.data?.error || err.message) });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Registro de Cliente desde RUT</h2>
        <p className="text-gray-500 mt-1">Paso 1: Carga el RUT en PDF para autocompletar los datos del cliente</p>
      </div>

      {alert && <Alert type={alert.type}>{alert.message}</Alert>}

      <Card hover={false}>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all
            ${dragOver ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400 bg-gray-50'}`}
        >
          <input ref={inputRef} type="file" accept=".pdf" className="hidden"
            onChange={e => handleFile(e.target.files[0])} />
          <div className="text-5xl mb-3">📄</div>
          <p className="text-gray-600 font-medium mb-1">
            {file ? file.name : 'Arrastra el RUT aquí o haz clic para seleccionar'}
          </p>
          <p className="text-sm text-gray-400">Formato PDF, máximo 10MB</p>
        </div>
      </Card>

      {loading && (
        <Card hover={false}>
          <div className="flex items-center gap-3 py-4">
            <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
            <span className="text-sm text-gray-600">Extrayendo datos del RUT...</span>
          </div>
        </Card>
      )}

      {extracted && !loading && (
        <Card hover={false}>
          <h3 className="font-semibold text-gray-900 mb-4">Datos extraídos del RUT</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {RUT_FIELDS.map(({ key, label, type }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input type={type} value={form[key] || ''} onChange={e => setFormField(key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
            ))}
          </div>

          {extracted._rawText && (
            <details className="mt-4">
              <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
                Texto extraído del PDF
              </summary>
              <pre className="mt-2 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg max-h-48 overflow-y-auto font-mono">
                {extracted._rawText}
              </pre>
            </details>
          )}

          <div className="flex gap-3 pt-4 border-t border-gray-100 mt-4">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar Cliente'}
            </Button>
            <Button variant="secondary" onClick={handleSyncFacturatech} disabled={syncing || !form.document_number}>
              {syncing ? 'Sincronizando...' : 'Sincronizar con FacturaTech'}
            </Button>
            <Button variant="secondary" onClick={() => { setFile(null); setExtracted(null); setForm({}); }}>
              Cancelar
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
