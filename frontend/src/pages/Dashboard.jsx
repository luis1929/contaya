import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';

const blue = '#062a51';
const gold = '#FFD066';
const bg = '#fafafa';

const features = [
  { to: '/facturas', icon: '📄', title: 'Gestión de Facturas', desc: 'Sube y procesa facturas en PDF. Extracción automática de datos como RNC, NCF, montos y fechas.' },
  { to: '/declarations', icon: '📊', title: 'Declaración de IVA', desc: 'Calcula automáticamente el ITBIS y genera las declaraciones mensuales de IVA listas para presentar.' },
  { to: '/declarations', icon: '💰', title: 'Declaración de Renta', desc: 'Prepara tu declaración anual de ISR con base en ingresos, gastos y retenciones registradas.' },
  { to: '/upload', icon: '🏦', title: 'Conciliación Bancaria', desc: 'Importa extractos bancarios y concilia automáticamente con tus facturas y movimientos registrados.' },
  { to: '/upload', icon: '📋', title: 'Control de Gastos', desc: 'Clasifica y monitorea todos tus gastos deducibles. Obtén reportes detallados por categoría y período.' },
  { to: '#reportes', icon: '📈', title: 'Reportes y Analytics', desc: 'Visualiza dashboards con indicadores clave: flujo de caja, cuentas por cobrar/pagar y rentabilidad.' },
];

