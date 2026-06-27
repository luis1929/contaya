import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import StatsCard from '../../components/ui/StatsCard';
import Badge from '../../components/ui/Badge';

function fmt(n) {
  if (n == null) return '$0';
  return '$' + Number(n).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function BillerDashboard() {
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getInvoices(), api.getInvoiceSummary()])
      .then(([inv, sum]) => { setInvoices(inv); setSummary(sum); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Panel de Facturación</h2>
        <p className="text-gray-500 mt-1">{invoices.length} facturas encontradas</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Total Facturado" value={summary?.total_sum} icon="💰" color="primary" format="currency" />
        <StatsCard label="Facturas" value={summary?.total_count} icon="📄" color="info" />
        <StatsCard label="Promedio" value={summary?.total_avg} icon="📊" color="warning" format="currency" />
        <StatsCard label="Pagadas" value={summary?.paid_count} icon="✅" color="success" />
      </div>

      {summary?.first_date && (
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-3 text-sm text-gray-500">
          Período: {summary.first_date?.slice(0, 7)} — {summary.last_date?.slice(0, 7)}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">NCF</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Pagado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.slice(0, 20).map((inv, i) => (
                <tr key={inv.id} className="hover:bg-gray-50 transition-colors fade-in" style={{ animationDelay: `${i * 0.03}s` }}>
                  <td className="px-4 py-3 text-sm font-mono text-gray-700">{inv.ncf}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <div className="font-medium">{inv.client_name || (inv.client || '').split('...')[0]}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{inv.created_at?.slice(0, 10)}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">{fmt(inv.total)}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge color={inv.status === 'Firmado' ? 'success' : 'warning'}>
                      {inv.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center text-sm">
                    <span className={inv.paid ? 'text-success font-medium' : 'text-gray-400'}>
                      {inv.paid ? 'Sí' : 'No'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
