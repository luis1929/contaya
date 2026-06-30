import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../../services/api';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import InvoiceViewer from '../../components/InvoiceViewer';

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

function endOfDay(dateStr) {
  return dateStr ? `${dateStr}T23:59:59` : '';
}

function detectType(ncf) {
  if (!ncf) return 'FV';
  const u = ncf.toUpperCase();
  if (u.includes('NKR') || u.includes('NC')) return 'NC';
  if (u.includes('ND')) return 'ND';
  return 'FV';
}

function typeLabel(t) {
  return t === 'NC' ? 'Notas Crédito' : t === 'ND' ? 'Notas Débito' : 'Facturas';
}

function fmt(n) {
  if (n == null || isNaN(n)) return '$0';
  return '$' + Number(n).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function calcSubtotal(total, type) {
  const n = parseFloat(total) || 0;
  if (type === 'NC') return -(Math.abs(n) / 1.19);
  return n / 1.19;
}

function calcIva(total, type) {
  const sub = calcSubtotal(total, type);
  return sub * 0.19;
}

function calcNet(total, type) {
  const sub = calcSubtotal(total, type);
  return sub + calcIva(total, type);
}

function fmtNum(n) {
  if (n == null || isNaN(n)) return '0';
  return Number(n).toLocaleString('es-CO');
}

const typeConfig = {
  FV: { label: 'Facturas', color: 'border-l-blue-500 bg-blue-50/50', textColor: 'text-blue-700', dot: 'bg-blue-500' },
  NC: { label: 'Notas Crédito', color: 'border-l-amber-500 bg-amber-50/50', textColor: 'text-amber-700', dot: 'bg-amber-500' },
  ND: { label: 'Notas Débito', color: 'border-l-red-500 bg-red-50/50', textColor: 'text-red-700', dot: 'bg-red-500' },
};

const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 2023 }, (_, i) => 2024 + i).reverse();

