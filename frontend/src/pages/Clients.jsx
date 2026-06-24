import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const s = {
  page: { minHeight: '100vh', background: '#0f0c29', color: '#fff', fontFamily: 'system-ui, sans-serif' },
  top: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '1.5rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  logo: { fontSize: '1.25rem', fontWeight: '700', color: '#818cf8' },
  logout: {
    background: 'none', border: '1px solid rgba(255,255,255,0.1)',
    color: '#94a3b8', padding: '0.5rem 1rem', borderRadius: '8px',
    cursor: 'pointer', fontSize: '0.85rem',
  },
  main: { maxWidth: '1200px', margin: '0 auto', padding: '2rem' },
  title: { fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' },
  subtitle: { color: '#94a3b8', fontSize: '0.9rem', marginBottom: '2rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' },
  card: {
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '12px', padding: '1.25rem',
  },
  cardName: { fontSize: '1.1rem', fontWeight: '700', color: '#fff', marginBottom: '0.5rem' },
  cardStat: { color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.25rem' },
  cardValue: { color: '#818cf8', fontWeight: '600' },
  empty: { textAlign: 'center', color: '#64748b', padding: '3rem', fontSize: '0.9rem' },
  loading: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '100vh', color: '#94a3b8', fontSize: '1rem',
  },
};

function fmt(n) {
  if (n == null) return '$0';
  return '$' + Number(n).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  function authHeaders() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');
    fetch('/api/clients', { headers: authHeaders() })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setClients)
      .catch(() => navigate('/login'))
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
          <a href="/dashboard" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', marginRight: '1rem' }}>← Dashboard</a>
          <button style={s.logout} onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </div>
      <div style={s.main}>
        <h1 style={s.title}>Clientes</h1>
        <p style={s.subtitle}>{clients.length} clientes registrados</p>
        {clients.length === 0 ? (
          <p style={s.empty}>No hay clientes aún</p>
        ) : (
          <div style={s.grid}>
            {clients.map(c => (
              <div key={c.id} style={s.card}>
                <div style={s.cardName}>{c.name}</div>
                <div style={s.cardStat}>Facturas: <span style={s.cardValue}>{c.invoice_count}</span></div>
                <div style={s.cardStat}>Total: <span style={s.cardValue}>{fmt(c.total_sum)}</span></div>
                {c.invoice_count > 0 && (
                  <div style={s.cardStat}>Promedio: <span style={s.cardValue}>{fmt(c.total_sum / c.invoice_count)}</span></div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
