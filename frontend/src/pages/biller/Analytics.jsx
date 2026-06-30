import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';

const tabs = [
  { id: 'clients', label: 'Productos por Cliente' },
  { id: 'relations', label: 'Relaciones entre Productos' },
];

function fmt(n) {
  if (n == null) return '$0';
  return '$' + Number(n).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtNum(n) {
  if (n == null) return '0';
  return Number(n).toLocaleString('es-CO');
}

function Loading() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
    </div>
  );
}

function TabButton({ tab, active, onClick }) {
  return (
    <button onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${active ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
      {tab.label}
    </button>
  );
}

export default function BillerAnalytics() {
  const [activeTab, setActiveTab] = useState('clients');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [clientProducts, setClientProducts] = useState([]);
  const [searchClient, setSearchClient] = useState('');

  const loadStats = useCallback(async () => {
    try {
      const data = await api.getAnalyticsStats();
      setStats(data);
    } catch {}
  }, []);

  const loadClientProducts = useCallback(async (client) => {
    setLoading(true);
    try {
      const data = await api.getClientProducts({ client });
      setClientProducts(data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  useEffect(() => {
    if (activeTab === 'clients') { if (searchClient) loadClientProducts(searchClient); else setLoading(false); }
    else if (activeTab === 'relations') setLoading(false);
  }, [activeTab, searchClient, loadClientProducts]);

  const handleSearchClient = () => {
    if (searchClient.trim()) loadClientProducts(searchClient.trim());
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analítica de Productos</h2>
          <p className="text-gray-500 mt-1 text-sm">Productos por cliente y relaciones</p>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase font-semibold">Productos</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{fmtNum(stats.total_products)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase font-semibold">Facturas (FV)</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{fmt(stats.invoice_value)}</p>
            <p className="text-xs text-gray-400 mt-0.5">{stats.invoice_count} facturas</p>
          </div>
          <div className="bg-white rounded-xl border border-orange-200 p-4">
            <p className="text-xs text-orange-600 uppercase font-semibold">Notas Crédito (NC)</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">{fmt(stats.credit_note_value)}</p>
            <p className="text-xs text-orange-400 mt-0.5">{stats.credit_note_count} notas</p>
          </div>
          <div className="bg-white rounded-xl border border-red-200 p-4">
            <p className="text-xs text-red-600 uppercase font-semibold">Notas Débito (ND)</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{fmt(stats.debit_note_value)}</p>
            <p className="text-xs text-red-400 mt-0.5">{stats.debit_note_count} notas</p>
          </div>
          <div className="bg-white rounded-xl border border-green-300 bg-green-50/50 p-4">
            <p className="text-xs text-green-700 uppercase font-semibold">Total Neto Vendido</p>
            <p className="text-2xl font-bold text-green-700 mt-1">{fmt(stats.net_value)}</p>
            <p className="text-xs text-green-500 mt-0.5">{stats.invoices_with_items} comprobantes</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        {tabs.map(t => (
          <TabButton key={t.id} tab={t} active={activeTab === t.id} onClick={() => setActiveTab(t.id)} />
        ))}
      </div>

      {activeTab === 'clients' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input type="text" placeholder="Buscar cliente..."
              value={searchClient} onChange={e => setSearchClient(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearchClient()}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button onClick={handleSearchClient}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
              Buscar
            </button>
          </div>
          {loading ? <Loading /> : clientProducts.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">Ingrese un cliente para ver sus productos</p>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Código</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Descripción</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Cantidad</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Valor</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Pedidos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {clientProducts.map(p => (
                    <tr key={p.code} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-mono text-gray-700">{p.code}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{p.description}</td>
                      <td className="px-4 py-3 text-sm text-right">{fmtNum(p.total_qty)}</td>
                      <td className="px-4 py-3 text-sm font-medium text-right">{fmt(p.total_value)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-right">{p.order_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'relations' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Use la pestaña "Productos por Cliente" para explorar relaciones entre productos.</p>
        </div>
      )}
    </div>
  );
}
