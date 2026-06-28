import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import InvoiceViewer from '../components/InvoiceViewer';

function fmt(n) {
  if (n == null) return '$0';
  return '$' + Number(n).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function yearRange(year) {
  return { desde: `${year}-01-01`, hasta: today() };
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 2023 }, (_, i) => 2024 + i).reverse();

export default function Facturas() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, count: 0, iva: 0 });
  const [filters, setFilters] = useState({ ...yearRange(currentYear), cliente: '', client_id: '' });
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [viewerId, setViewerId] = useState(null);
  const [page, setPage] = useState(1);
  const perPage = 20;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');
    api.getClients().then(setClients).catch(() => setClients([]));
  }, [navigate]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.desde) params.desde = filters.desde;
      if (filters.hasta) params.hasta = filters.hasta;
      if (filters.cliente) params.cliente = filters.cliente;
      if (filters.client_id) params.client_id = filters.client_id;

      const data = await api.getInvoices(params);
      setInvoices(data);
      setPage(1);

      const total = data.reduce((s, inv) => s + (inv.total || 0), 0);
      setStats({ total, count: data.length, iva: total * 0.19 });
    } catch {
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, []);

  const handleYearChange = (val) => {
    if (val === 'todos') {
      setSelectedYear('todos');
      setFilters(prev => ({ ...prev, desde: '', hasta: '' }));
    } else {
      const year = Number(val);
      setSelectedYear(year);
      setFilters(prev => ({ ...prev, ...yearRange(year) }));
    }
  };

  const totalPages = Math.ceil(invoices.length / perPage);
  const current = invoices.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Facturación Electrónica</h2>
        {invoices.length > 0 && (
          <p className="text-gray-500 mt-1">{stats.count} facturas encontradas</p>
        )}
      </div>

      {invoices.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Facturado</p>
            <p className="text-2xl font-bold text-primary mt-1">{fmt(stats.total)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">IVA 19%</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{fmt(stats.iva)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.count}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-5 grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Año</label>
          <select value={selectedYear} onChange={e => handleYearChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/40">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
            <option value="todos">Todos los años</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</label>
          <select value={filters.client_id} onChange={e => setFilters({ ...filters, client_id: e.target.value, cliente: '' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/40">
            <option value="">Todos los clientes</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Desde</label>
          <input type="date" value={filters.desde} onChange={e => setFilters({ ...filters, desde: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Hasta</label>
          <input type="date" value={filters.hasta} onChange={e => setFilters({ ...filters, hasta: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>
        <div className="flex items-end gap-2">
          <Button onClick={load}>🔍 Filtrar</Button>
          <Button variant="secondary" onClick={() => { setFilters({ ...yearRange(currentYear), cliente: '', client_id: '' }); setSelectedYear(currentYear); }}>
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
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">NCF</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Cliente</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">IVA</th>
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
                        <div className="font-medium">{inv.client_name || '—'}</div>
                        {inv.client_email && <div className="text-xs text-gray-400">{inv.client_email}</div>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{inv.created_at?.slice(0, 10)}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">{fmt(inv.total)}</td>
                      <td className="px-4 py-3 text-sm text-primary font-medium text-right">{fmt((inv.total || 0) * 0.19)}</td>
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

      {invoices.length > 0 && (
        <p className="text-center text-sm text-gray-400">
          Mostrando {((page - 1) * perPage) + 1}-{Math.min(page * perPage, invoices.length)} de {invoices.length} facturas
        </p>
      )}

      {viewerId && <InvoiceViewer invoiceId={viewerId} onClose={() => setViewerId(null)} />}
    </div>
  );
}
