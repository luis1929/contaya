import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

const s = {
  page: { minHeight: '100vh', background: 'var(--background)', color: 'var(--text-primary)', fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif' },
  top: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 2rem', background: 'var(--surface)', borderBottom: '1px solid var(--border)' },
  logo: { fontSize: '1.1rem', fontWeight: '700', color: 'var(--primary)' },
  logout: { 
    background: 'none', 
    border: '1px solid var(--border)', 
    color: 'var(--text-secondary)', 
    padding: '0.4rem 1rem', 
    borderRadius: '6px', 
    cursor: 'pointer', 
    fontSize: '0.8rem',
    transition: 'var(--transition)',
    ':hover': {
      background: 'var(--background)',
      color: 'var(--text-primary)'
    }
  },
  main: { maxWidth: '1200px', margin: '0 auto', padding: '2rem' },
  title: { fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.25rem' },
  subtitle: { color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' },
  card: { 
    background: 'var(--surface)', 
    border: '1px solid var(--border)', 
    borderRadius: '12px', 
    padding: '1.25rem',
    transition: 'var(--transition)',
    ':hover': { boxShadow: 'var(--shadow-md)' }
  },
  cardName: { fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.75rem' },
  cardStat: { color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.25rem' },
  cardValue: { color: 'var(--primary)', fontWeight: '600' },
  empty: { textAlign: 'center', color: 'var(--text-muted)', padding: '4rem', fontSize: '0.9rem' },
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: 'var(--text-muted)', fontSize: '1rem' },
};

function fmt(n) {
  if (n == null) return '$0';
  return '$' + Number(n).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');
    api.getClients()
      .then(setClients)
      .catch(() => navigate('/login'))
      .finally(() => setLoading(false));
  }, [navigate]);

  function handleLogout() {
    localStorage.clear();
    window.dispatchEvent(new Event('auth-change'));
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