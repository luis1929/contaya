import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../../services/api';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import InvoiceViewer from '../../components/InvoiceViewer';

const MONTHS = [
  { key: 1, label: 'Enero', short: 'Ene' },
  { key: 2, label: 'Febrero', short: 'Feb' },
  { key: 3, label: 'Marzo', short: 'Mar' },
  { key: 4, label: 'Abril', short: 'Abr' },
  { key: 5, label: 'Mayo', short: 'May' },
  { key: 6, label: 'Junio', short: 'Jun' },
  { key: 7, label: 'Julio', short: 'Jul' },
  { key: 8, label: 'Agosto', short: 'Ago' },
  { key: 9, label: 'Septiembre', short: 'Sep' },
  { key: 10, label: 'Octubre', short: 'Oct' },
  { key: 11, label: 'Noviembre', short: 'Nov' },
  { key: 12, label: 'Diciembre', short: 'Dic' },
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function firstOfMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function monthRange(year, month) {
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const end = new Date(year, month, 0);
  const endStr = `${year}-${String(month).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
  return { desde: start, hasta: endStr };
}

function endOfDay(dateStr) {
  return dateStr ? `${dateStr}T23:59:59` : '';
}

function detectType(ncf) {
  if (!ncf) return 'FV';
  const u = ncf.toUpperCase();
  if (u.includes('NKR') || u.includes('NC')) return 'NC';
  if (u.includes('ND')) return 'ND';
  if (u.includes('SETT')) return 'TEST';
  return 'FV';
}

function typeLabel(t) {
  return t === 'NC' ? 'Notas Crédito' : t === 'ND' ? 'Notas Débito' : t === 'TEST' ? 'Pruebas' : 'Facturas';
}

function fmt(n) {
  if (n == null || isNaN(n)) return '$0';
  return '$' + Number(n).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function calcSubtotal(total, type) {
  const n = parseFloat(total) || 0;
  if (type === 'NC') return -(Math.abs(n) / 1.19);
  if (type === 'TEST') return 0;
  return n / 1.19;
}

function calcIva(total, type) {
  if (type === 'TEST') return 0;
  const sub = calcSubtotal(total, type);
  return sub * 0.19;
}

function calcNet(total, type) {
  if (type === 'TEST') return 0;
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
  TEST: { label: 'Pruebas', color: 'border-l-gray-400 bg-gray-50/50', textColor: 'text-gray-500', dot: 'bg-gray-400' },
};

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;
const pastYears = Array.from({ length: currentYear - 2023 }, (_, i) => 2024 + i).reverse();

export default function BillerFacturas() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [filters, setFilters] = useState({ ...monthRange(currentYear, currentMonth), estatus: '' });
  const [selectedPeriod, setSelectedPeriod] = useState({ type: 'month', year: currentYear, month: currentMonth });
  const [viewerId, setViewerId] = useState(null);
  const [page, setPage] = useState(1);
  const [syncMessage, setSyncMessage] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const perPage = 20;
  const filtersRef = useRef(filters);

  useEffect(() => { filtersRef.current = filters; }, [filters]);

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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const me = await api.getMe();
      const billerId = me.biller_id || me.id;
      await api.syncBiller(billerId);
      setSyncMessage({ type: 'success', text: 'Sincronización iniciada. Los datos se actualizarán en breve.' });
      setTimeout(() => {
        load(filtersRef.current);
        setSyncMessage(null);
      }, 4000);
    } catch (err) {
      setSyncMessage({ type: 'error', text: err.response?.data?.error || 'Error al iniciar sincronización' });
    } finally {
      setTimeout(() => setSyncing(false), 2000);
    }
  };

  useEffect(() => { load(filters); }, []);

  function applyFilters(newFilters) {
    setFilters(newFilters);
    load(newFilters);
  }

  const selectMonth = (year, month) => {
    const range = monthRange(year, month);
    setSelectedPeriod({ type: 'month', year, month });
    setShowHistory(false);
    applyFilters({ ...filters, ...range });
  };

  const selectYear = (year) => {
    const range = { desde: `${year}-01-01`, hasta: `${year}-12-31` };
    setSelectedPeriod({ type: 'year', year });
    setShowHistory(false);
    applyFilters({ ...filters, ...range });
  };

  const selectAll = () => {
    setSelectedPeriod({ type: 'all' });
    setShowHistory(false);
    applyFilters({ ...filters, desde: '', hasta: '' });
  };

  const filtered = invoices.filter(inv => {
    const t = detectType(inv.ncf);
    if (t === 'TEST') return false;
    if (filters.estatus && inv.status !== filters.estatus) return false;
    return true;
  });

  const byType = {};
  for (const inv of filtered) {
    const t = detectType(inv.ncf);
    if (!byType[t]) byType[t] = { count: 0, total: 0, subtotal: 0, iva: 0 };
    byType[t].count++;
    byType[t].total += parseFloat(inv.total) || 0;
    byType[t].subtotal += calcSubtotal(inv.total, t);
    byType[t].iva += calcIva(inv.total, t);
  }

  const netSum = (byType.FV?.total || 0) - (byType.NC?.total || 0) + (byType.ND?.total || 0);
  const estSubtotal = (byType.FV?.subtotal || 0) - (byType.NC?.subtotal || 0) + (byType.ND?.subtotal || 0);
  const estIva = (byType.FV?.iva || 0) - (byType.NC?.iva || 0) + (byType.ND?.iva || 0);

  const totalPages = Math.ceil(filtered.length / perPage);
  const current = filtered.slice((page - 1) * perPage, page * perPage);

  const isCurrentMonthSelected = selectedPeriod.type === 'month' && selectedPeriod.year === currentYear && selectedPeriod.month === currentMonth;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Facturación Electrónica</h2>
          <p className="text-gray-500 mt-0.5 text-sm">
            {invoices.length > 0
              ? `Gestiona y consulta tus comprobantes · ${filtered.length} visibles de ${invoices.length} totales`
              : 'Gestiona y consulta tus comprobantes electrónicos'}
          </p>
        </div>
        {netSum > 0 && (
          <div className="hidden lg:flex items-center gap-6 bg-white rounded-xl border border-gray-200 px-5 py-3 shadow-sm">
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

      {syncMessage && (
        <div className={`px-4 py-3 rounded-lg text-sm font-medium animate-slide-in ${
          syncMessage.type === 'error'
            ? 'bg-red-50 text-red-700 border border-red-200'
            : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {syncMessage.text}
        </div>
      )}

      {filtered.length > 0 && (
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
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</label>
            <select value={filters.estatus}
              onChange={e => applyFilters({ ...filters, estatus: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 min-w-[160px]">
              <option value="">Todos</option>
              <option value="Firmado">Firmado</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Anulado">Anulado</option>
            </select>
          </div>
          <div className="flex-1 min-w-[280px]" />
          <div className="flex items-end gap-2">
            <Button variant="secondary" onClick={() => load(filtersRef.current)}>
              🔄 Actualizar
            </Button>
            <Button variant={syncing ? 'primary' : 'success'} onClick={handleSync} disabled={syncing}
              className={syncing ? 'animate-pulse' : ''}>
              {syncing ? '⏳ Sincronizando...' : '🔄 Sincronizar'}
            </Button>
          </div>
        </div>

        <div className="px-4 pb-4">
          <div className="mb-3 flex items-center gap-2 text-sm text-gray-500">
            <span className="font-medium text-gray-700">Período:</span>
            <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded font-medium">
              {selectedPeriod.type === 'month' 
                ? `${MONTHS[selectedPeriod.month - 1].label} ${selectedPeriod.year}`
                : selectedPeriod.type === 'year' 
                  ? `${selectedPeriod.year}` 
                  : 'Todo el historial'}
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {MONTHS.map(function(m) {
                const isActive = selectedPeriod.type === 'month' && selectedPeriod.month === m.key && selectedPeriod.year === currentYear;
                return (
                  <button
                    key={m.key}
                    onClick={function() { selectMonth(currentYear, m.key); }}
                    className={'px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ' + (isActive ? 'bg-primary text-white shadow-sm scale-[1.02]' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900')}>
                    {m.short}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  showHistory
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}>
                {showHistory ? '▲ Ocultar historial' : '▼ Historial / Años anteriores'}
              </button>
              <button
                onClick={selectAll}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  selectedPeriod.type === 'all'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}>
                Todo
              </button>
            </div>

            {showHistory && (
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-100">
                {pastYears.map(function(y) {
                  const isYearActive = selectedPeriod.type === 'year' && selectedPeriod.year === y;
                  return (
                    <button
                      key={y}
                      onClick={function() { selectYear(y); }}
                      className={'px-3 py-1.5 text-xs font-medium rounded-lg transition-all ' + (isYearActive ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100')}>
                      {y}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-lg text-gray-400 mb-1">📄 No se encontraron comprobantes</p>
          <p className="text-sm text-gray-400">Intenta cambiar el período o estado</p>
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
                  {current.map((inv, i) => {
                    const t = detectType(inv.ncf);
                    return (
                      <tr key={inv.id} className="hover:bg-gray-50 transition-colors fade-in" style={{ animationDelay: `${i * 0.03}s` }}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${t === 'FV' ? 'bg-blue-500' : t === 'NC' ? 'bg-amber-500' : t === 'ND' ? 'bg-red-500' : 'bg-gray-400'}`} />
                            <button onClick={() => setViewerId(inv.id)}
                              className="text-sm font-mono font-medium text-primary hover:text-primary-dark hover:underline cursor-pointer">
                              {inv.ncf || '—'}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{inv.client_name || '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-400">{inv.created_at?.slice(0, 10)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-right">{fmt(calcSubtotal(inv.total, t))}</td>
                        <td className="px-4 py-3 text-sm text-primary text-right">{fmt(calcIva(inv.total, t))}</td>
                        <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">{fmt(calcNet(inv.total, t))}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge color={inv.status === 'Firmado' ? 'success' : inv.status === 'Anulado' ? 'danger' : 'warning'}>
                            {inv.status}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="md:hidden space-y-3">
            {current.map((inv, i) => {
              const t = detectType(inv.ncf);
              return (
                <div key={inv.id} className="bg-white rounded-xl border border-gray-200 p-4 space-y-2 fade-in" style={{ animationDelay: `${i * 0.03}s` }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${t === 'FV' ? 'bg-blue-500' : t === 'NC' ? 'bg-amber-500' : t === 'ND' ? 'bg-red-500' : 'bg-gray-400'}`} />
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
                    <span className="text-gray-600">{fmt(calcSubtotal(inv.total, t))}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">IVA 19%</span>
                    <span className="text-primary">{fmt(calcIva(inv.total, t))}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Total</span>
                    <span className="font-bold text-gray-900">{fmt(calcNet(inv.total, t))}</span>
                  </div>
                </div>
              );
            })}
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