import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import Badge from '../../components/ui/Badge';
import StatsCard from '../../components/ui/StatsCard';

function fmt(n) {
  if (n == null) return '$0';
  return '$' + Number(n).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function BillerClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalClients: 0, totalInvoices: 0, totalAmount: 0 });

  useEffect(() => {
    api.getClients()
      .then(data => {
        setClients(data);
        setStats({
          totalClients: data.length,
          totalInvoices: data.reduce((s, c) => s + (c.invoice_count || 0), 0),
          totalAmount: data.reduce((s, c) => s + (c.total_sum || 0), 0),
        });
      })
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
        <h2 className="text-2xl font-bold text-gray-900">Clientes</h2>
        {clients.length > 0 && (
          <p className="text-gray-500 mt-1">{clients.length} clientes registrados</p>
        )}
      </div>

      {clients.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard label="Total Clientes" value={stats.totalClients} icon="👥" color="primary" />
          <StatsCard label="Total Facturas" value={stats.totalInvoices} icon="📄" color="info" />
          <StatsCard label="Total Facturado" value={stats.totalAmount} icon="💰" color="success" format="currency" />
        </div>
      )}

      {clients.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-lg text-gray-400 mb-1">👥 No hay clientes registrados</p>
          <p className="text-sm text-gray-400">Los clientes aparecerán al procesar facturas</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">NIT</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Facturas</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total Facturado</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Régimen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {clients.map((client, i) => (
                  <tr key={client.id} className="hover:bg-gray-50 transition-colors fade-in" style={{ animationDelay: `${i * 0.03}s` }}>
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{client.name}</span>
                      {client.ciudad && <span className="text-xs text-gray-400 ml-2">📍 {client.ciudad}</span>}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">
                      {client.document || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {client.email || '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-primary">{client.invoice_count || 0}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      {fmt(client.total_sum)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {client.regimen ? <Badge color="info">{client.regimen}</Badge> : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
