import { useState, useEffect } from 'react';
import { api } from '../services/api';
import Badge from './ui/Badge';
import Button from './ui/Button';

function fmt(n) {
  if (n == null) return '$0';
  return '$' + Number(n).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parsePayload(payload) {
  if (!payload) return null;
  if (typeof payload === 'string') {
    try { return JSON.parse(payload); } catch { return null; }
  }
  return payload;
}

function parseRawData(raw) {
  if (!raw) return null;
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return null; }
  }
  return raw;
}

function InvoiceHeader({ invoice }) {
  const statusColor = invoice.status === 'Firmado' ? 'success'
    : invoice.status === 'draft' ? 'warning'
    : invoice.status === 'Anulado' ? 'danger' : 'gray';

  return (
    <div className="flex items-start justify-between mb-6 pb-4 border-b border-gray-200">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h3 className="text-xl font-bold text-gray-900">Factura Electrónica</h3>
          <Badge color={statusColor}>{invoice.status || '—'}</Badge>
        </div>
        {invoice.ncf && (
          <p className="text-sm font-mono text-primary font-semibold">{invoice.ncf}</p>
        )}
        <p className="text-xs text-gray-400 mt-1">
          {invoice.created_at && new Date(invoice.created_at).toLocaleString('es-CO')}
        </p>
      </div>
      <div className="text-right">
        <p className="text-xs text-gray-500">Total</p>
        <p className="text-2xl font-bold text-gray-900">{fmt(invoice.total)}</p>
      </div>
    </div>
  );
}

function SectionBlock({ title, children, className = '' }) {
  return (
    <div className={`mb-4 pb-4 border-b border-gray-100 ${className}`}>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{title}</p>
      {children}
    </div>
  );
}

function DataRow({ label, value }) {
  return (
    <div className="flex justify-between py-0.5">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right">{value || '—'}</span>
    </div>
  );
}

