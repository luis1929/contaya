import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';

const s = {
  page: {
    minHeight: '100vh',
    background: '#0f0c29',
    color: '#fff',
    fontFamily: 'system-ui, sans-serif',
  },
  top: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '1.5rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  logo: { fontSize: '1.25rem', fontWeight: '700', color: '#818cf8' },
  topLink: { color: '#94a3b8', textDecoration: 'none', fontSize: '0.85rem', marginRight: '1rem' },
  logout: {
    background: 'none', border: '1px solid rgba(255,255,255,0.1)',
    color: '#94a3b8', padding: '0.5rem 1rem', borderRadius: '8px',
    cursor: 'pointer', fontSize: '0.85rem',
  },
  main: { maxWidth: '1200px', margin: '0 auto', padding: '2rem' },
  title: { fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' },
  subtitle: { color: '#94a3b8', fontSize: '0.9rem', marginBottom: '2rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' },
  card: {
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '12px', padding: '1.25rem',
  },
  cardLabel: { color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.35rem' },
  cardValue: { fontSize: '1.4rem', fontWeight: '700', color: '#fff' },
  cardAccent: { color: '#818cf8' },
  table: {
    width: '100%', borderCollapse: 'collapse',
    background: 'rgba(255,255,255,0.02)',
    borderRadius: '12px', overflow: 'hidden',
  },
  th: {
    padding: '0.75rem 1rem', textAlign: 'left',
    color: '#94a3b8', fontSize: '0.8rem', fontWeight: '600',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    textTransform: 'uppercase', letterSpacing: '0.05em',
  },
  td: {
    padding: '0.75rem 1rem', fontSize: '0.9rem',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
  status: (v) => ({
    display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '999px',
    fontSize: '0.75rem', fontWeight: '500',
    background: v === 'Firmado' ? 'rgba(52,211,153,0.1)' : 'rgba(251,191,36,0.1)',
    color: v === 'Firmado' ? '#34d399' : '#fbbf24',
  }),
  paid: (v) => ({
    color: v ? '#34d399' : '#64748b', fontSize: '0.85rem',
  }),
  loading: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '100vh', color: '#94a3b8', fontSize: '1rem',
  },
};

function fmt(n) {
  if (n == null) return '$0';
  return '$' + Number(n).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Dashboard() {
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');
    Promise.all([api.getInvoices(), api.getInvoiceSummary()])
      .then(([inv, sum]) => { setInvoices(inv); setSummary(sum); })
      .catch(() => { localStorage.clear(); navigate('/login'); })
      .finally(() => setLoading(false));
  }, [navigate]);

  function handleLogout() {
    localStorage.clear();
    navigate('/');
  }

  if (loading) return <div style={s.loading}>Cargando...</div>;

  return (
    <div style={s.page}>
      <div style={s.top}>
        <span style={s.logo}>Contaya</span>
        <div>
          <Link to="/facturas" style={s.topLink}>Facturas</Link>
          <Link to="/clientes" style={s.topLink}>Clientes</Link>
          <button style={s.logout} onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </div>
      <div style={s.main}>
        <h1 style={s.title}>Panel de facturación</h1>
        <p style={s.subtitle}>{invoices.length} facturas encontradas</p>

        <div style={s.grid}>
          <div style={s.card}>
            <div style={s.cardLabel}>Total facturado</div>
            <div style={{ ...s.cardValue, ...s.cardAccent }}>{fmt(summary?.total_sum)}</div>
          </div>
          <div style={s.card}>
            <div style={s.cardLabel}>Facturas</div>
            <div style={s.cardValue}>{summary?.total_count || 0}</div>
          </div>
          <div style={s.card}>
            <div style={s.cardLabel}>Promedio por factura</div>
            <div style={s.cardValue}>{fmt(summary?.total_avg)}</div>
          </div>
          <div style={s.card}>
            <div style={s.cardLabel}>Período</div>
            <div style={{ ...s.cardValue, fontSize: '1rem' }}>
              {summary?.first_date?.slice(0,7)} — {summary?.last_date?.slice(0,7)}
            </div>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>NCF</th>
                <th style={s.th}>Cliente</th>
                <th style={s.th}>Fecha</th>
                <th style={s.th}>Total</th>
                <th style={s.th}>Estado</th>
                <th style={s.th}>Pagado</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id}>
                  <td style={{ ...s.td, fontFamily: 'monospace', fontSize: '0.85rem' }}>{inv.ncf}</td>
                  <td style={s.td}>{inv.client_name || (inv.client || '').split('...')[0]}</td>
                  <td style={s.td}>{inv.created_at?.slice(0,10)}</td>
                  <td style={{ ...s.td, fontWeight: '600' }}>{fmt(inv.total)}</td>
                  <td style={s.td}><span style={s.status(inv.status)}>{inv.status}</span></td>
                  <td style={{ ...s.td, ...s.paid(inv.paid) }}>{inv.paid ? 'Sí' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