export default function BillerFacturas() {
  const [invoices, setInvoices] = useState([]);
  const [clientList, setClientList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [filters, setFilters] = useState({ ...monthRange(), estatus: '', cliente: '' });
  const [selectedYear, setSelectedYear] = useState('mes');
  const [viewerId, setViewerId] = useState(null);
  const [page, setPage] = useState(1);
  const perPage = 20;
  const filtersRef = useRef(filters);

  useEffect(() => { filtersRef.current = filters; }, [filters]);

  const loadClients = useCallback(async (desde, hasta) => {
    try {
      const data = await api.getClientList({ desde, hasta });
      setClientList(data);
    } catch {}
  }, []);

  const load = useCallback(async (filtersToApply) => {
    setLoading(true);
    try {
      const params = {};
      if (filtersToApply.desde) params.desde = filtersToApply.desde;
      if (filtersToApply.hasta) params.hasta = endOfDay(filtersToApply.hasta);
      if (filtersToApply.estatus) params.estatus = filtersToApply.estatus;

      const data = await api.getInvoices(params);
      setInvoices(data);
      setPage(1);
      loadClients(filtersToApply.desde, filtersToApply.hasta);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [loadClients]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const me = await api.getMe();
      await api.syncBiller(me.id);
      setTimeout(() => load(filtersRef.current), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setSyncing(false), 1000);
    }
  };

  useEffect(() => { load(filters); }, []);

  function applyFilters(newFilters) {
    setFilters(newFilters);
    load(newFilters);
  }

  const handleYearChange = (val) => {
    setSelectedYear(val);
    let newFilters;
    if (val === 'todos') {
      newFilters = { ...filters, desde: '', hasta: '' };
    } else if (val === 'mes') {
      newFilters = { ...filters, ...monthRange() };
    } else {
      const year = Number(val);
      newFilters = { ...filters, ...yearRange(year) };
    }
    setFilters(newFilters);
    load(newFilters);
  };

  const filtered = filters.cliente
    ? invoices.filter(inv => inv.client_name?.toLowerCase().includes(filters.cliente.toLowerCase()))
    : invoices;

  const byType = {};
  for (const inv of filtered) {
    const t = detectType(inv.ncf);
    if (!byType[t]) byType[t] = { count: 0, total: 0 };
    byType[t].count++;
    byType[t].total += parseFloat(inv.total) || 0;
  }

  const netSum = (byType.FV?.total || 0) - (byType.NC?.total || 0) + (byType.ND?.total || 0);
  const estSubtotal = netSum / 1.19;
  const estIva = netSum - estSubtotal;

  const totalPages = Math.ceil(filtered.length / perPage);
  const current = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Facturación Electrónica</h2>
          <p className="text-gray-500 mt-0.5 text-sm">
            {invoices.length > 0
              ? `Gestiona y consulta todas tus facturas electrónicas · ${invoices.length} comprobantes`
              : 'Gestiona y consulta todas tus facturas electrónicas'}
          </p>
        </div>
        {netSum > 0 && (
          <div className="hidden lg:flex items-center gap-6 bg-white rounded-xl border border-gray-200 px-5 py-3">
            <div className="text-right">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Subtotal</p>
              <p className="text-sm font-semibold text-gray-700">{fmt(estSubtotal)}</p>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="text-right">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">IVA 19%</p>
              <p className="text-sm font-semibold text-primary">{fmt(estIva)}</p>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="text-right">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Total Neto</p>
              <p className="text-base font-bold text-gray-900">{fmt(netSum)}</p>
            </div>
          </div>
        )}
      </div>

      {invoices.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {['FV', 'NC', 'ND'].filter(t => byType[t]).map(t => {
            const cfg = typeConfig[t];
            return (
              <div key={t} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border border-l-4 ${cfg.color}`}>
                <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wider ${cfg.textColor}`}>{cfg.label}</p>
                  <p className="text-sm text-gray-500">
                    <span className="font-bold text-gray-900">{byType[t].count}</span> comprobantes
                    <span className="mx-1.5 text-gray-300">·</span>
                    <span className="font-bold text-gray-900">{fmt(byType[t].total)}</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Período</label>
            <div className="flex gap-2">
              <input type="date" value={filters.desde}
                onChange={e => { setSelectedYear(null); applyFilters({ ...filters, desde: e.target.value }); }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
              <span className="text-gray-300 self-center">→</span>
              <input type="date" value={filters.hasta}
                onChange={e => { setSelectedYear(null); applyFilters({ ...filters, hasta: e.target.value }); }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Cliente</label>
            <select value={filters.cliente}
              onChange={e => setFilters({ ...filters, cliente: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 min-w-[180px]">
              <option value="">Todos los clientes</option>
              {clientList.map(c => (
                <option key={c.name} value={c.name}>{c.name} ({c.count})</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</label>
            <select value={filters.estatus}
              onChange={e => setFilters({ ...filters, estatus: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/40">
              <option value="">Todos</option>
              <option value="Firmado">Firmado</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Anulado">Anulado</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <Button onClick={() => load(filtersRef.current)}>🔍 Filtrar</Button>
            <Button variant={syncing ? 'primary' : 'success'} onClick={handleSync} disabled={syncing}
              className={syncing ? 'animate-pulse' : ''}>
              {syncing ? '⏳ Sincronizando...' : '🔄 Sincronizar'}
            </Button>
          </div>
        </div>
        <div className="px-4 pb-4 flex flex-wrap gap-1.5">
          {['mes', 'todos', ...years].map(y => {
            const label = y === 'mes' ? 'Este mes' : y === 'todos' ? 'Todo' : String(y);
            return (
              <button key={y} onClick={() => handleYearChange(y)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${selectedYear === y ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-lg text-gray-400 mb-1">📄 No se encontraron facturas</p>
          <p className="text-sm text-gray-400">Intenta ajustar los filtros</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">NCF</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Cliente</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Fecha</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Subtotal</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">IVA 19%</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Total</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {current.map((inv, i) => (
                    <tr key={inv.id} className="hover:bg-gray-50 transition-colors fade-in" style={{ animationDelay: `${i * 0.03}s` }}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${detectType(inv.ncf) === 'FV' ? 'bg-blue-500' : detectType(inv.ncf) === 'NC' ? 'bg-amber-500' : 'bg-red-500'}`} />
                          <button onClick={() => setViewerId(inv.id)}
                            className="text-sm font-mono font-medium text-primary hover:text-primary-dark hover:underline cursor-pointer">
                            {inv.ncf || '—'}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{inv.client_name || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-400">{inv.created_at?.slice(0, 10)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-right">{fmt(calcSubtotal(inv.total, detectType(inv.ncf)))}</td>
                      <td className="px-4 py-3 text-sm text-primary text-right">{fmt(calcIva(inv.total, detectType(inv.ncf)))}</td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">{fmt(calcNet(inv.total, detectType(inv.ncf)))}</td>
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
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${detectType(inv.ncf) === 'FV' ? 'bg-blue-500' : detectType(inv.ncf) === 'NC' ? 'bg-amber-500' : 'bg-red-500'}`} />
                    <button onClick={() => setViewerId(inv.id)} className="text-primary font-mono text-sm font-medium hover:underline">
                      {inv.ncf || '—'}
                    </button>
                  </div>
                  <Badge color={inv.status === 'Firmado' ? 'success' : inv.status === 'Anulado' ? 'danger' : 'warning'}>
                    {inv.status}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Cliente</span>
                  <span className="font-medium text-gray-900 text-right">{inv.client_name || '—'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Fecha</span>
                  <span className="text-gray-600">{inv.created_at?.slice(0, 10)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="text-gray-600">{fmt(calcSubtotal(inv.total, detectType(inv.ncf)))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">IVA 19%</span>
                  <span className="text-primary">{fmt(calcIva(inv.total, detectType(inv.ncf)))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total</span>
                  <span className="font-bold text-gray-900">{fmt(calcNet(inv.total, detectType(inv.ncf)))}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>←</Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <Button key={p} variant={p === page ? 'primary' : 'secondary'} size="sm" onClick={() => setPage(p)}>{p}</Button>
          ))}
          <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>→</Button>
          <span className="ml-3 text-sm text-gray-400">
            Pág. {page} de {totalPages} · {filtered.length} registros
          </span>
        </div>
      )}

      {viewerId && <InvoiceViewer invoiceId={viewerId} onClose={() => setViewerId(null)} />}
    </div>
  );
}
