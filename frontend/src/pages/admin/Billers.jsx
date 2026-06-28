import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';

export default function AdminBillers() {
  const [billers, setBillers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editBiller, setEditBiller] = useState(null);
  const [form, setForm] = useState({ name: '', document_number: '', email: '', phone: '', address: '', city: '', password: '' });
  const [syncing, setSyncing] = useState({});

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const res = await api.getAdminBillers({ page: p, search, limit: 15 });
      setBillers(res.data);
      setTotalPages(res.totalPages);
      setPage(res.page);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    load(1);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.createBiller(form);
      setShowCreate(false);
      setForm({ name: '', document_number: '', email: '', phone: '', address: '', city: '', password: '' });
      load(1);
    } catch (err) {
      alert('Error al crear facturador: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editBiller) return;
    try {
      await api.updateAdminBiller(editBiller.id, form);
      setEditBiller(null);
      setForm({ name: '', document_number: '', email: '', phone: '', address: '', city: '', password: '' });
      load(page);
    } catch (err) {
      alert('Error al actualizar: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleToggle = async (biller) => {
    try {
      await api.updateAdminBiller(biller.id, { is_active: !biller.is_active });
      load(page);
    } catch (err) {
      alert('Error al cambiar estado');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este facturador? Esta acción no se puede deshacer.')) return;
    try {
      await api.deleteAdminBiller(id);
      load(page);
    } catch (err) {
      alert('Error al eliminar');
    }
  };

  const handleSync = async (biller) => {
    setSyncing(prev => ({ ...prev, [biller.id]: true }));
    try {
      await api.syncBiller(biller.id);
    } catch (err) {
      alert('Error al iniciar sincronización: ' + (err.response?.data?.error || err.message));
    } finally {
      setTimeout(() => {
        setSyncing(prev => ({ ...prev, [biller.id]: false }));
        load(page);
      }, 2000);
    }
  };

  const openEdit = (biller) => {
    setEditBiller(biller);
    setForm({
      name: biller.name || '',
      document_number: biller.document_number || '',
      email: biller.email || '',
      phone: biller.phone || '',
      address: biller.address || '',
      city: biller.city || '',
      password: '',
    });
  };

  const handleImpersonate = async (biller) => {
    try {
      const data = await api.impersonate(biller.id);
      localStorage.setItem('impersonate_token', data.token);
      localStorage.setItem('impersonating', 'true');
      window.open('/dashboard', '_blank');
    } catch (err) {
      alert('Error al ingresar');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Facturadores</h2>
          <p className="text-gray-500 mt-1">{billers.length} facturadores registrados</p>
        </div>
        <Button onClick={() => { setEditBiller(null); setForm({ name: '', document_number: '', email: '', phone: '', address: '', city: '', password: '' }); setShowCreate(true); }}>
          + Nuevo facturador
        </Button>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3">
        <input
          type="text"
          placeholder="Buscar por nombre o NIT..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
        />
        <Button type="submit">Buscar</Button>
      </form>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-3">
          {billers.map(b => (
            <Card key={b.id} hover={false} className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-semibold text-gray-900">{b.name}</h3>
                  <Badge color={b.is_active ? 'success' : 'danger'}>
                    {b.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                  <Badge color={b.credentials_configured ? 'info' : 'gray'}>
                    {b.credentials_configured ? 'FacturaTech ✔' : 'Sin scraper'}
                  </Badge>
                  <Badge color={
                    b.scrape_status === 'done' ? 'success' :
                    b.scrape_status === 'running' ? 'warning' :
                    b.scrape_status === 'error' ? 'danger' : 'gray'
                  }>
                    {b.scrape_status === 'done' ? '✓ Sincronizado' :
                     b.scrape_status === 'running' ? '🔄 Sincronizando' :
                     b.scrape_status === 'error' ? '✗ Error' : '—'}
                  </Badge>
                </div>
                <div className="flex gap-4 text-sm text-gray-500">
                  <span>NIT: {b.document_number}</span>
                  {b.email && <span>· {b.email}</span>}
                  <span>· {b.invoice_count || 0} facturas</span>
                  <span>· Total: ${Number(b.total_sum || 0).toLocaleString('es-CO')}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {b.credentials_configured && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSync(b)}
                    disabled={syncing[b.id]}
                    title="Sincronizar con FacturaTech"
                    className={syncing[b.id] ? 'animate-pulse' : ''}
                  >
                    {syncing[b.id] ? '⏳' : '⚡'}
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => handleImpersonate(b)}>
                  🔍
                </Button>
                <Button variant="ghost" size="sm" onClick={() => openEdit(b)}>
                  ✏️
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggle(b)}
                >
                  {b.is_active ? '🔓' : '🔒'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(b.id)}>
                  🗑️
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => load(page - 1)}>
            ← Anterior
          </Button>
          <span className="flex items-center px-3 text-sm text-gray-600">
            Página {page} de {totalPages}
          </span>
          <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => load(page + 1)}>
            Siguiente →
          </Button>
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nuevo Facturador">
        <form onSubmit={handleCreate} className="space-y-4">
          <CreateEditForm form={form} setForm={setForm} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button type="submit">Crear facturador</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!editBiller} onClose={() => setEditBiller(null)} title="Editar Facturador">
        <form onSubmit={handleUpdate} className="space-y-4">
          <CreateEditForm form={form} setForm={setForm} editing />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setEditBiller(null)}>Cancelar</Button>
            <Button type="submit">Guardar cambios</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function CreateEditForm({ form, setForm, editing }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Nombre *</label>
          <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">NIT *</label>
          <input required value={form.document_number} onChange={e => setForm({ ...form, document_number: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Email</label>
          <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Teléfono</label>
          <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Dirección</label>
          <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Ciudad</label>
          <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-700">
          {editing ? 'Nueva contraseña (dejar vacío para mantener)' : 'Contraseña'}
        </label>
        <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
      </div>
    </>
  );
}
