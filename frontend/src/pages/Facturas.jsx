import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

const blue = '#1a3a5c';
const primary = '#2563eb';
const primaryLight = '#eff6ff';

const s = {
  page: { minHeight: '100vh', background: '#f4f7fc', color: '#1e293b', fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif' },
  top: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 2rem', background: '#fff', borderBottom: '1px solid #e2e8f0' },
  logo: { fontSize: '1.1rem', fontWeight: '700', color: primary, textDecoration: 'none' },
  back: { color: primary, textDecoration: 'none', fontSize: '0.85rem', fontWeight: '500' },
  logout: { background: 'none', border: '1px solid #e2e8f0', color: '#64748b', padding: '0.4rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' },
  main: { maxWidth: '1200px', margin: '0 auto', padding: '2rem' },
  title: { fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem', color: '#0f172a' },
  filters: { display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2rem', alignItems: 'end', background: '#fff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.25rem' },
  label: { color: '#64748b', fontSize: '0.75rem', fontWeight: '600' },
  input: { padding: '0.5rem 0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#1e293b', fontSize: '0.85rem', outline: 'none' },
  select: { padding: '0.5rem 0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#1e293b', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' },
  btn: { padding: '0.5rem 1.25rem', background: primary, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', height: '36px', whiteSpace: 'nowrap' },
  tableContainer: { overflowX: 'auto', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '0.75rem 1rem', textAlign: 'left', color: '#64748b', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #e2e8f0', background: '#f8fafc' },
  td: { padding: '0.75rem 1rem', fontSize: '0.85rem', borderBottom: '1px solid #f1f5f9' },
  status: (v) => ({ display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: '600', background: v === 'Firmado' ? '#dcfce7' : '#fef9c3', color: v === 'Firmado' ? '#166534' : '#854d0e' }),
  empty: { textAlign: 'center', color: '#94a3b8', padding: '4rem 2rem', fontSize: '0.9rem' },
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#94a3b8', fontSize: '1rem' },
};

function fmt(n) {
  if (n == null) return '$0';
  return '$' + Number(n).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Facturas() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState(null);
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [cliente, setCliente] = useState('');
  const [estatus, setEstatus] = useState('');

  async function load() {
    setLoading(true);
    try {
      const params = {};
      if (desde) params.desde = desde;
      if (hasta) params.hasta = hasta;
      if (cliente) params.cliente = cliente;
      if (estatus) params.estatus = estatus;
      const data = await api.getInvoices(params);
      setInvoices(data);
    } catch { }
    setLoading(false);
  }

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');
    api.getCompany().then(setCompany).catch(() => {});
    load();
  }, []);

  const iva = (total) => total * 0.19;

  return (
    <div style={s.page}>
      <div style={s.top}>
        <a href="/dashboard" style={s.back}>← Dashboard</a>
        <span style={s.logo}>Contaya</span>
        <button style={s.logout} onClick={() => { localStorage.clear(); window.location.href = '/'; }}>Cerrar sesión</button>
      </div>
      <div style={s.main}>
        <h1 style={s.title}>Facturas</h1>

        {company?.name && (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center' }}>
            <div><div style={{ color: '#64748b', fontSize: '0.7rem', marginBottom: '0.15rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Facturador</div><div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>{company.name}</div></div>
            {company.rnc && <div><div style={{ color: '#64748b', fontSize: '0.7rem', marginBottom: '0.15rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>RNC</div><div style={{ fontWeight: 600, color: primary }}>{company.rnc}</div></div>}
            {company.address && <div><div style={{ color: '#64748b', fontSize: '0.7rem', marginBottom: '0.15rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dirección</div><div style={{ fontSize: '0.85rem', color: '#334155' }}>{company.address}</div></div>}
            {company.email && <div><div style={{ color: '#64748b', fontSize: '0.7rem', marginBottom: '0.15rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</div><div style={{ fontSize: '0.85rem', color: primary }}>{company.email}</div></div>}
            {company.phone && <div><div style={{ color: '#64748b', fontSize: '0.7rem', marginBottom: '0.15rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Teléfono</div><div style={{ fontSize: '0.85rem', color: '#334155' }}>{company.phone}</div></div>}
          </div>
        )}

        <div style={s.filters}>
          <div style={s.field}>
            <label style={s.label}>Desde</label>
            <input style={s.input} type="date" value={desde} onChange={e => setDesde(e.target.value)} />
          </div>
          <div style={s.field}>
            <label style={s.label}>Hasta</label>
            <input style={s.input} type="date" value={hasta} onChange={e => setHasta(e.target.value)} />
          </div>
          <div style={s.field}>
            <label style={s.label}>Cliente</label>
            <input style={s.input} type="text" value={cliente} onChange={e => setCliente(e.target.value)} placeholder="Buscar..." />
          </div>
          <div style={s.field}>
            <label style={s.label}>Estado</label>
            <select style={s.select} value={estatus} onChange={e => setEstatus(e.target.value)}>
              <option value="">Todos</option>
              <option value="Firmado">Firmado</option>
              <option value="Pendiente">Pendiente</option>
            </select>
          </div>
          <button style={s.btn} onClick={load}>Filtrar</button>
        </div>

        {loading ? <p style={s.empty}>Cargando...</p> : invoices.length === 0 ? (
          <p style={s.empty}>No se encontraron facturas</p>
        ) : (
          <div style={s.tableContainer}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>NCF</th>
                  <th style={s.th}>Cliente</th>
                  <th style={s.th}>Fecha</th>
                  <th style={s.th}>Total</th>
                  <th style={s.th}>IVA 19%</th>
                  <th style={s.th}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id}>
                    <td style={{ ...s.td, fontFamily: 'monospace', fontSize: '0.8rem', color: primary }}>{inv.ncf}</td>
                    <td style={{ ...s.td, fontWeight: '500' }}>{inv.client_name || (inv.client || '').split('...')[0]}</td>
                    <td style={s.td}>{inv.created_at?.slice(0, 10)}</td>
                    <td style={{ ...s.td, fontWeight: '700' }}>{fmt(inv.total)}</td>
                    <td style={s.td}>{fmt(iva(inv.total))}</td>
                    <td style={s.td}><span style={s.status(inv.status)}>{inv.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}