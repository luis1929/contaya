import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';

export default function Credentials() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [alert, setAlert] = useState(null);

  const loadStatus = async () => {
    try {
      const res = await api.getCredentialsStatus();
      setConfigured(res.configured);
      setUpdatedAt(res.updated_at);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStatus(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setAlert({ type: 'error', message: 'Ambos campos son requeridos' });
      return;
    }
    setSaving(true);
    setAlert(null);
    try {
      await api.saveCredentials({ username: username.trim(), password });
      setAlert({ type: 'success', message: 'Credenciales guardadas correctamente' });
      setConfigured(true);
      setUpdatedAt(new Date().toISOString());
      setPassword('');
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.error || 'Error al guardar credenciales' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Eliminar credenciales? Deberá configurarlas nuevamente para usar el scraper.')) return;
    try {
      await api.deleteCredentials();
      setAlert({ type: 'success', message: 'Credenciales eliminadas' });
      setConfigured(false);
      setUpdatedAt(null);
      setUsername('');
      setPassword('');
    } catch (err) {
      setAlert({ type: 'error', message: 'Error al eliminar credenciales' });
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setAlert(null);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      await api.syncBiller(user.biller_id || user.id);
      setAlert({ type: 'success', message: 'Sincronización iniciada. Los datos se actualizarán en segundo plano.' });
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.error || 'Error al iniciar sincronización' });
    } finally {
      setTimeout(() => setSyncing(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Credenciales FacturaTech</h2>
        <p className="text-gray-500 mt-1">Configura tu usuario y contraseña para la descarga automática de facturas</p>
      </div>

      {alert && <Alert type={alert.type}>{alert.message}</Alert>}

      {configured && !alert && (
        <Alert type="info">
          Credenciales configuradas el {new Date(updatedAt).toLocaleString('es-CO')}.
          Los datos están cifrados y solo se usarán para el scraper.
        </Alert>
      )}

      <Card>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Usuario (NIT)
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="NIT de facturatech.co"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Contraseña de facturatech.co"
                className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
              >
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando...' : configured ? 'Actualizar credenciales' : 'Guardar credenciales'}
            </Button>
            {configured && (
              <Button type="button" variant="danger" onClick={handleDelete}>
                Eliminar
              </Button>
            )}
            {configured && (
              <Button type="button" variant="primary" onClick={handleSync} disabled={syncing}>
                {syncing ? '⏳ Sincronizando...' : '⚡ Sincronizar ahora'}
              </Button>
            )}
          </div>
        </form>
      </Card>

      <div className="text-xs text-gray-400 space-y-1">
        <p>🔒 Las credenciales se cifran con AES-256-GCM antes de almacenarse.</p>
        <p>🛡️ Solo se usan para la descarga automática de facturas electrónicas.</p>
        <p>🔑 Nunca se muestran en texto plano, ni siquiera al administrador.</p>
      </div>
    </div>
  );
}
