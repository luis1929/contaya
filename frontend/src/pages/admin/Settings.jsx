import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export default function AdminSettings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getSettings()
      .then(setSettings)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (key, value) => {
    setSaving(true);
    try {
      await api.updateSetting(key, value);
      setSettings(prev => ({ ...prev, [key]: value }));
    } catch (err) {
      alert('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newKey || !newValue) return;
    await handleSave(newKey, newValue);
    setNewKey('');
    setNewValue('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Configuración del Sistema</h2>
        <p className="text-gray-500 mt-1">Gestiona las variables de configuración</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          <Card hover={false}>
            <h3 className="font-semibold text-gray-900 mb-4">Configuraciones actuales</h3>
            {Object.keys(settings).length === 0 ? (
              <p className="text-gray-400 text-sm">Sin configuraciones</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {Object.entries(settings).map(([key, value]) => (
                  <SettingRow
                    key={key}
                    label={key}
                    value={value}
                    onSave={(v) => handleSave(key, v)}
                    saving={saving}
                  />
                ))}
              </div>
            )}
          </Card>

          <Card hover={false}>
            <h3 className="font-semibold text-gray-900 mb-4">Agregar configuración</h3>
            <form onSubmit={handleAdd} className="flex gap-3">
              <input
                placeholder="Clave"
                value={newKey}
                onChange={e => setNewKey(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <input
                placeholder="Valor"
                value={newValue}
                onChange={e => setNewValue(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <Button type="submit">Agregar</Button>
            </form>
          </Card>
        </>
      )}
    </div>
  );
}

function SettingRow({ label, value, onSave, saving }) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleSave = async () => {
    await onSave(editValue);
    setEditing(false);
  };

  return (
    <div className="py-3 flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {editing ? (
          <input
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            className="mt-1 px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            autoFocus
          />
        ) : (
          <p className="text-sm text-gray-500 mt-0.5 font-mono">{value}</p>
        )}
      </div>
      <div className="flex gap-2">
        {editing ? (
          <>
            <Button size="sm" onClick={handleSave} loading={saving}>Guardar</Button>
            <Button variant="secondary" size="sm" onClick={() => setEditing(false)}>Cancelar</Button>
          </>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>✏️</Button>
        )}
      </div>
    </div>
  );
}
