import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';

const tabs = [
  { id: 'products', label: 'Productos Más Vendidos' },
  { id: 'monthly', label: 'Ventas por Mes' },
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
  const [activeTab, setActiveTab] = useState('products');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [monthlySales, setMonthlySales] = useState([]);
  const [productClients, setProductClients] = useState([]);
  const [clientProducts, setClientProducts] = useState([]);
  const [relations, setRelations] = useState([]);
  const [selectedCode, setSelectedCode] = useState(null);
  const [selectedClient, setSelectedClient] = useState('');
  const [searchClient, setSearchClient] = useState('');

  const loadStats = useCallback(async () => {
    try {
      const data = await api.getAnalyticsStats();
      setStats(data);
    } catch {}
  }, []);

  const loadTopProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getTopProducts({ limit: 30 });
      setTopProducts(data);
    } catch {}
    setLoading(false);
  }, []);

  const loadMonthlySales = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getMonthlySales({});
      setMonthlySales(data);
    } catch {}
    setLoading(false);
  }, []);

  const loadClientProducts = useCallback(async (client) => {
    setLoading(true);
    try {
      const data = await api.getClientProducts({ client });
      setClientProducts(data);
    } catch {}
    setLoading(false);
  }, []);

  const loadRelations = useCallback(async (code) => {
    const { data } = await api.getProductRelations({ code });
    setRelations(data);
  }, []);

  const loadProductClients = useCallback(async (code) => {
    setLoading(true);
    try {
      const data = await api.getProductClients({ code });
      setProductClients(data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  useEffect(() => {
    if (activeTab === 'products') loadTopProducts();
    else if (activeTab === 'monthly') loadMonthlySales();
    else if (activeTab === 'clients') { if (searchClient) loadClientProducts(searchClient); else setLoading(false); }
    else if (activeTab === 'relations') setLoading(false);
  }, [activeTab, searchClient, loadTopProducts, loadMonthlySales, loadClientProducts]);

  const handleSelectProduct = async (code) => {
    setSelectedCode(code);
    await loadProductClients(code);
    await loadRelations(code);
  };

  const handleSearchClient = () => {
    if (searchClient.trim()) loadClientProducts(searchClient.trim());
  };

  const maxQty = topProducts.length > 0 ? Math.max(...topProducts.map(p => parseFloat(p.total_qty))) : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analítica de Productos</h2>
          <p className="text-gray-500 mt-1 text-sm">Productos más vendidos, tendencias mensuales y relaciones</p>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase font-semibold">Productos</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{fmtNum(stats.total_products)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase font-semibold">Facturas con Items</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{fmtNum(stats.invoices_with_items)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase font-semibold">Líneas de Items</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{fmtNum(stats.total_line_items)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase font-semibold">Valor Total</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{fmt(stats.total_value)}</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        {tabs.map(t => (
          <TabButton key={t.id} tab={t} active={activeTab === t.id} onClick={() => setActiveTab(t.id)} />
        ))}
      </div>

      {activeTab === 'products' && (
        loading ? <Loading /> : (
          <div className="space-y-4">
            {selectedCode && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-blue-900">Producto: {selectedCode}</h3>
                  <button onClick={() => { setSelectedCode(null); setProductClients([]); setRelations([]); }}
                    className="text-sm text-blue-600 hover:underline">Cerrar</button>
                </div>
                {productClients.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-blue-700 uppercase mb-2">Clientes que más lo compran</p>
                    <div className="hidden md:block bg-white rounded-lg border border-blue-100 overflow-hidden">
                      <table className="w-full text-xs">
                        <thead><tr className="bg-blue-50"><th className="px-3 py-2 text-left">Cliente</th><th className="px-3 py-2 text-right">Cantidad</th><th className="px-3 py-2 text-right">Valor</th></tr></thead>
                        <tbody className="divide-y divide-blue-50">
                          {productClients.map(pc => (
                            <tr key={pc.client_name} className="hover:bg-blue-50/50">
                              <td className="px-3 py-2">{pc.client_name}</td>
                              <td className="px-3 py-2 text-right">{fmtNum(pc.total_qty)}</td>
                              <td className="px-3 py-2 text-right">{fmt(pc.total_value)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="md:hidden space-y-1">
                      {productClients.map(pc => (
                        <div key={pc.client_name} className="bg-white rounded-lg border border-blue-100 px-3 py-2 flex justify-between text-xs">
                          <span className="font-medium">{pc.client_name}</span>
                          <span>{fmtNum(pc.total_qty)} unidades</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {relations.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-blue-700 uppercase mb-2">Productos comprados juntos</p>
                    <div className="bg-white rounded-lg border border-blue-100 overflow-hidden">
                      <table className="w-full text-xs">
                        <thead><tr className="bg-blue-50"><th className="px-3 py-2 text-left">Producto</th><th className="px-3 py-2 text-right">Veces juntos</th><th className="px-3 py-2 text-right">Cantidad</th></tr></thead>
                        <tbody className="divide-y divide-blue-50">
                          {relations.map(r => (
                            <tr key={r.code} className="hover:bg-blue-50/50">
                              <td className="px-3 py-2">{r.description || r.code}</td>
                              <td className="px-3 py-2 text-right">{r.together_count}</td>
                              <td className="px-3 py-2 text-right">{fmtNum(r.total_qty)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Código</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Descripción</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Cantidad</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Valor Total</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Facturas</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Clientes</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Distribución</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {topProducts.map((p, i) => (
                    <tr key={p.code || i} onClick={() => handleSelectProduct(p.code)}
                      className={`hover:bg-gray-50 transition-colors cursor-pointer ${selectedCode === p.code ? 'bg-blue-50' : ''}`}>
                      <td className="px-4 py-3 text-sm text-gray-400">{i + 1}</td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-700">{p.code}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">{p.description}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">{fmtNum(p.total_qty)}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">{fmt(p.total_value)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-right">{p.invoice_count}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-right">{p.client_count}</td>
                      <td className="px-4 py-3">
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${(parseFloat(p.total_qty) / maxQty) * 100}%` }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="md:hidden space-y-2">
              {topProducts.map((p, i) => (
                <div key={p.code || i} onClick={() => handleSelectProduct(p.code)}
                  className={`bg-white rounded-xl border p-4 space-y-2 cursor-pointer ${selectedCode === p.code ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">#{i + 1}</span>
                    <span className="text-xs font-mono text-gray-500">{p.code}</span>
                  </div>
                  <p className="font-medium text-sm text-gray-900">{p.description}</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{fmtNum(p.total_qty)} unidades</span>
                    <span className="font-semibold text-gray-900">{fmt(p.total_value)}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${(parseFloat(p.total_qty) / maxQty) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {activeTab === 'monthly' && (
        loading ? <Loading /> : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Período</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Facturas</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Unidades</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Valor Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {monthlySales.map((m, i) => (
                  <tr key={m.period} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{m.period}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right">{m.invoice_count}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right">{fmtNum(m.total_qty)}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">{fmt(m.total_value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

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
          <p className="text-sm text-gray-500">Seleccione un producto en la pestaña "Productos Más Vendidos" para ver qué otros productos se compran junto con él.</p>
        </div>
      )}
    </div>
  );
}
