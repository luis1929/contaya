import { useState, useEffect } from 'react';
import { api } from '../../services/api';
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
        <p className="text-gray-500 mt-1">{clients.length > 0 && `${clients.length} clientes registrados`}</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client, i) => (
            <div key={client.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 fade-in" style={{ animationDelay: `${i * 0.03}s` }}>
              <h3 className="font-semibold text-gray-900 mb-3">{client.name}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Facturas:</span>
                  <span className="font-medium text-primary">{client.invoice_count || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Facturado:</span>
                  <span className="font-semibold text-gray-900">{fmt(client.total_sum)}</span>
                </div>
                {client.invoice_count > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Promedio:</span>
                    <span className="font-medium text-gray-700">{fmt(client.total_sum / client.invoice_count)}</span>
                  </div>
                )}
                {client.document_number && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">NIT:</span>
                    <span className="font-mono text-xs text-gray-600">{client.document_number}</span>
                  </div>
                )}
                {client.email && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Email:</span>
                    <span className="text-xs text-gray-600">{client.email}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
