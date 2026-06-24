import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ImpersonateBanner from '../components/ImpersonateBanner';
import '../App.css';

const s = {
  page: {
    minHeight: '100vh',
    background: 'var(--gray-50)',
    color: 'var(--gray-800)',
    fontFamily: 'system-ui, sans-serif',
  },
  top: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem',
    borderBottom: '1px solid var(--gray-200)',
    background: 'var(--white)',
    boxShadow: 'var(--shadow-sm)',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  logo: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: 'var(--primary-dark)',
    textDecoration: 'none',
    transition: 'var(--transition)',
  },
  logoHover: {
    color: 'var(--primary)',
  },
  back: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: 'var(--gray-600)',
    textDecoration: 'none',
    fontSize: '0.9rem',
    fontWeight: '500',
    padding: '0.5rem 1rem',
    borderRadius: 'var(--radius)',
    transition: 'var(--transition)',
    marginRight: '1rem',
  },
  backHover: {
    background: 'var(--gray-100)',
    color: 'var(--gray-800)',
  },
  logout: {
    background: 'none',
    border: '1px solid var(--gray-300)',
    color: 'var(--gray-600)',
    padding: '0.5rem 1rem',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: '500',
    transition: 'var(--transition)',
  },
  logoutHover: {
    background: 'var(--gray-100)',
    color: 'var(--gray-800)',
  },
  main: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '2rem',
  },
  header: {
    marginBottom: '2rem',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: '700',
    marginBottom: '0.5rem',
    color: 'var(--gray-900)',
  },
  subtitle: {
    color: 'var(--gray-600)',
    fontSize: '0.95rem',
    marginBottom: '2rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '1.5rem',
  },
  card: {
    background: 'var(--white)',
    border: '1px solid var(--gray-200)',
    borderRadius: 'var(--radius-md)',
    padding: '1.5rem',
    transition: 'var(--transition)',
  },
  cardHover: {
    transform: 'translateY(-2px)',
    boxShadow: 'var(--shadow-md)',
  },
  cardName: {
    fontSize: '1.1rem',
    fontWeight: '700',
    marginBottom: '0.75rem',
    color: 'var(--gray-900)',
  },
  cardStat: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem 0',
    borderBottom: '1px solid var(--gray-100)',
  },
  cardLabel: {
    color: 'var(--gray-600)',
    fontSize: '0.875rem',
  },
  cardValue: {
    color: 'var(--primary)',
    fontWeight: '600',
    fontSize: '0.9rem',
  },
  cardValueTotal: {
    color: 'var(--gray-900)',
    fontWeight: '700',
  },
  empty: {
    textAlign: 'center',
    color: 'var(--gray-500)',
    padding: '4rem',
    fontSize: '0.95rem',
    background: 'var(--white)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--gray-200)',
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4rem',
    color: 'var(--gray-600)',
    fontSize: '1rem',
    gap: '1rem',
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginBottom: '2rem',
  },
  statCard: {
    background: 'var(--white)',
    border: '1px solid var(--gray-200)',
    borderRadius: 'var(--radius-md)',
    padding: '1.25rem',
    transition: 'var(--transition)',
  },
  statCardHover: {
    transform: 'translateY(-2px)',
    boxShadow: 'var(--shadow-md)',
  },
  statLabel: {
    color: 'var(--gray-600)',
    fontSize: '0.75rem',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '0.5rem',
  },
  statValue: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: 'var(--gray-900)',
  },
  statValueAccent: {
    color: 'var(--primary)',
  },
};

