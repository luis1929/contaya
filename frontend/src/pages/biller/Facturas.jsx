import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import InvoiceViewer from '../../components/InvoiceViewer';

function fmt(n) {
  if (n == null) return '$0';
  return '$' + Number(n).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function firstOfMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function yearRange(year) {
  return { desde: `${year}-01-01`, hasta: today() };
}

function monthRange() {
  return { desde: firstOfMonth(), hasta: today() };
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 2023 }, (_, i) => 2024 + i).reverse();

export default function BillerFacturas() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ ...monthRange(), cliente: '', estatus: '' });
  const [selectedYear, setSelectedYear] = useState('mes');
  const [stats, setStats] = useState({ total: 0, count: 0, iva: 0, subtotal: 0 });
  const [viewerId, setViewerId] = useState(null);
  const [page, setPage] = useState(1);
  const [clientList, setClientList] = useState([]);
  const perPage = 20;

  const load = useCallback(async (filtersToApply) => {
    setLoading(true);
    try {
      const params = {};
      if (filtersToApply.desde) params.desde = filtersToApply.desde;
      if (filtersToApply.hasta) params.hasta = filtersToApply.hasta;
      if (filtersToApply.cliente) params.cliente = filtersToApply.cliente;
      if (filtersToApply.estatus) params.estatus = filtersToApply.estatus;

      const data = await api.getInvoices(params);
      setInvoices(data);
      setPage(1);

      const total = data.reduce((s, inv) => s + Number(inv.total || 0), 0);
      setStats({ total, count: data.length, iva: total * 0.19, subtotal: total / 1.19 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(filters); }, []);

  useEffect(() => {
    api.getClients().then(data => {
      setClientList(data);
    }).catch(() => {});
  }, []);

  const handleYearChange = (val) => {
    let newFilters;
    if (val === 'todos') {
      setSelectedYear('todos');
      newFilters = { ...filters, desde: '', hasta: '' };
    } else if (val === 'mes') {
      setSelectedYear('mes');
      newFilters = { ...filters, ...monthRange() };
    } else {
      const year = Number(val);
      setSelectedYear(year);
      newFilters = { ...filters, ...yearRange(year) };
    }
    setFilters(newFilters);
    load(newFilters);
  };

  const totalPages = Math.ceil(invoices.length / perPage);
  const current = invoices.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Facturas</h2>
        <p className="text-gray-500 mt-1">
          Gestiona y consulta todas tus facturas electrónicas
          {invoices.length > 0 && ` · ${invoices.length} facturas`}
        </p>
      </div>

      {invoices.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Facturado</p>
            <p className="text-2xl font-bold text-primary mt-1">{fmt(stats.total)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">IVA 19%</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{fmt(stats.iva)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{fmt(stats.subtotal)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.count}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-5 grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Año</label>
          <select value={selectedYear} onChange={e => handleYearChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/40">
            <option value="mes">Mes actual</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
            <option value="todos">Todos los años</option>
          </select>
        </div>
        {['desde', 'hasta', 'cliente', 'estatus'].map(field => (
          <div key={field} className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {field === 'desde' ? 'Desde' : field === 'hasta' ? 'Hasta' : field === 'cliente' ? 'Cliente' : 'Estado'}
            </label>
            {field === 'estatus' ? (
              <select value={filters.estatus} onChange={e => setFilters({ ...filters, estatus: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/40">
                <option value="">Todos</option>
                <option value="Firmado">Firmado</option>
                <option value="Pendiente">Pendiente</option>
                <option value="Anulado">Anulado</option>
              </select>
            ) : field === 'cliente' ? (
              <select value={filters.cliente} onChange={e => setFilters({ ...filters, cliente: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/40">
                <option value="">Todos</option>
                {clientList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            ) : (
              <input type={'date'}
                value={filters[field]} onChange={e => setFilters({ ...filters, [field]: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            )}
          </div>
        ))}
        <div className="flex items-end gap-2">
          <Button onClick={() => load(filters)}>🔍 Filtrar</Button>
          <Button variant="secondary" onClick={() => { const reset = { ...monthRange(), cliente: '', estatus: '' }; setFilters(reset); setSelectedYear('mes'); load(reset); }}>
            Limpiar
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : invoices.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-lg text-gray-400 mb-1">📄 No se encontraron facturas</p>
          <p className="text-sm text-gray-400">Intenta ajustar los filtros</p>
        </div>
      ) : (
        <>
          <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">NCF</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Cliente</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">IVA</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Subtotal</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {current.map((inv, i) => (
                    <tr key={inv.id} className="hover:bg-gray-50 transition-colors fade-in" style={{ animationDelay: `${i * 0.03}s` }}>
                      <td className="px-4 py-3 text-sm font-mono font-medium">
                        <button onClick={() => setViewerId(inv.id)}
                          className="text-primary hover:text-primary-dark hover:underline cursor-pointer">
                          {inv.ncf || '—'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div className="font-medium">{inv.client_name || (inv.client || '').split('...')[0]}</div>
                        {inv.client_email && <div className="text-xs text-gray-400">{inv.client_email}</div>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{inv.created_at?.slice(0, 10)}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">{fmt(inv.total)}</td>
                      <td className="px-4 py-3 text-sm text-primary font-medium text-right">{fmt(Number(inv.total || 0) * 0.19)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 text-right">{fmt(Number(inv.total || 0) / 1.19)}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge color={inv.status === 'Firmado' ? 'success' : inv.status === 'Anulado' ? 'danger' : 'warning'}>
                          {inv.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="md:hidden space-y-3">
            {current.map((inv, i) => (
              <div key={inv.id} className="bg-white rounded-xl border border-gray-200 p-4 space-y-2 fade-in" style={{ animationDelay: `${i * 0.03}s` }}>
                <div className="flex items-center justify-between">
                  <button onClick={() => setViewerId(inv.id)} className="text-primary font-mono text-sm font-medium hover:underline">
                    {inv.ncf || '—'}
                  </button>
                  <Badge color={inv.status === 'Firmado' ? 'success' : inv.status === 'Anulado' ? 'danger' : 'warning'}>
                    {inv.status}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Cliente</span>
                  <span className="font-medium text-gray-900 text-right">{inv.client_name || (inv.client || '').split('...')[0]}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Fecha</span>
                  <span className="text-gray-700">{inv.created_at?.slice(0, 10)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total</span>
                  <span className="font-semibold text-gray-900">{fmt(Number(inv.total))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">IVA</span>
                  <span className="text-primary font-medium">{fmt(Number(inv.total || 0) * 0.19)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-gray-700">{fmt(Number(inv.total || 0) / 1.19)}</span>
                </div>
                {inv.client_email && <p className="text-xs text-gray-400">{inv.client_email}</p>}
              </div>
            ))}
          </div>
        </>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Anterior</Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <Button key={p} variant={p === page ? 'primary' : 'secondary'} size="sm" onClick={() => setPage(p)}>{p}</Button>
          ))}
          <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Siguiente →</Button>
        </div>
      )}

      <p className="text-center text-sm text-gray-400">
        Mostrando {((page - 1) * perPage) + 1}-{Math.min(page * perPage, invoices.length)} de {invoices.length} facturas
      </p>

      {viewerId && <InvoiceViewer invoiceId={viewerId} onClose={() => setViewerId(null)} />}
    </div>
  );
}
