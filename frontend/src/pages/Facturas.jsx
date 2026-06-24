import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const s = {
  page: { minHeight: '100vh', background: '#0f0c29', color: '#fff', fontFamily: 'system-ui, sans-serif' },
  top: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  logo: { fontSize: '1.25rem', fontWeight: '700', color: '#818cf8' },
  back: { color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem' },
  main: { maxWidth: '1200px', margin: '0 auto', padding: '2rem' },
  title: { fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' },
  filters: {
    display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2rem',
    alignItems: 'end',
  },
  field: { display: 'flex', flexDirection: 'column', gap: '0.25rem' },
  label: { color: '#94a3b8', fontSize: '0.75rem', fontWeight: '500' },
  input: {
    padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
    color: '#fff', fontSize: '0.85rem', outline: 'none',
  },
  select: {
    padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
    color: '#fff', fontSize: '0.85rem', outline: 'none', cursor: 'pointer',
  },
  btn: {
    padding: '0.5rem 1rem', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff', border: 'none', borderRadius: '8px',
    fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer',
    height: '36px',
  },
  table: {
    width: '100%', borderCollapse: 'collapse',
    background: 'rgba(255,255,255,0.02)', borderRadius: '12px', overflow: 'hidden',
  },
  th: {
    padding: '0.75rem 1rem', textAlign: 'left', color: '#94a3b8',
    fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  td: {
    padding: '0.75rem 1rem', fontSize: '0.85rem',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
  status: (v) => ({
    display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '999px',
    fontSize: '0.7rem', fontWeight: '500',
    background: v === 'Firmado' ? 'rgba(52,211,153,0.1)' : 'rgba(251,191,36,0.1)',
    color: v === 'Firmado' ? '#34d399' : '#fbbf24',
  }),
  empty: { textAlign: 'center', color: '#64748b', padding: '3rem', fontSize: '0.9rem' },
};

function fmt(n) {
  if (n == null) return '$0';
  return '$' + Number(n).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Facturas() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [cliente, setCliente] = useState('');
  const [estatus, setEstatus] = useState('');
  const navigate = useNavigate();

  function authFetch(url) {
    const token = localStorage.getItem('token');
    return fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (desde) params.set('desde', desde);
      if (hasta) params.set('hasta', hasta);
      if (cliente) params.set('cliente', cliente);
      if (estatus) params.set('estatus', estatus);
      const q = params.toString() ? '?' + params.toString() : '';
      const res = await authFetch('/api/invoices' + q);
      if (!res.ok) { navigate('/login'); return; }
      const data = await res.json();
      setInvoices(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const iva = (total) => total * 0.19;

  return (
    <div style={s.page}>
      <div style={s.top}>
        <span style={s.logo}>Contaya</span>
        <a href="/dashboard" style={s.back}>← Dashboard</a>
      </div>
      <div style={s.main}>
        <h1 style={s.title}>Facturas</h1>

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
          <div style={{ overflowX: 'auto' }}>
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
                    <td style={{ ...s.td, fontFamily: 'monospace', fontSize: '0.8rem' }}>{inv.ncf}</td>
                    <td style={s.td}>{inv.client_name || (inv.client || '').split('...')[0]}</td>
                    <td style={s.td}>{inv.created_at?.slice(0, 10)}</td>
                    <td style={{ ...s.td, fontWeight: '600' }}>{fmt(inv.total)}</td>
                    <td style={{ ...s.td, color: '#a5b4fc' }}>{fmt(iva(inv.total))}</td>
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
