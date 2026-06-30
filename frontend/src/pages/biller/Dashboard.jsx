import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import StatsCard from '../../components/ui/StatsCard';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

export default function BillerDashboard() {
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState(null);
  const [biller, setBiller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  const load = async () => {
    const [inv, sum, billers] = await Promise.all([
      api.getInvoices(),
      api.getInvoiceSummary(),
      api.getBillers(),
    ]);
    setInvoices(inv);
    setSummary(sum);
    if (billers?.length) setBiller(billers[0]);
  };

  useEffect(() => {
    load().catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleSync = async () => {
    if (!biller) return;
    setSyncing(true);
    setSyncMessage('');
    try {
      await api.syncBiller(biller.id);
      setSyncMessage('Sincronización iniciada. Los datos se actualizarán en breve.');
      setTimeout(() => load().catch(console.error), 5000);
    } catch (err) {
      setSyncMessage('Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setTimeout(() => setSyncing(false), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Panel de Facturación</h2>
          <p className="text-gray-500 mt-1">{invoices.length} facturas encontradas</p>
        </div>
        <div className="flex items-center gap-3">
          {biller && (
            <div className="flex items-center gap-2 text-sm">
              <Badge color={
                biller.scrape_status === 'done' ? 'success' :
                biller.scrape_status === 'running' ? 'warning' :
                biller.scrape_status === 'error' ? 'danger' : 'gray'
              }>
                {biller.scrape_status === 'done' ? '✓ Sincronizado' :
                 biller.scrape_status === 'running' ? '🔄 Sincronizando' :
                 biller.scrape_status === 'error' ? '✗ Error' : '—'}
              </Badge>
              {biller.scrape_last_run && (
                <span className="text-xs text-gray-400">
                  Última sync: {new Date(biller.scrape_last_run).toLocaleString('es-CO')}
                </span>
              )}
            </div>
          )}
          {biller?.credentials_configured && (
            <Button onClick={handleSync} disabled={syncing} size="sm"
              className={syncing ? 'animate-pulse' : ''}>
              {syncing ? '⏳ Sincronizando...' : '⚡ Sincronizar'}
            </Button>
          )}
        </div>
      </div>

      {syncMessage && (
        <div className={`px-4 py-3 rounded-lg text-sm font-medium ${
          syncMessage.startsWith('Error')
            ? 'bg-danger/10 text-danger border border-danger/20'
            : 'bg-success/10 text-success border border-success/20'
        }`}>
          {syncMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatsCard label="Facturas" value={summary?.total_count} icon="📄" color="info" />
      </div>

      {summary?.first_date && (
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-3 text-sm text-gray-500">
          Período: {summary.first_date?.slice(0, 7)} — {summary.last_date?.slice(0, 7)}
        </div>
      )}

      <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
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
              {invoices.slice(0, 20).map((inv, i) => (
                <tr key={inv.id} className="hover:bg-gray-50 transition-colors fade-in" style={{ animationDelay: `${i * 0.03}s` }}>
                  <td className="px-4 py-3 text-sm font-mono text-gray-700">{inv.ncf}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{inv.created_at?.slice(0, 10)}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge color={inv.status === 'Firmado' ? 'success' : 'warning'}>
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
        {invoices.slice(0, 20).map((inv, i) => (
          <div key={inv.id} className="bg-white rounded-xl border border-gray-200 p-4 space-y-2 fade-in" style={{ animationDelay: `${i * 0.03}s` }}>
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm text-gray-700">{inv.ncf}</span>
              <Badge color={inv.status === 'Firmado' ? 'success' : 'warning'}>{inv.status}</Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Fecha</span>
              <span className="text-gray-700">{inv.created_at?.slice(0, 10)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
