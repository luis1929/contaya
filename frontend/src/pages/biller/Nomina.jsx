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

function monthRange(year, month) {
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const end = new Date(year, month, 0);
  const endStr = `${year}-${String(month).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
  return { desde: start, hasta: endStr };
}

function endOfDay(dateStr) {
  return dateStr ? `${dateStr}T23:59:59` : '';
}

function fmt(n) {
  if (n == null || isNaN(n)) return '$0';
  return '$' + Number(n).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;
const pastYears = Array.from({ length: currentYear - 2023 }, (_, i) => 2024 + i).reverse();

export default function BillerNomina() {
  const [documents, setDocuments] = useState([]);
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
      const params = { doc_type: 'NOM' };
      if (filtersToApply.desde) params.desde = filtersToApply.desde;
      if (filtersToApply.hasta) params.hasta = endOfDay(filtersToApply.hasta);
      if (filtersToApply.estatus) params.estatus = filtersToApply.estatus;

      const data = await api.getInvoices(params);
      setDocuments(data);
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

  const filtered = documents.filter(inv => {
    if (filters.estatus && inv.status !== filters.estatus) return false;
    return true;
  });

  const totalDevengado = filtered.reduce((s, d) => s + (parseFloat(d.total) || 0), 0);

  const totalPages = Math.ceil(filtered.length / perPage);
  const current = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900">Volantes de Nómina</h2>
            <Badge color="info" className="bg-emerald-50 text-emerald-700 border-emerald-200 border text-xs px-2.5">
              NUEVO
            </Badge>
          </div>
          <p className="text-gray-500 mt-0.5 text-sm">
            {documents.length > 0
              ? `${filtered.length} volantes encontrados`
              : 'Descarga y consulta tus volantes de nómina electrónica'}
          </p>
        </div>
        {totalDevengado > 0 && (
          <div className="hidden lg:flex items-center gap-6 bg-gradient-to-r from-emerald-50 to-white rounded-xl border border-emerald-200 px-5 py-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="text-right">
                <p className="text-xs text-emerald-500 uppercase tracking-wider font-semibold">Total Devengado</p>
                <p className="text-base font-bold text-gray-900">{fmt(totalDevengado)}</p>
              </div>
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

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</label>
            <select value={filters.estatus}
              onChange={e => applyFilters({ ...filters, estatus: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400/40 min-w-[160px]">
              <option value="">Todos</option>
              <option value="Firmado">Firmado</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Anulado">Anulado</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px]" />
          <div className="flex items-end gap-2">
            <Button variant="secondary" onClick={() => load(filtersRef.current)} style={{}}>
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
            <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs rounded font-medium">
              {selectedPeriod.type === 'month'
                ? `${MONTHS[selectedPeriod.month - 1].label} ${selectedPeriod.year}`
                : selectedPeriod.type === 'year'
                  ? `${selectedPeriod.year}`
                  : 'Todo el historial'}
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {MONTHS.map(m => (
                <button
                  key={m.key}
                  onClick={() => selectMonth(currentYear, m.key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                    selectedPeriod.type === 'month' && selectedPeriod.month === m.key && selectedPeriod.year === currentYear
                      ? 'bg-emerald-600 text-white shadow-sm scale-[1.02]'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}>
                  {m.short}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  showHistory
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}>
                {showHistory ? '▲ Ocultar historial' : '▼ Historial / Años anteriores'}
              </button>
              <button
                onClick={selectAll}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  selectedPeriod.type === 'all'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}>
                Todo
              </button>
            </div>

            {showHistory && (
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-100">
                {pastYears.map(y => (
                  <button
                    key={y}
                    onClick={() => selectYear(y)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      selectedPeriod.type === 'year' && selectedPeriod.year === y
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}>
                    {y}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="flex justify-center mb-4">
            <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-lg text-gray-400 mb-1">No hay volantes de nómina</p>
          <p className="text-sm text-gray-400">Sincroniza con FacturaTech para descargar tus volantes</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">NCF</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Empleado</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Fecha</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Devengado</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {current.map((doc, i) => (
                    <tr key={doc.id} className="hover:bg-gray-50 transition-colors fade-in" style={{ animationDelay: `${i * 0.03}s` }}>
                      <td className="px-4 py-3">
                        <button onClick={() => setViewerId(doc.id)}
                          className="text-sm font-mono font-medium text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer">
                          {doc.ncf || '—'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{doc.client_name || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-400">{doc.created_at?.slice(0, 10)}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">{fmt(doc.total)}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge color={doc.status === 'Firmado' ? 'success' : doc.status === 'Anulado' ? 'danger' : 'warning'}>
                          {doc.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="md:hidden space-y-3">
            {current.map((doc, i) => (
              <div key={doc.id} className="bg-white rounded-xl border border-gray-200 p-4 space-y-2 fade-in" style={{ animationDelay: `${i * 0.03}s` }}>
                <div className="flex items-center justify-between">
                  <button onClick={() => setViewerId(doc.id)} className="text-emerald-600 font-mono text-sm font-medium hover:underline">
                    {doc.ncf || '—'}
                  </button>
                  <Badge color={doc.status === 'Firmado' ? 'success' : doc.status === 'Anulado' ? 'danger' : 'warning'}>
                    {doc.status}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Empleado</span>
                  <span className="font-medium text-gray-900 text-right">{doc.client_name || '—'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Fecha</span>
                  <span className="text-gray-600">{doc.created_at?.slice(0, 10)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Devengado</span>
                  <span className="font-bold text-emerald-700">{fmt(doc.total)}</span>
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