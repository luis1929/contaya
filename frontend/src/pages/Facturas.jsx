import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import InvoiceViewer from '../components/InvoiceViewer';

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
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ ...yearRange(currentYear) });
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [viewerId, setViewerId] = useState(null);
  const [page, setPage] = useState(1);
  const perPage = 20;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');
  }, [navigate]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.desde) params.desde = filters.desde;
      if (filters.hasta) params.hasta = filters.hasta;

      const data = await api.getInvoices(params);
      setInvoices(data);
      setPage(1);
    } catch {
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

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
          <p className="text-gray-500 mt-1">{invoices.length} facturas encontradas</p>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Año</label>
          <select value={selectedYear} onChange={e => handleYearChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/40">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
            <option value="todos">Todos los años</option>
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
          <Button variant="secondary" onClick={() => { setFilters({ ...yearRange(currentYear) }); setSelectedYear(currentYear); }}>
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
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">NCF</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Fecha</th>
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
                    <td className="px-4 py-3 text-sm text-gray-500">{inv.created_at?.slice(0, 10)}</td>
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