function fmt(n) {
  if (n == null) return '$0';
  return '$' + Number(n).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function authToken() {
  if (localStorage.getItem('impersonating')) return localStorage.getItem('impersonate_token');
  return localStorage.getItem('token');
}

function authHeaders() {
  const token = authToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalClients: 0,
    totalInvoices: 0,
    totalAmount: 0,
    avgPerClient: 0,
  });
  const navigate = useNavigate();

  useEffect(() => {
    const token = authToken();
    if (!token) return navigate('/login');
    
    fetch('/api/clients', { headers: authHeaders() })
      .then(r => {
        if (!r.ok) throw new Error('Error al cargar clientes');
        return r.json();
      })
      .then(data => {
        setClients(data);
        
        // Calcular estadísticas
        const totalClients = data.length;
        const totalInvoices = data.reduce((sum, client) => sum + (client.invoice_count || 0), 0);
        const totalAmount = data.reduce((sum, client) => sum + (client.total_sum || 0), 0);
        const avgPerClient = totalClients > 0 ? totalAmount / totalClients : 0;
        
        setStats({
          totalClients,
          totalInvoices,
          totalAmount,
          avgPerClient,
        });
      })
      .catch(() => navigate('/login'))
      .finally(() => setLoading(false));
  }, [navigate]);

  function handleLogout() {
    localStorage.clear();
    navigate('/');
  }

  if (loading) {
    return (
      <div style={s.loading}>
        <div className="loading-spinner" style={{ width: '3rem', height: '3rem' }} />
        <p>Cargando clientes...</p>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <ImpersonateBanner />
      <div style={s.top}>
        <a
          href="/"
          style={s.logo}
          onMouseEnter={e => e.currentTarget.style.color = s.logoHover.color}
          onMouseLeave={e => e.currentTarget.style.color = s.logo.color}
        >
          Contaya
        </a>
        <div>
          <a
            href="/dashboard"
            style={s.back}
            onMouseEnter={e => e.currentTarget.style.background = s.backHover.background}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            ← Volver al Dashboard
          </a>
          <button
            style={s.logout}
            onClick={handleLogout}
            onMouseEnter={e => e.currentTarget.style.background = s.logoutHover.background}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            Cerrar sesión
          </button>
        </div>
      </div>
      
      <div style={s.main}>
        <div style={s.header}>
          <h1 style={s.title}>Clientes</h1>
          <p style={s.subtitle}>
            Gestiona y consulta la información de todos tus clientes
            {clients.length > 0 && ` · ${clients.length} clientes registrados`}
          </p>
        </div>

        {!loading && clients.length > 0 && (
          <div style={s.stats}>
            <div
              style={s.statCard}
              onMouseEnter={e => e.currentTarget.style.transform = s.statCardHover.transform}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            >
              <div style={s.statLabel}>Total Clientes</div>
              <div style={{ ...s.statValue, ...s.statValueAccent }}>{stats.totalClients}</div>
            </div>
            <div
              style={s.statCard}
              onMouseEnter={e => e.currentTarget.style.transform = s.statCardHover.transform}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            >
              <div style={s.statLabel}>Total Facturas</div>
              <div style={s.statValue}>{stats.totalInvoices}</div>
            </div>
            <div
              style={s.statCard}
              onMouseEnter={e => e.currentTarget.style.transform = s.statCardHover.transform}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            >
              <div style={s.statLabel}>Total Facturado</div>
              <div style={s.statValue}>{fmt(stats.totalAmount)}</div>
            </div>
            <div
              style={s.statCard}
              onMouseEnter={e => e.currentTarget.style.transform = s.statCardHover.transform}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            >
              <div style={s.statLabel}>Promedio por Cliente</div>
              <div style={s.statValue}>{fmt(stats.avgPerClient)}</div>
            </div>
          </div>
        )}

        {clients.length === 0 ? (
          <div style={s.empty}>
            <p style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>👥 No hay clientes registrados</p>
            <p>Los clientes aparecerán automáticamente cuando proceses facturas.</p>
          </div>
        ) : (
          <div style={s.grid}>
            {clients.map((client, index) => (
              <div
                key={client.id}
                style={s.card}
                className="fade-in"
                onMouseEnter={e => e.currentTarget.style.transform = s.cardHover.transform}
                onMouseLeave={e => e.currentTarget.style.transform = 'none'}
              >
                <div style={s.cardName}>{client.name}</div>
                
                <div style={s.cardStat}>
                  <span style={s.cardLabel}>Facturas:</span>
                  <span style={s.cardValue}>{client.invoice_count || 0}</span>
                </div>
                
                <div style={s.cardStat}>
                  <span style={s.cardLabel}>Total Facturado:</span>
                  <span style={{ ...s.cardValue, ...s.cardValueTotal }}>
                    {fmt(client.total_sum)}
                  </span>
                </div>
                
                {client.invoice_count > 0 && (
                  <div style={s.cardStat}>
                    <span style={s.cardLabel}>Promedio por Factura:</span>
                    <span style={s.cardValue}>
                      {fmt(client.total_sum / client.invoice_count)}
                    </span>
                  </div>
                )}
                
                {client.document_number && (
                  <div style={s.cardStat}>
                    <span style={s.cardLabel}>NIT/Identificación:</span>
                    <span style={{ ...s.cardValue, fontSize: '0.8rem', fontFamily: 'monospace' }}>
                      {client.document_number}
                    </span>
                  </div>
                )}
                
                {client.email && (
                  <div style={{ ...s.cardStat, borderBottom: 'none' }}>
                    <span style={s.cardLabel}>Email:</span>
                    <span style={{ ...s.cardValue, fontSize: '0.8rem' }}>
                      {client.email}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
