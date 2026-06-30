import { useState, useEffect } from 'react';
import { api } from '../../services/api';

export default function BillerClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getClientList()
      .then(setClients)
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Clientes</h2>
          {clients.length > 0 && (
            <p className="text-gray-500 mt-1">{clients.length} clientes encontrados</p>
          )}
        </div>
      </div>

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
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Facturas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {clients.map((client, i) => (
                  <tr key={client.name} className="hover:bg-gray-50 transition-colors fade-in" style={{ animationDelay: `${i * 0.03}s` }}>
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{client.name}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right">{client.count}</td>
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
