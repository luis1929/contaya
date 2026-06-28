import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Alert from '../components/ui/Alert';
import InvoiceViewer from '../components/InvoiceViewer';

function fmt(n) {
  if (n == null) return '$0';
  return '$' + Number(n).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Facturas() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [clients, setClients] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [cart, setCart] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [emitting, setEmitting] = useState(false);
  const [alert, setAlert] = useState(null);
  const [result, setResult] = useState(null);
  const [viewerId, setViewerId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');
    Promise.all([
      api.getClients().catch(() => []),
      api.getItems({ limit: 200 }).then(r => r.data || []).catch(() => []),
      api.getInvoices({}).catch(() => []),
    ]).then(([c, i, inv]) => {
      setClients(c);
      setItems(i);
      setInvoices(inv);
    }).finally(() => setLoading(false));
  }, [navigate]);

  const addItem = (item) => {
    setCart(prev => {
      const exists = prev.find(c => c.id === item.id);
      if (exists) return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQty = (id, qty) => {
    if (qty <= 0) return setCart(prev => prev.filter(c => c.id !== id));
    setCart(prev => prev.map(c => c.id === id ? { ...c, quantity: qty } : c));
  };

  const removeItem = (id) => setCart(prev => prev.filter(c => c.id !== id));

  const cartTotals = cart.reduce((acc, item) => {
    const line = (parseFloat(item.unit_value) || 0) * item.quantity;
    const iva = line * ((parseFloat(item.iva_percentage) || 0) / 100);
    const ret = line * ((parseFloat(item.retention_percentage) || 0) / 100);
    return {
      subtotal: acc.subtotal + line,
      iva: acc.iva + iva,
      retenciones: acc.retenciones + ret,
    };
  }, { subtotal: 0, iva: 0, retenciones: 0 });

  const grandTotal = cartTotals.subtotal + cartTotals.iva - cartTotals.retenciones;

  const handleEmitir = async () => {
    if (!selectedClient) { setAlert({ type: 'error', message: 'Selecciona un cliente' }); return; }
    if (!cart.length) { setAlert({ type: 'error', message: 'Agrega al menos un ítem' }); return; }
    setEmitting(true);
    setAlert(null);
    try {
      const payload = {
        client_id: selectedClient.id,
        items: cart.map(c => ({ item_id: c.id, quantity: c.quantity })),
      };
      const res = await api.emitirInvoice(payload);
      setResult(res);
      setAlert({ type: 'success', message: `Factura creada exitosamente${res.credentials_configured ? '. Scraper iniciado.' : '. Sin credenciales FacturaTech configuradas.'}` });
      setCart([]);
      setSelectedClient(null);
      setStep(4);

      api.getInvoices({}).then(setInvoices).catch(() => {});
    } catch (err) {
      setAlert({ type: 'error', message: 'Error al emitir: ' + (err.response?.data?.error || err.message) });
    } finally {
      setEmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {alert && <Alert type={alert.type}>{alert.message}</Alert>}

        <div className="flex gap-2 mb-6">
          {['Cliente', 'Ítems', 'Revisar', 'Resultado'].map((label, i) => (
            <div key={i} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${step === i + 1 ? 'bg-primary text-white' : step > i + 1 ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400'}`}>
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold
                ${step === i + 1 ? 'bg-white text-primary' : step > i + 1 ? 'bg-primary text-white' : 'bg-gray-300 text-white'}">
                {i + 1}
              </span>
              {label}
            </div>
          ))}
        </div>

        {step === 1 && (
          <Card hover={false}>
            <h3 className="font-semibold text-gray-900 mb-4">Seleccionar Cliente</h3>
            {clients.length === 0 ? (
              <p className="text-gray-400 py-4 text-center">No hay clientes registrados. Ve a Registro RUT para agregar uno.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                {clients.map(c => (
                  <div key={c.id} onClick={() => setSelectedClient(c)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all
                      ${selectedClient?.id === c.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'}`}>
                    <p className="font-semibold text-gray-900">{c.name}</p>
                    <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                      {c.document_number && <p>NIT: {c.document_number}{c.verification_digit ? '-' + c.verification_digit : ''}</p>}
                      {c.ciudad && <p>📍 {c.ciudad}</p>}
                      {c.email && <p>✉ {c.email}</p>}
                      {c.regimen && <Badge color="info">{c.regimen}</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end mt-4 pt-4 border-t border-gray-100">
              <Button onClick={() => setStep(2)} disabled={!selectedClient}>
                Continuar →
              </Button>
            </div>
          </Card>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <Card hover={false}>
              <h3 className="font-semibold text-gray-900 mb-4">Agregar Ítems</h3>
              {items.length === 0 ? (
                <p className="text-gray-400 py-4 text-center">No hay productos/servicios. Ve a Productos para agregarlos.</p>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {items.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-gray-300">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900">{item.description}</p>
                        <p className="text-xs text-gray-400">
                          <span className="font-mono">{item.code}</span>
                          {item.unspsc_code && <span className="ml-2">UNSPSC: {item.unspsc_code}</span>}
                          <span className="ml-2">· {fmt(item.unit_value)}</span>
                          <span className="ml-2">· IVA {item.iva_percentage}%</span>
                        </p>
                      </div>
                      <Badge color={item.type === 'servicio' ? 'info' : 'gray'}>{item.type}</Badge>
                      <Button size="sm" className="ml-3" onClick={() => addItem(item)}>+ Agregar</Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {cart.length > 0 && (
              <Card hover={false}>
                <h3 className="font-semibold text-gray-900 mb-3">Carrito ({cart.length} ítems)</h3>
                <div className="space-y-2">
                  {cart.map(item => {
                    const lineTotal = (parseFloat(item.unit_value) || 0) * item.quantity;
                    return (
                      <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{item.description}</p>
                          <p className="text-xs text-gray-400">{fmt(item.unit_value)} c/u</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center border border-gray-300 rounded-lg">
                            <button onClick={() => updateQty(item.id, item.quantity - 1)}
                              className="px-2 py-1 text-gray-500 hover:text-gray-700 text-sm">−</button>
                            <span className="px-3 py-1 text-sm font-medium text-gray-900 min-w-[2rem] text-center">{item.quantity}</span>
                            <button onClick={() => updateQty(item.id, item.quantity + 1)}
                              className="px-2 py-1 text-gray-500 hover:text-gray-700 text-sm">+</button>
                          </div>
                          <span className="text-sm font-semibold text-gray-900 w-24 text-right">{fmt(lineTotal)}</span>
                          <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-danger text-sm">✕</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            <div className="flex justify-between">
              <Button variant="secondary" onClick={() => setStep(1)}>← Cliente</Button>
              <Button onClick={() => setStep(3)} disabled={!cart.length}>Revisar →</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            {selectedClient && (
              <Card hover={false}>
                <h3 className="font-semibold text-gray-900 mb-3">Cliente</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div><span className="text-gray-500">Razón Social:</span><p className="font-medium">{selectedClient.name}</p></div>
                  <div><span className="text-gray-500">NIT:</span><p className="font-mono">{selectedClient.document_number}{selectedClient.verification_digit ? '-' + selectedClient.verification_digit : ''}</p></div>
                  <div><span className="text-gray-500">Dirección:</span><p>{selectedClient.address || '—'}</p></div>
                  <div><span className="text-gray-500">Ciudad:</span><p>{selectedClient.ciudad || '—'}</p></div>
                </div>
              </Card>
            )}

            <Card hover={false}>
              <h3 className="font-semibold text-gray-900 mb-3">Ítems</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-gray-500">
                      <th className="py-2 pr-4 font-medium">Código</th>
                      <th className="py-2 pr-4 font-medium">Descripción</th>
                      <th className="py-2 pr-4 font-medium text-right">Cant.</th>
                      <th className="py-2 pr-4 font-medium text-right">Vr. Unitario</th>
                      <th className="py-2 pr-4 font-medium text-right">IVA</th>
                      <th className="py-2 pr-4 font-medium text-right">Ret.</th>
                      <th className="py-2 font-medium text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map(item => {
                      const lineTotal = (parseFloat(item.unit_value) || 0) * item.quantity;
                      return (
                        <tr key={item.id} className="border-b border-gray-50">
                          <td className="py-2 pr-4 font-mono text-xs">{item.code}</td>
                          <td className="py-2 pr-4">{item.description}</td>
                          <td className="py-2 pr-4 text-right">{item.quantity}</td>
                          <td className="py-2 pr-4 text-right font-mono">{fmt(item.unit_value)}</td>
                          <td className="py-2 pr-4 text-right text-primary">{item.iva_percentage}%</td>
                          <td className="py-2 pr-4 text-right text-amber-600">{item.retention_percentage}%</td>
                          <td className="py-2 pr-4 text-right font-semibold">{fmt(lineTotal)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card hover={false}>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium">{fmt(cartTotals.subtotal)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">IVA</span>
                  <span className="font-medium text-primary">{fmt(cartTotals.iva)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">Retenciones</span>
                  <span className="font-medium text-amber-600">−{fmt(cartTotals.retenciones)}</span>
                </div>
                <div className="flex justify-between py-2 border-t border-gray-200 text-base">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-bold text-2xl text-primary">{fmt(grandTotal)}</span>
                </div>
              </div>
            </Card>

            <div className="flex justify-between">
              <Button variant="secondary" onClick={() => setStep(2)}>← Ítems</Button>
              <Button onClick={handleEmitir} disabled={emitting}>
                {emitting ? 'Emitiendo...' : '🚀 Emitir Factura'}
              </Button>
            </div>
          </div>
        )}

        {step === 4 && result && (
          <Card hover={false}>
            <div className="text-center py-6">
              <div className="text-5xl mb-4">✅</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Factura Generada</h3>
              <p className="text-gray-500 mb-6">ID: <span className="font-mono text-primary">{result.invoice.id}</span></p>

              <div className="max-w-md mx-auto space-y-3 text-left">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Cliente</p>
                  <p className="font-semibold">{result.consolidated.cliente.name}</p>
                  <p className="text-sm text-gray-500">{result.consolidated.cliente.document_number}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Totales</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between"><span>Subtotal</span><span>{fmt(result.consolidated.totals.subtotal)}</span></div>
                    <div className="flex justify-between"><span>IVA</span><span className="text-primary">{fmt(result.consolidated.totals.iva)}</span></div>
                    <div className="flex justify-between font-bold border-t border-gray-200 pt-1"><span>Total</span><span>{fmt(result.consolidated.totals.total)}</span></div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Ítems</p>
                  <p className="text-sm">{result.consolidated.items.length} ítems</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Estado</p>
                  <Badge color={result.credentials_configured ? 'success' : 'warning'}>
                    {result.credentials_configured ? 'Scraper iniciado' : 'Sin credenciales scraper'}
                  </Badge>
                </div>
              </div>
            </div>
          </Card>
        )}

        <Card hover={false}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Facturas emitidas</h3>
            <span className="text-sm text-gray-400">{invoices.length} registros</span>
          </div>
          {invoices.length === 0 ? (
            <p className="text-gray-400 py-4 text-center">No hay facturas aún</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500">
                    <th className="py-2 pr-4 font-medium">NCF</th>
                    <th className="py-2 pr-4 font-medium">Cliente</th>
                    <th className="py-2 pr-4 font-medium">Fecha</th>
                    <th className="py-2 pr-4 font-medium text-right">Total</th>
                    <th className="py-2 font-medium text-center">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.slice(0, 10).map(inv => (
                    <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2 pr-4 font-mono text-xs">
                        <button onClick={() => setViewerId(inv.id)}
                          className="text-primary hover:text-primary-dark hover:underline cursor-pointer">
                          {inv.ncf || '—'}
                        </button>
                      </td>
                      <td className="py-2 pr-4 font-medium">{inv.client_name || '—'}</td>
                      <td className="py-2 pr-4 text-gray-500">{inv.created_at?.slice(0, 10)}</td>
                      <td className="py-2 pr-4 text-right font-semibold">{fmt(inv.total)}</td>
                      <td className="py-2 text-center">
                        <Badge color={inv.status === 'Firmado' ? 'success' : inv.status === 'draft' ? 'warning' : 'gray'}>
                          {inv.status === 'draft' ? 'Borrador' : inv.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {viewerId && <InvoiceViewer invoiceId={viewerId} onClose={() => setViewerId(null)} />}
    </div>
  );
}
