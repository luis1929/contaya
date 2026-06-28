import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import InvoiceViewer from '../components/InvoiceViewer';

function fmt(n) {
  if (n == null) return '$0';
  return '$' + Number(n).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Facturas() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [viewerId, setViewerId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');
    api.getClients().then(setClients).catch(() => setClients([]))
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleClientSelect = (client) => {
    setSelectedClient(client);
    setLoadingInvoices(true);
    api.getInvoices({ client_id: client.id })
      .then(setInvoices)
      .catch(() => setInvoices([]))
      .finally(() => setLoadingInvoices(false));
  };

  const handleBack = () => {
    setSelectedClient(null);
    setInvoices([]);
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
      <Card hover={false}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Seleccionar Cliente</h3>
          {selectedClient && (
            <Button variant="secondary" size="sm" onClick={handleBack}>
              ← Cambiar cliente
            </Button>
          )}
        </div>
        {clients.length === 0 ? (
          <p className="text-gray-400 py-4 text-center">No hay clientes registrados. Ve a Registro RUT para agregar uno.</p>
        ) : selectedClient ? (
          <div className="p-4 rounded-xl border-2 border-primary bg-primary/5">
            <p className="font-semibold text-gray-900">{selectedClient.name}</p>
            <div className="text-xs text-gray-500 mt-1 space-y-0.5">
              {selectedClient.document_number && <p>NIT: {selectedClient.document_number}{selectedClient.verification_digit ? '-' + selectedClient.verification_digit : ''}</p>}
              {selectedClient.ciudad && <p>📍 {selectedClient.ciudad}</p>}
              {selectedClient.email && <p>✉ {selectedClient.email}</p>}
              {selectedClient.regimen && <Badge color="info">{selectedClient.regimen}</Badge>}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
            {clients.map(c => (
              <div key={c.id} onClick={() => handleClientSelect(c)}
                className="p-4 rounded-xl border-2 border-gray-200 cursor-pointer transition-all hover:border-gray-300 hover:shadow-sm">
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
      </Card>

      {selectedClient && (
        <Card hover={false}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Facturas de {selectedClient.name}</h3>
            <span className="text-sm text-gray-400">{invoices.length} registros</span>
          </div>
          {loadingInvoices ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : invoices.length === 0 ? (
            <p className="text-gray-400 py-4 text-center">No hay facturas para este cliente</p>
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
                  {invoices.map(inv => (
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
      )}

      {viewerId && <InvoiceViewer invoiceId={viewerId} onClose={() => setViewerId(null)} />}
    </div>
  );
}