function InvoiceViewerContent({ invoice, payload, rawData }) {
  const cliente = payload?.cliente || null;
  const items = payload?.items || invoice.items || [];
  const totals = payload?.totals || null;

  return (
    <div className="space-y-1">
      <InvoiceHeader invoice={invoice} />

      {cliente && (
        <SectionBlock title="Cliente">
          <p className="font-semibold text-gray-900">{cliente.name}</p>
          <div className="grid grid-cols-2 gap-x-4 text-sm mt-1">
            <DataRow label="NIT" value={cliente.document_number + (cliente.verification_digit ? '-' + cliente.verification_digit : '')} />
            <DataRow label="Régimen" value={cliente.regimen} />
            <DataRow label="Dirección" value={cliente.address} />
            <DataRow label="Ciudad" value={cliente.ciudad} />
            <DataRow label="Email" value={cliente.email} />
            <DataRow label="Teléfono" value={cliente.phone} />
          </div>
        </SectionBlock>
      )}

      {rawData && !cliente && (
        <SectionBlock title="Cliente">
          <p className="font-semibold text-gray-900">{rawData.cliente || invoice.client_name}</p>
          {rawData.numeracion && <DataRow label="NCF" value={rawData.numeracion} />}
          {rawData.fecha && <DataRow label="Fecha" value={rawData.fecha} />}
        </SectionBlock>
      )}

      {!cliente && !rawData && invoice.client_name && (
        <SectionBlock title="Cliente">
          <p className="font-semibold text-gray-900">{invoice.client_name}</p>
        </SectionBlock>
      )}

      <SectionBlock title="Items">
        {items.length === 0 ? (
          <p className="text-sm text-gray-400">Sin detalle de ítems</p>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500">
                    <th className="py-2 pr-3 font-medium">Código</th>
                    <th className="py-2 pr-3 font-medium">Descripción</th>
                    <th className="py-2 pr-3 font-medium text-right">Cant</th>
                    <th className="py-2 pr-3 font-medium text-right">Vr Unit</th>
                    <th className="py-2 pr-3 font-medium text-right">IVA</th>
                    <th className="py-2 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => {
                    const qty = item.quantity || 1;
                    const unitPrice = item.unit_price || item.unit_value || 0;
                    const lineTotal = item.total || (qty * unitPrice);
                    return (
                      <tr key={i} className="border-b border-gray-50">
                        <td className="py-2 pr-3 font-mono text-xs">{item.code || '—'}</td>
                        <td className="py-2 pr-3 font-medium text-gray-900">{item.description}</td>
                        <td className="py-2 pr-3 text-right">{qty}</td>
                        <td className="py-2 pr-3 text-right font-mono">{fmt(unitPrice)}</td>
                        <td className="py-2 pr-3 text-right text-primary">{item.iva_percentage || 0}%</td>
                        <td className="py-2 pr-3 text-right font-semibold">{fmt(lineTotal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="md:hidden space-y-2">
              {items.map((item, i) => {
                const qty = item.quantity || 1;
                const unitPrice = item.unit_price || item.unit_value || 0;
                const lineTotal = item.total || (qty * unitPrice);
                return (
                  <div key={i} className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{item.description}</p>
                        {item.code && <p className="font-mono text-xs text-gray-400">{item.code}</p>}
                      </div>
                      <span className="font-semibold">{fmt(lineTotal)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Cant: {qty}</span>
                      <span>Vr Unit: {fmt(unitPrice)}</span>
                      <span>IVA: {item.iva_percentage || 0}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </SectionBlock>

      <SectionBlock title="Totales" className="border-b-0">
        <div className="max-w-xs ml-auto space-y-1">
          <DataRow label="Subtotal" value={fmt(totals?.subtotal || invoice.total / 1.19)} />
          <DataRow label="IVA" value={fmt(totals?.iva || invoice.total * 0.19)} />
          {totals?.retenciones > 0 && <DataRow label="Retenciones" value={`-${fmt(totals.retenciones)}`} />}
          <div className="flex justify-between pt-2 border-t border-gray-200">
            <span className="font-bold text-gray-900">Total</span>
            <span className="font-bold text-xl text-primary">{fmt(invoice.total)}</span>
          </div>
        </div>
      </SectionBlock>

      {invoice.xml_content && (
        <SectionBlock title="XML Datos">
          <details>
            <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">Ver XML crudo</summary>
            <pre className="mt-2 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg max-h-48 overflow-y-auto font-mono whitespace-pre-wrap">
              {invoice.xml_content.substring(0, 2000)}
              {invoice.xml_content.length > 2000 ? '...' : ''}
            </pre>
          </details>
        </SectionBlock>
      )}

      <div className="flex gap-2 pt-4 border-t border-gray-200">
        {invoice.has_pdf && invoice.document_path && (
          <a href={invoice.document_path} download
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">
            📄 Descargar PDF
          </a>
        )}
        {invoice.has_xml && invoice.xml_content && (
          <button onClick={() => {
            const blob = new Blob([invoice.xml_content], { type: 'application/xml' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `${invoice.ncf || 'invoice'}.xml`; a.click();
            URL.revokeObjectURL(url);
          }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
            📋 Descargar XML
          </button>
        )}
      </div>
    </div>
  );
}

export default function InvoiceViewer({ invoiceId, onClose }) {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!invoiceId) return;
    setLoading(true);
    api.getInvoice(invoiceId)
      .then(data => setInvoice(data))
      .catch(err => setError(err.response?.data?.error || 'Error al cargar factura'))
      .finally(() => setLoading(false));
  }, [invoiceId]);

  if (!invoiceId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 overflow-y-auto bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h2 className="font-semibold text-gray-900">Detalle de Factura</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-danger font-medium">{error}</p>
              <Button variant="secondary" size="sm" className="mt-3" onClick={onClose}>Cerrar</Button>
            </div>
          ) : invoice ? (
            <InvoiceViewerContent
              invoice={invoice}
              payload={parsePayload(invoice.payload)}
              rawData={parseRawData(invoice.raw_data)}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
