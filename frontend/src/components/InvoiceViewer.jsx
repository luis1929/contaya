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

function StatusBadge({ status }) {
  const color = status === 'Firmado' ? 'success'
    : status === 'draft' ? 'warning'
    : status === 'Anulado' ? 'danger' : 'gray';
  return <Badge color={color}>{status || '—'}</Badge>;
}

function InvoicePaper({ children }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
      {children}
    </div>
  );
}

function SectionDivider() {
  return <div className="border-t border-dashed border-gray-200 my-0" />;
}

function InvoiceViewerContent({ invoice, payload, rawData }) {
  const cliente = payload?.cliente || null;
  const emisor = payload?.emisor || null;
  const totals = payload?.totals || null;
  const items = payload?.items || invoice.items || [];
  const docLabel = invoice.doc_type === 'NC' ? 'Nota Crédito Electrónica'
    : invoice.doc_type === 'ND' ? 'Nota Débito Electrónica'
    : 'Factura Electrónica';

  return (
    <div className="space-y-0">
      {/* === HEADER: Biller left, invoice details right === */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-lg font-bold text-gray-900">{invoice.biller_name || '—'}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {invoice.biller_doc_number && `NIT: ${invoice.biller_doc_number}`}
            </p>
          </div>
          <div className="sm:text-right flex-shrink-0">
            <div className="flex items-center gap-2 sm:justify-end">
              <p className="text-sm font-semibold text-gray-800">{docLabel}</p>
              <StatusBadge status={invoice.status} />
            </div>
            <p className="text-sm font-mono text-primary font-semibold mt-1">{invoice.ncf || '—'}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {invoice.created_at && new Date(invoice.created_at).toLocaleString('es-CO')}
            </p>
          </div>
        </div>
      </div>

      <SectionDivider />

      {/* === CLIENT INFO === */}
      <div className="px-6 py-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Cliente</p>
        {cliente ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1 text-sm">
            <div className="col-span-2 sm:col-span-3">
              <span className="font-semibold text-gray-900">{cliente.name}</span>
            </div>
            <div>
              <span className="text-gray-500">NIT:</span>{' '}
              <span className="font-medium text-gray-900">
                {cliente.document_number}{cliente.verification_digit ? `-${cliente.verification_digit}` : ''}
              </span>
            </div>
            {cliente.regimen && <div>
              <span className="text-gray-500">Régimen:</span>{' '}
              <span className="font-medium text-gray-900">{cliente.regimen}</span>
            </div>}
            {cliente.address && <div>
              <span className="text-gray-500">Dir:</span>{' '}
              <span className="font-medium text-gray-900">{cliente.address}</span>
            </div>}
            {cliente.ciudad && <div>
              <span className="text-gray-500">Ciudad:</span>{' '}
              <span className="font-medium text-gray-900">{cliente.ciudad}</span>
            </div>}
            {cliente.email && <div>
              <span className="text-gray-500">Email:</span>{' '}
              <span className="font-medium text-gray-900">{cliente.email}</span>
            </div>}
            {cliente.phone && <div>
              <span className="text-gray-500">Tel:</span>{' '}
              <span className="font-medium text-gray-900">{cliente.phone}</span>
            </div>}
          </div>
        ) : (
          <p className="font-semibold text-gray-900 text-sm">
            {rawData?.cliente || invoice.client_name || '—'}
          </p>
        )}
      </div>

      <SectionDivider />

      {/* === ITEMS TABLE === */}
      <div className="px-6 py-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Detalle</p>
        {items.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">Sin detalle de ítems</p>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-300 text-left text-gray-500">
                    <th className="py-2 pr-3 font-semibold text-xs uppercase tracking-wider">Código</th>
                    <th className="py-2 pr-3 font-semibold text-xs uppercase tracking-wider">Descripción</th>
                    <th className="py-2 pr-3 font-semibold text-xs uppercase tracking-wider text-right">Cant</th>
                    <th className="py-2 pr-3 font-semibold text-xs uppercase tracking-wider text-right">Vr Unit</th>
                    <th className="py-2 pr-3 font-semibold text-xs uppercase tracking-wider text-right">IVA %</th>
                    <th className="py-2 font-semibold text-xs uppercase tracking-wider text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => {
                    const qty = item.quantity || 1;
                    const unitPrice = item.unit_price || item.unit_value || 0;
                    const lineTotal = item.total || (qty * unitPrice);
                    return (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                        <td className="py-2.5 pr-3 font-mono text-xs text-gray-600">{item.code || '—'}</td>
                        <td className="py-2.5 pr-3 font-medium text-gray-900">{item.description}</td>
                        <td className="py-2.5 pr-3 text-right text-gray-700">{qty}</td>
                        <td className="py-2.5 pr-3 text-right font-mono text-gray-700">{fmt(unitPrice)}</td>
                        <td className="py-2.5 pr-3 text-right text-primary font-medium">{item.iva_percentage || 0}%</td>
                        <td className="py-2.5 pr-3 text-right font-semibold text-gray-900">{fmt(lineTotal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-2">
              {items.map((item, i) => {
                const qty = item.quantity || 1;
                const unitPrice = item.unit_price || item.unit_value || 0;
                const lineTotal = item.total || (qty * unitPrice);
                return (
                  <div key={i} className="bg-gray-50 rounded-lg p-3 text-sm space-y-1.5">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{item.description}</p>
                        {item.code && <p className="font-mono text-xs text-gray-400">{item.code}</p>}
                      </div>
                      <span className="font-semibold text-gray-900 ml-2">{fmt(lineTotal)}</span>
                    </div>
                    <div className="flex gap-3 text-xs text-gray-500 flex-wrap">
                      <span>Cant: <strong>{qty}</strong></span>
                      <span>Vr Unit: <strong>{fmt(unitPrice)}</strong></span>
                      <span>IVA: <strong>{item.iva_percentage || 0}%</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <SectionDivider />

      {/* === TOTALS === */}
      <div className="px-6 py-4">
        <div className="max-w-xs ml-auto space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span className="font-medium text-gray-900">{fmt(totals?.subtotal || invoice.total / 1.19)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">IVA 19%</span>
            <span className="font-medium text-primary">{fmt(totals?.iva || invoice.total * 0.19)}</span>
          </div>
          {totals?.retenciones > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Retenciones</span>
              <span className="font-medium text-danger">-{fmt(totals.retenciones)}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t-2 border-gray-800">
            <span className="font-bold text-gray-900">Total</span>
            <span className="font-bold text-xl text-gray-900">{fmt(invoice.total)}</span>
          </div>
        </div>
      </div>

      <SectionDivider />

      {/* === CUFE / FOOTER === */}
      <div className="px-6 py-4">
        {invoice.cufe && (
          <div className="text-center">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">CUFE</p>
            <p className="text-[11px] font-mono text-gray-600 break-all select-all bg-gray-50 px-3 py-2 rounded-lg">
              {invoice.cufe}
            </p>
          </div>
        )}
        {invoice.paid && (
          <div className="mt-3 text-center">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-success bg-success/10 px-3 py-1 rounded-full">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Pagada
            </span>
          </div>
        )}
      </div>

      {/* === DOWNLOAD BUTTONS === */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/50 rounded-b-xl flex flex-wrap gap-2">
        {invoice.has_pdf && invoice.document_path && (
          <a href={invoice.document_path} download
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Descargar PDF
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
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Descargar XML
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
