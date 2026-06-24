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
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '1rem',
  },
  billerCard: (active) => ({
    background: '#fff', border: `1px solid ${active ? '#e5e7eb' : '#fecaca'}`,
    borderRadius: '12px', padding: '1.25rem',
    display: 'flex', flexDirection: 'column', gap: '0.5rem',
    opacity: active ? 1 : 0.6,
    transition: 'opacity .2s',
  }),
  billerName: { fontSize: '1.1rem', fontWeight: '700', color: '#111827' },
  billerMeta: { color: '#6b7280', fontSize: '0.8rem' },
  row: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem',
  },
  toggle: {
    position: 'relative', display: 'inline-block', width: '40px', height: '22px',
    flexShrink: 0,
  },
  toggleInput: {
    opacity: 0, width: 0, height: 0,
  },
  toggleSlider: (on) => ({
    position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: '22px',
    background: on ? '#2563eb' : '#d1d5db',
    transition: '.3s',
  }),
  toggleKnob: (on) => ({
    position: 'absolute', top: '2px', left: on ? '20px' : '2px',
    width: '18px', height: '18px', borderRadius: '50%', background: '#fff',
    transition: '.3s',
  }),
  enterBtn: (active) => ({
    padding: '0.5rem 1.25rem',
    background: active ? '#2563eb' : '#9ca3af',
    color: '#fff', border: 'none', borderRadius: '8px',
    fontSize: '0.85rem', fontWeight: '600', cursor: active ? 'pointer' : 'not-allowed',
  }),
  empty: { textAlign: 'center', color: '#9ca3af', padding: '3rem', fontSize: '0.9rem' },
};

function fmt(n) {
  if (n == null) return '$0';
  return '$' + Number(n).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d) {
  if (!d) return '';
  return d.slice(0, 10);
}

export default function Dashboard() {
  const [impersonating, setImpersonating] = useState(api.isImpersonating());
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin' && !impersonating;
  const navigate = useNavigate();

  // ——— Admin: Administración de usuarios ———
  if (isAdmin) {
    return <AdminUsersView navigate={navigate} />;
  }

  // ——— Biller / Impersonated: Dashboard de facturación ———
  return <BillingDashboard impersonating={impersonating} navigate={navigate} />;
}

/* ─── ADMIN: Administración de Usuarios ─── */
function AdminUsersView({ navigate }) {
  const [billers, setBillers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');
    api.getBillers()
      .then(setBillers)
      .catch(() => navigate('/login'))
      .finally(() => setLoading(false));
  }, [navigate]);

  async function handleToggle(biller) {
    const next = !biller.is_active;
    try {
      const updated = await api.updateBiller(biller.id, { is_active: next });
      setBillers(prev => prev.map(b => b.id === biller.id ? { ...b, is_active: updated.is_active } : b));
    } catch (err) {
      alert('Error al actualizar estado');
    }
  }

  async function handleEnter(biller) {
    if (!biller.is_active) return;
    try {
      const data = await api.impersonate(biller.id);
      localStorage.setItem('impersonate_token', data.token);
      localStorage.setItem('impersonating', JSON.stringify({ biller_id: biller.id, name: biller.name }));
      window.location.reload();
    } catch (err) {
      alert('Error al ingresar al cliente');
    }
  }

  function handleLogout() {
    localStorage.clear();
    navigate('/');
  }

  if (loading) return <div style={s.loading}>Cargando...</div>;

  return (
    <div style={s.page}>
      <div style={s.top}>
        <span style={s.logo}>Contaya</span>
        <button style={s.logout} onClick={handleLogout}>Cerrar sesión</button>
      </div>
      <div style={s.main}>
        <h1 style={s.title}>Administración de usuarios</h1>
        <p style={s.subtitle}>{billers.length} clientes registrados en la plataforma</p>

        {billers.length === 0 ? (
          <p style={s.empty}>No hay clientes registrados aún</p>
        ) : (
          <div style={s.billerGrid}>
            {billers.map(b => (
              <div key={b.id} style={s.billerCard(b.is_active)}>
                <div style={s.row}>
                  <div style={s.billerName}>{b.name}</div>
                  <label style={s.toggle}>
                    <input
                      type="checkbox"
                      style={s.toggleInput}
                      checked={!!b.is_active}
                      onChange={() => handleToggle(b)}
                    />
                    <span style={s.toggleSlider(!!b.is_active)} />
                    <span style={s.toggleKnob(!!b.is_active)} />
                  </label>
                </div>

                <div style={s.billerMeta}>NIT: {b.document_number}</div>
                <div style={s.billerMeta}>
                  {b.invoice_count || 0} facturas — Total: {fmt(b.total_sum)}
                </div>
                <div style={s.billerMeta}>
                  Estado: {b.is_active ? 'Activo' : 'Inactivo'}
                </div>

                <button
                  style={s.enterBtn(b.is_active)}
                  onClick={() => handleEnter(b)}
                  disabled={!b.is_active}
                >
                  {b.is_active ? 'Ingresar' : 'Desactivado'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── BILLER / IMPERSONATED: Dashboard de facturación ─── */
function BillingDashboard({ impersonating, navigate }) {
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('impersonate_token');
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
      <ImpersonateBanner />
      <div style={s.top}>
        <span style={s.logo}>Contaya</span>
        <div>
          <Link to="/facturas" style={s.topLink}>Facturas</Link>
          <Link to="/clientes" style={s.topLink}>Clientes</Link>
          <button style={{ ...s.logout, marginLeft: '1rem' }} onClick={handleLogout}>Cerrar sesión</button>
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