const s = {
  page: { minHeight: '100vh', background: bg, color: '#333', fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif' },
  top: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 2rem', background: blue, color: '#fff' },
  logo: { fontSize: '1.1rem', fontWeight: '700', color: '#fff' },
  logout: { background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', padding: '0.4rem 1rem', borderRadius: '5px', cursor: 'pointer', fontSize: '0.85rem' },
  main: { maxWidth: '1200px', margin: '0 auto', padding: '2rem' },
  header: { marginBottom: '2.5rem' },
  title: { fontSize: '1.5rem', fontWeight: '700', color: '#222', marginBottom: '0.25rem' },
  subtitle: { color: '#888', fontSize: '0.9rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' },
  card: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.75rem', cursor: 'pointer', textDecoration: 'none', color: 'inherit', display: 'block', transition: 'box-shadow 0.2s, transform 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  iconBox: { width: '48px', height: '48px', background: '#f0f4ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: '1rem' },
  cardTitle: { fontSize: '1.1rem', fontWeight: '600', color: '#222', marginBottom: '0.5rem' },
  cardDesc: { color: '#666', fontSize: '0.85rem', lineHeight: '1.6' },
  reportesSection: { marginTop: '3rem', borderTop: '1px solid #e5e7eb', paddingTop: '2rem' },
  reportesHeader: { fontSize: '1.2rem', fontWeight: '700', color: '#222', marginBottom: '1.5rem' },
  cardSm: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  cardLabel: { color: '#888', fontSize: '0.8rem', marginBottom: '0.3rem' },
  cardValue: { fontSize: '1.4rem', fontWeight: '700', color: '#222' },
  cardAccent: { color: blue },
  table: { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  th: { padding: '0.7rem 1rem', textAlign: 'left', color: '#666', fontSize: '0.75rem', fontWeight: '600', borderBottom: '1px solid #eee', textTransform: 'uppercase', letterSpacing: '0.05em', background: bg },
  td: { padding: '0.7rem 1rem', fontSize: '0.85rem', borderBottom: '1px solid #f0f0f0' },
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#888', fontSize: '1rem' },
};

function fmt(n) {
  if (n == null) return '$0';
  return '$' + Number(n).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Dashboard() {
  const [userRole, setUserRole] = useState('admin');
  const [userName, setUserName] = useState('');
  const [impersonating, setImpersonating] = useState(false);
  const [summary, setSummary] = useState(null);
  const [company, setCompany] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const t = localStorage.getItem('token');
    if (!t) return navigate('/login');
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    setUserRole(u.role || 'admin');
    setUserName(u.name || '');
    setImpersonating(!!u.impersonating);
    api.getInvoiceSummary().then(setSummary).catch(() => {});
    api.getCompany().then(setCompany).catch(() => {});
  }, []);

  function backToAdmin() {
    const adminToken = localStorage.getItem('admin_token');
    if (adminToken) {
      localStorage.setItem('token', adminToken);
      localStorage.removeItem('admin_token');
      localStorage.setItem('user', JSON.stringify({ role: 'admin' }));
    }
    navigate('/admin');
  }

  return (
    <div style={s.page}>
      {impersonating && (
        <div style={{ background: '#fef9c3', borderBottom: '1px solid #fde68a', padding: '0.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: '#92400e' }}>
          <span>Modo impersonación: estás viendo datos de <strong>{userName}</strong></span>
          <button onClick={backToAdmin} style={{ background: '#92400e', color: '#fff', border: 'none', padding: '0.3rem 1rem', borderRadius: '5px', cursor: 'pointer', fontSize: '0.8rem' }}>Volver al Admin</button>
        </div>
      )}
      <div style={s.top}>
        <span style={s.logo}>Contaya</span>
        <div>
          <button style={s.logout} onClick={() => { localStorage.clear(); navigate('/'); }}>Cerrar sesión</button>
        </div>
      </div>
      <div style={s.main}>
        <div style={s.header}>
          <h1 style={s.title}>Bienvenido{userName ? `, ${userName}` : ''}</h1>
          <p style={s.subtitle}>Selecciona un módulo para comenzar</p>
        </div>

        {company?.name && (
          <div style={{
            background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px',
            padding: '1.25rem 1.75rem', marginBottom: '1.5rem',
            display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center',
          }}>
            <div>
              <div style={{ color: '#888', fontSize: '0.75rem', marginBottom: '0.15rem' }}>FACTURADOR</div>
              <div style={{ fontWeight: '700', fontSize: '1.1rem', color: '#222' }}>{company.name}</div>
            </div>
            {company.rnc && (
              <div>
                <div style={{ color: '#888', fontSize: '0.75rem', marginBottom: '0.15rem' }}>RNC</div>
                <div style={{ fontWeight: '600', color: blue }}>{company.rnc}</div>
              </div>
            )}
            {company.address && (
              <div>
                <div style={{ color: '#888', fontSize: '0.75rem', marginBottom: '0.15rem' }}>DIRECCIÓN</div>
                <div style={{ fontSize: '0.9rem' }}>{company.address}</div>
              </div>
            )}
            {company.email && (
              <div>
                <div style={{ color: '#888', fontSize: '0.75rem', marginBottom: '0.15rem' }}>CORREO</div>
                <div style={{ fontSize: '0.9rem' }}>{company.email}</div>
              </div>
            )}
            {company.phone && (
              <div>
                <div style={{ color: '#888', fontSize: '0.75rem', marginBottom: '0.15rem' }}>TELÉFONO</div>
                <div style={{ fontSize: '0.9rem' }}>{company.phone}</div>
              </div>
            )}
            <Link to="/company" style={{ color: blue, fontSize: '0.8rem', marginLeft: 'auto', textDecoration: 'none' }}>Editar</Link>
          </div>
        )}

        <div style={s.grid}>
          {features.map((f, i) => (
            f.to.startsWith('#') ? (
              <a key={i} href={f.to} style={s.card}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'none'; }}>
                <div style={s.iconBox}>{f.icon}</div>
                <h3 style={s.cardTitle}>{f.title}</h3>
                <p style={s.cardDesc}>{f.desc}</p>
              </a>
            ) : (
              <Link key={i} to={f.to} style={s.card}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'none'; }}>
                <div style={s.iconBox}>{f.icon}</div>
                <h3 style={s.cardTitle}>{f.title}</h3>
                <p style={s.cardDesc}>{f.desc}</p>
              </Link>
            )
          ))}
        </div>

        <div id="reportes" style={s.reportesSection}>
          <h2 style={s.reportesHeader}>Reportes y Analytics</h2>

          {summary && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={s.cardSm}>
                <div style={s.cardLabel}>Total facturado</div>
                <div style={{ ...s.cardValue, ...s.cardAccent }}>{fmt(summary.total_sum)}</div>
              </div>
              <div style={s.cardSm}>
                <div style={s.cardLabel}>Facturas</div>
                <div style={s.cardValue}>{summary.total_count || 0}</div>
              </div>
              <div style={s.cardSm}>
                <div style={s.cardLabel}>Promedio</div>
                <div style={s.cardValue}>{fmt(summary.total_avg)}</div>
              </div>
              <div style={s.cardSm}>
                <div style={s.cardLabel}>IVA (19%)</div>
                <div style={s.cardValue}>{fmt(summary.iva_sum)}</div>
              </div>
              <div style={s.cardSm}>
                <div style={s.cardLabel}>Cobrado</div>
                <div style={s.cardValue}>{fmt(summary.paid_sum)}</div>
              </div>
              <div style={s.cardSm}>
                <div style={s.cardLabel}>Período</div>
                <div style={{ ...s.cardValue, fontSize: '1rem' }}>{summary.first_date?.slice(0,7)} — {summary.last_date?.slice(0,7)}</div>
              </div>
            </div>
          )}
        </div>


      </div>
    </div>
  );
}