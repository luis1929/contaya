import { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Alert from '../../components/ui/Alert';
import Modal from '../../components/ui/Modal';

export default function Items() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [alert, setAlert] = useState(null);

  const [previewRows, setPreviewRows] = useState(null);
  const [previewErrors, setPreviewErrors] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const inputRef = useRef(null);

  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ code: '', unspsc_code: '', description: '', type: 'producto', unit_value: '', iva_percentage: '19', retention_percentage: '0' });

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 20 };
      if (search) params.search = search;
      const res = await api.getItems(params);
      setItems(res.data);
      setTotalPages(res.totalPages);
      setPage(res.page);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleFile = async (f) => {
    if (!f) return;
    setPreviewLoading(true);
    setAlert(null);
    try {
      const res = await api.previewItems(f);
      if (res.errors?.length) setPreviewErrors(res.errors.slice(0, 20));
      if (res.rows?.length) setPreviewRows(res.rows);
      if (!res.rows?.length && !res.errors?.length) setAlert({ type: 'error', message: 'No se pudieron leer datos del archivo' });
    } catch (err) {
      setAlert({ type: 'error', message: 'Error al procesar Excel: ' + (err.response?.data?.error || err.message) });
    } finally {
      setPreviewLoading(false);
    }
  };

  const confirmPreview = async () => {
    if (!previewRows?.length) return;
    try {
      const res = await api.confirmItems(previewRows);
      setAlert({ type: 'success', message: `${res.inserted.length} ítems importados${res.errors.length ? `, ${res.errors.length} errores` : ''}` });
      setPreviewRows(null);
      setPreviewErrors([]);
      load(1);
    } catch (err) {
      setAlert({ type: 'error', message: 'Error al guardar: ' + (err.response?.data?.error || err.message) });
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.createItem({ ...form, unit_value: parseFloat(form.unit_value) || 0, iva_percentage: parseFloat(form.iva_percentage) || 0, retention_percentage: parseFloat(form.retention_percentage) || 0 });
      setShowForm(false);
      resetForm();
      load(1);
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editItem) return;
    try {
      await api.updateItem(editItem.id, { ...form, unit_value: parseFloat(form.unit_value) || 0, iva_percentage: parseFloat(form.iva_percentage) || 0, retention_percentage: parseFloat(form.retention_percentage) || 0 });
      setEditItem(null);
      resetForm();
      load(page);
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este ítem?')) return;
    try {
      await api.deleteItem(id);
      load(page);
    } catch (err) {
      alert('Error al eliminar');
    }
  };

  const resetForm = () => setForm({ code: '', unspsc_code: '', description: '', type: 'producto', unit_value: '', iva_percentage: '19', retention_percentage: '0' });

  const openEdit = (item) => {
    setEditItem(item);
    setForm({ code: item.code, unspsc_code: item.unspsc_code || '', description: item.description, type: item.type, unit_value: String(item.unit_value), iva_percentage: String(item.iva_percentage), retention_percentage: String(item.retention_percentage) });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Productos y Servicios</h2>
          <p className="text-gray-500 mt-1">Paso 2: Gestiona tu catálogo de ítems</p>
        </div>
        <Button onClick={() => { setEditItem(null); resetForm(); setShowForm(true); }}>+ Nuevo ítem</Button>
      </div>

      {alert && <Alert type={alert.type}>{alert.message}</Alert>}

      <Card hover={false}>
        <div className="flex gap-3 items-center">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700 mb-2">Carga masiva desde Excel</p>
            <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden"
              onChange={e => handleFile(e.target.files[0])} />
            <Button variant="secondary" onClick={() => inputRef.current?.click()} disabled={previewLoading}>
              {previewLoading ? 'Procesando...' : 'Seleccionar archivo Excel'}
            </Button>
          </div>
          <div className="text-xs text-gray-400">
            <p>Columnas esperadas:</p>
            <p className="font-mono">código interno, descripción, tipo, valor unitario, IVA, retención, código DIAN</p>
          </div>
        </div>
      </Card>

      {previewErrors.length > 0 && (
        <Alert type="error">
          <p className="font-medium mb-1">Errores en el archivo:</p>
          <ul className="text-sm list-disc pl-4 space-y-0.5">
            {previewErrors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </Alert>
      )}

      {previewRows && (
        <Card hover={false}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Vista previa: {previewRows.length} ítems detectados</h3>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => { setPreviewRows(null); setPreviewErrors([]); }}>Cancelar</Button>
              <Button size="sm" onClick={confirmPreview}>Confirmar importación</Button>
            </div>
          </div>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="py-2 pr-4 font-medium">Código</th>
                  <th className="py-2 pr-4 font-medium">UNSPSC</th>
                  <th className="py-2 pr-4 font-medium">Descripción</th>
                  <th className="py-2 pr-4 font-medium">Tipo</th>
                  <th className="py-2 pr-4 font-medium text-right">Valor</th>
                  <th className="py-2 pr-4 font-medium text-right">IVA</th>
                  <th className="py-2 font-medium text-right">Ret.</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 pr-4 font-mono text-xs">{row.code}</td>
                    <td className="py-2 pr-4 font-mono text-xs text-gray-400">{row.unspsc_code || '—'}</td>
                    <td className="py-2 pr-4">{row.description}</td>
                    <td className="py-2 pr-4"><Badge color={row.type === 'servicio' ? 'info' : 'gray'}>{row.type}</Badge></td>
                    <td className="py-2 pr-4 text-right font-mono">${Number(row.unit_value).toLocaleString('es-CO')}</td>
                    <td className="py-2 pr-4 text-right">{row.iva_percentage}%</td>
                    <td className="py-2 text-right">{row.retention_percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-2">
            {previewRows.map((row, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-3 text-sm space-y-1.5">
                <div className="flex justify-between">
                  <span className="font-mono text-xs text-gray-500">{row.code}</span>
                  <Badge color={row.type === 'servicio' ? 'info' : 'gray'}>{row.type}</Badge>
                </div>
                <p className="font-medium text-gray-900">{row.description}</p>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>UNSPSC: {row.unspsc_code || '—'}</span>
                  <span>${Number(row.unit_value).toLocaleString('es-CO')}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>IVA: {row.iva_percentage}%</span>
                  <span>Ret: {row.retention_percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : items.length === 0 && !previewRows ? (
        <Card hover={false}>
          <p className="text-center text-gray-400 py-8">No hay ítems. Carga un Excel o crea uno manualmente.</p>
        </Card>
      ) : (
        <>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="py-3 pr-4 font-medium">Código</th>
                  <th className="py-3 pr-4 font-medium">Descripción</th>
                  <th className="py-3 pr-4 font-medium">Tipo</th>
                  <th className="py-3 pr-4 font-medium text-right">Valor Unitario</th>
                  <th className="py-3 pr-4 font-medium text-right">IVA</th>
                  <th className="py-3 pr-4 font-medium text-right">Ret.</th>
                  <th className="py-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 pr-4 font-mono text-xs">{item.code}</td>
                    <td className="py-3 pr-4">
                      <p className="font-medium text-gray-900">{item.description}</p>
                      {item.unspsc_code && <p className="text-xs text-gray-400">UNSPSC: {item.unspsc_code}</p>}
                    </td>
                    <td className="py-3 pr-4"><Badge color={item.type === 'servicio' ? 'info' : 'gray'}>{item.type}</Badge></td>
                    <td className="py-3 pr-4 text-right font-mono">${Number(item.unit_value).toLocaleString('es-CO')}</td>
                    <td className="py-3 pr-4 text-right">{item.iva_percentage}%</td>
                    <td className="py-3 pr-4 text-right">{item.retention_percentage}%</td>
                    <td className="py-3 text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>✏️</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>🗑️</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {items.map(item => (
              <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{item.description}</p>
                    <p className="font-mono text-xs text-gray-400">{item.code}{item.unspsc_code ? ` · UNSPSC: ${item.unspsc_code}` : ''}</p>
                  </div>
                  <Badge color={item.type === 'servicio' ? 'info' : 'gray'}>{item.type}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Valor Unitario</span>
                  <span className="font-mono font-medium">${Number(item.unit_value).toLocaleString('es-CO')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">IVA</span>
                  <span>{item.iva_percentage}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Ret.</span>
                  <span>{item.retention_percentage}%</span>
                </div>
                <div className="flex justify-end gap-1 pt-1">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>✏️</Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>🗑️</Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => load(page - 1)}>← Anterior</Button>
          <span className="flex items-center px-3 text-sm text-gray-600">Pág {page} de {totalPages}</span>
          <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => load(page + 1)}>Siguiente →</Button>
        </div>
      )}

      <Modal open={showForm || !!editItem} onClose={() => { setShowForm(false); setEditItem(null); }}
        title={editItem ? 'Editar ítem' : 'Nuevo ítem'}>
        <form onSubmit={editItem ? handleUpdate : handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Código interno *</label>
              <input required value={form.code} onChange={e => setForm({ ...form, code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Código DIAN/UNSPSC</label>
              <input value={form.unspsc_code} onChange={e => setForm({ ...form, unspsc_code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700">Descripción *</label>
              <textarea required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" rows={2} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Tipo</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/40">
                <option value="producto">Producto</option>
                <option value="servicio">Servicio</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Valor unitario *</label>
              <input type="number" step="0.01" required value={form.unit_value}
                onChange={e => setForm({ ...form, unit_value: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">IVA %</label>
              <input type="number" step="0.01" value={form.iva_percentage}
                onChange={e => setForm({ ...form, iva_percentage: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Retención %</label>
              <input type="number" step="0.01" value={form.retention_percentage}
                onChange={e => setForm({ ...form, retention_percentage: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => { setShowForm(false); setEditItem(null); }}>Cancelar</Button>
            <Button type="submit">{editItem ? 'Guardar cambios' : 'Crear ítem'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
