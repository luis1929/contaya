import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import ImpersonateBanner from '../components/ImpersonateBanner';
import '../App.css';

const s = {
  page: { minHeight: '100vh', background: 'var(--gray-50)', color: 'var(--gray-800)', fontFamily: 'system-ui, sans-serif' },
  top: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', borderBottom: '1px solid var(--gray-200)', background: 'var(--white)', boxShadow: 'var(--shadow-sm)', position: 'sticky', top: 0, zIndex: 10 },
  logo: { fontSize: '1.25rem', fontWeight: '700', color: 'var(--primary-dark)', textDecoration: 'none' },
  back: { display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--gray-600)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500', padding: '0.5rem 1rem', borderRadius: 'var(--radius)', marginRight: '1rem' },
  logout: { background: 'none', border: '1px solid var(--gray-300)', color: 'var(--gray-600)', padding: '0.5rem 1rem', borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500' },
  main: { maxWidth: '1200px', margin: '0 auto', padding: '2rem' },
  title: { fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--gray-900)' },
  subtitle: { color: 'var(--gray-600)', fontSize: '0.95rem', marginBottom: '2rem' },
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' },
  statCard: { background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-md)', padding: '1.25rem', textAlign: 'center' },
  statValue: { fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary-dark)' },
  statLabel: { fontSize: '0.75rem', color: 'var(--gray-600)', marginTop: '0.25rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' },
  card: { background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-md)', padding: '1.5rem', transition: 'var(--transition)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  cardPeriod: { fontSize: '1.1rem', fontWeight: '600', color: 'var(--gray-900)' },
  cardCount: { fontSize: '0.8rem', color: 'var(--gray-500)' },
  declRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid var(--gray-100)' },
  declType: { fontWeight: '600', fontSize: '0.9rem', color: 'var(--gray-800)' },
  declAmount: { fontWeight: '600', fontSize: '0.85rem', color: 'var(--gray-700)' },
  badge: (status) => ({
    display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: '600',
    background: status === 'submitted' ? 'var(--success)' : status === 'overdue' ? 'var(--danger)' : 'var(--warning)',
    color: 'var(--white)',
  }),
  loading: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem', color: 'var(--gray-600)', gap: '1rem' },
  empty: { textAlign: 'center', color: 'var(--gray-500)', padding: '3rem', background: 'var(--white)', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-200)' },
  info: { marginTop: '2rem', padding: '1.5rem', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' },
  infoTitle: { fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--gray-700)' },
  infoList: { margin: 0, paddingLeft: '1.5rem', color: 'var(--gray-600)', fontSize: '0.875rem', lineHeight: '1.8' },
};

function fmt(n) {
  if (n == null) return '$0';
  return '$' + Number(n).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

const monthNames = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export default function Declarations() {
  const [loading, setLoading] = useState(true);
  const [declarations, setDeclarations] = useState([]);
  const [summary, setSummary] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const t = localStorage.getItem('token');
    if (!t) return navigate('/login');

    Promise.all([
      api.getDeclarations().catch(() => []),
      api.getDeclarationsSummary().catch(() => null),
    ]).then(([decls, sum]) => {
      setDeclarations(decls);
      setSummary(sum);
    }).finally(() => setLoading(false));
  }, [navigate]);

  const handleLogout = () => { localStorage.clear(); window.dispatchEvent(new Event('auth-change')); navigate('/'); };

  if (loading) {
    return (
      <div style={s.loading}>
        <div className="loading-spinner" style={{ width: '3rem', height: '3rem' }} />
        <p>Cargando declaraciones...</p>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <ImpersonateBanner />
      <div style={s.top}>
        <a href="/" style={s.logo}>Contaya</a>
        <div>
          <a href="/dashboard" style={s.back}>← Volver al Dashboard</a>
          <button style={s.logout} onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </div>

      <div style={s.main}>
        <h1 style={s.title}>Declaraciones Tributarias</h1>
        <p style={s.subtitle}>Declaraciones generadas automáticamente a partir de tus facturas registradas</p>

        {summary && (
          <div style={s.summaryGrid}>
            <div style={s.statCard}>
              <div style={s.statValue}>{summary.total_periods || 0}</div>
              <div style={s.statLabel}>Períodos con facturas</div>
            </div>
            <div style={s.statCard}>
              <div style={s.statValue}>{summary.total_invoices || 0}</div>
              <div style={s.statLabel}>Total facturas</div>
            </div>
            <div style={s.statCard}>
              <div style={{ ...s.statValue, color: 'var(--primary)' }}>{fmt(summary.total_iva)}</div>
              <div style={s.statLabel}>IVA total (19%)</div>
            </div>
            <div style={s.statCard}>
              <div style={s.statValue}>{summary.declarations?.submitted || 0}</div>
              <div style={s.statLabel}>Presentadas</div>
            </div>
            <div style={s.statCard}>
              <div style={{ ...s.statValue, color: 'var(--warning)' }}>{summary.declarations?.pending || 0}</div>
              <div style={s.statLabel}>Pendientes</div>
            </div>
          </div>
        )}

        {declarations.length === 0 ? (
          <div style={s.empty}>
            <p>No hay períodos con facturas registradas aún.</p>
            <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Sube facturas para generar declaraciones automáticamente.</p>
          </div>
        ) : (
          <div style={s.grid}>
            {declarations.map((decl) => (
              <div key={decl.period} style={s.card}>
                <div style={s.cardHeader}>
                  <div style={s.cardPeriod}>{monthNames[decl.month]} {decl.year}</div>
                  <div style={s.cardCount}>{decl.invoice_count} facturas</div>
                </div>

                {[
                  { label: 'IVA (19%)', data: decl.iva },
                  { label: 'Renta (25%)', data: decl.renta },
                  { label: 'ICA (1%)', data: decl.ica },
                  { label: 'Retención (11%)', data: decl.retencion },
                ].map(({ label, data }) => (
                  <div key={label} style={s.declRow}>
                    <div>
                      <div style={s.declType}>{label}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Base: {fmt(data.base)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={s.declAmount}>{fmt(data.tax)}</div>
                      <span style={s.badge(data.status)}>
                        {data.status === 'submitted' ? 'Presentada' : data.status === 'overdue' ? 'Vencida' : 'Pendiente'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        <div style={s.info}>
          <h3 style={s.infoTitle}>Información Importante</h3>
          <ul style={s.infoList}>
            <li>El IVA se calcula al 19% sobre facturas de venta (FCF, CE, NCF)</li>
            <li>La retención en la fuente se calcula al 11%</li>
            <li>El ICA se calcula al 1% sobre ingresos gravados</li>
            <li>Las declaraciones vencidas pueden generar multas e intereses</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
