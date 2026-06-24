import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import ImpersonateBanner from '../components/ImpersonateBanner';

const s = {
  page: { minHeight: '100vh', background: '#f8fafc', color: '#111827', fontFamily: 'system-ui, sans-serif' },
  top: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '1rem 2rem', borderBottom: '1px solid #e5e7eb', background: '#fff',
  },
  logo: { fontSize: '1.25rem', fontWeight: '700', color: '#1e40af' },
  topLink: { color: '#4b5563', textDecoration: 'none', fontSize: '0.85rem', marginRight: '1rem', fontWeight: '500' },
  logout: {
    background: 'none', border: '1px solid #d1d5db',
    color: '#4b5563', padding: '0.5rem 1rem', borderRadius: '8px',
    cursor: 'pointer', fontSize: '0.85rem',
  },
  main: { maxWidth: '1200px', margin: '0 auto', padding: '2rem' },
  title: { fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' },
  subtitle: { color: '#6b7280', fontSize: '0.9rem', marginBottom: '2rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' },
  card: {
    background: '#fff', border: '1px solid #e5e7eb',
    borderRadius: '12px', padding: '1.25rem',
  },
  cardLabel: { color: '#6b7280', fontSize: '0.8rem', marginBottom: '0.35rem' },
  cardValue: { fontSize: '1.4rem', fontWeight: '700', color: '#111827' },
  cardAccent: { color: '#2563eb' },
  table: {
    width: '100%', borderCollapse: 'collapse',
    background: '#fff', borderRadius: '12px', overflow: 'hidden',
    border: '1px solid #e5e7eb',
  },
  th: {
    padding: '0.75rem 1rem', textAlign: 'left',
    color: '#6b7280', fontSize: '0.8rem', fontWeight: '600',
    borderBottom: '1px solid #e5e7eb',
    textTransform: 'uppercase', letterSpacing: '0.05em', background: '#f9fafb',
  },
  td: {
    padding: '0.75rem 1rem', fontSize: '0.9rem',
    borderBottom: '1px solid #f3f4f6',
  },
  status: (v) => ({
    display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '999px',
    fontSize: '0.75rem', fontWeight: '500',
    background: v === 'Firmado' ? '#dcfce7' : '#fef3c7',
    color: v === 'Firmado' ? '#16a34a' : '#d97706',
  }),
  paid: (v) => ({
    color: v ? '#16a34a' : '#9ca3af', fontSize: '0.85rem',
  }),
  loading: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '100vh', color: '#6b7280', fontSize: '1rem',
  },
  billerGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1rem', marginBottom: '2.5rem',
  },
  billerCard: {
    background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px',
    padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem',
  },
  billerName: { fontSize: '1.1rem', fontWeight: '700', color: '#111827' },
  billerMeta: { color: '#6b7280', fontSize: '0.8rem' },
  billerEnter: {
    alignSelf: 'flex-start', marginTop: '0.5rem',
    padding: '0.5rem 1.25rem', background: '#2563eb', color: '#fff',
    border: 'none', borderRadius: '8px', fontSize: '0.85rem',
    fontWeight: '600', cursor: 'pointer',
  },
};

function fmt(n) {
  if (n == null) return '$0';
  return '$' + Number(n).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Dashboard() {
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState(null);
  const [billers, setBillers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [impersonating, setImpersonating] = useState(api.isImpersonating());
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('impersonate_token');
    if (!token) return navigate('/login');

    const promises = [api.getInvoices(), api.getInvoiceSummary()];

    // If admin (not impersonating), also fetch billers list
    if (!impersonating) {
      promises.push(api.getBillers().catch(() => []));
    }

    Promise.all(promises)
      .then(([inv, sum, billersData]) => {
        setInvoices(inv);
        setSummary(sum);
        if (billersData) setBillers(billersData);
      })
      .catch(() => { localStorage.clear(); navigate('/login'); })
      .finally(() => setLoading(false));
  }, [navigate, impersonating]);

  async function handleEnterBiller(billerId, billerName) {
    try {
      const data = await api.impersonate(billerId);
      localStorage.setItem('impersonate_token', data.token);
      localStorage.setItem('impersonating', JSON.stringify({ biller_id: billerId, name: billerName }));
      window.location.reload();
    } catch (err) {
      alert('Error al ingresar al facturador');
    }
  }

  function handleLogout() {
    localStorage.clear();
    navigate('/');
  }

  if (loading) return <div style={s.loading}>Cargando...</div>;

  return (
    <div style={s.page}>
      <ImpersonateBanner />
      <div style={s.top}>
        <span style={s.logo}>Contaya</span>
        <div>
          <Link to="/facturas" style={s.topLink}>Facturas</Link>
          <Link to="/clientes" style={s.topLink}>Clientes</Link>
          <Link to="/" style={{ ...s.topLink, marginRight: 0 }}>Landing</Link>
          <button style={{ ...s.logout, marginLeft: '1rem' }} onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </div>
      <div style={s.main}>
        {/* Admin: Biller cards */}
        {billers.length > 0 && (
          <>
            <h2 style={{ ...s.title, fontSize: '1.25rem', marginBottom: '1rem' }}>Facturadores</h2>
            <div style={s.billerGrid}>
              {billers.map(b => (
                <div key={b.id} style={s.billerCard}>
                  <div style={s.billerName}>{b.name}</div>
                  <div style={s.billerMeta}>NIT: {b.document_number}</div>
                  <div style={s.billerMeta}>
                    {b.invoice_count || 0} facturas — Total: {fmt(b.total_sum)}
                  </div>
                  <button style={s.billerEnter} onClick={() => handleEnterBiller(b.id, b.name)}>
                    Ingresar
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

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
