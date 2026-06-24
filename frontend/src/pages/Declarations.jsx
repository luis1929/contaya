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
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  card: {
    background: 'var(--white)',
    border: '1px solid var(--gray-200)',
    borderRadius: 'var(--radius-md)',
    padding: '1.5rem',
    transition: 'var(--transition)',
    cursor: 'pointer',
  },
  cardHover: {
    transform: 'translateY(-2px)',
    boxShadow: 'var(--shadow-md)',
    borderColor: 'var(--primary)',
  },
  cardIcon: {
    fontSize: '2rem',
    marginBottom: '1rem',
    color: 'var(--primary)',
  },
  cardTitle: {
    fontSize: '1.1rem',
    fontWeight: '600',
    marginBottom: '0.5rem',
    color: 'var(--gray-900)',
  },
  cardDescription: {
    color: 'var(--gray-600)',
    fontSize: '0.875rem',
    lineHeight: '1.5',
    marginBottom: '1rem',
  },
  cardStatus: {
    display: 'inline-block',
    padding: '0.25rem 0.75rem',
    borderRadius: 'var(--radius)',
    fontSize: '0.75rem',
    fontWeight: '500',
  },
  statusPending: {
    background: 'var(--warning)',
    color: 'var(--white)',
  },
  statusCompleted: {
    background: 'var(--success)',
    color: 'var(--white)',
  },
  statusOverdue: {
    background: 'var(--danger)',
    color: 'var(--white)',
  },
  upcomingSection: {
    marginTop: '3rem',
  },
  upcomingTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    marginBottom: '1rem',
    color: 'var(--gray-900)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    background: 'var(--white)',
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
    border: '1px solid var(--gray-200)',
  },
  th: {
    padding: '0.75rem 1rem',
    textAlign: 'left',
    color: 'var(--gray-600)',
    fontSize: '0.75rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '1px solid var(--gray-200)',
    background: 'var(--gray-50)',
  },
  td: {
    padding: '0.75rem 1rem',
    fontSize: '0.875rem',
    borderBottom: '1px solid var(--gray-100)',
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
  empty: {
    textAlign: 'center',
    color: 'var(--gray-500)',
    padding: '3rem',
    fontSize: '0.95rem',
    background: 'var(--white)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--gray-200)',
  },
};

const declarationsData = [
  {
    id: 1,
    type: 'IVA',
    period: '2024-01',
    status: 'completed',
    dueDate: '2024-02-15',
    submittedDate: '2024-02-10',
    amount: 1250000,
    description: 'Declaración de IVA mensual',
  },
  {
    id: 2,
    type: 'Renta',
    period: '2023',
    status: 'pending',
    dueDate: '2024-04-30',
    submittedDate: null,
    amount: 3850000,
    description: 'Declaración de renta anual',
  },
  {
    id: 3,
    type: 'ICA',
    period: '2024-01',
    status: 'overdue',
    dueDate: '2024-02-10',
    submittedDate: null,
    amount: 450000,
    description: 'Impuesto de Industria y Comercio',
  },
];

const upcomingDeadlines = [
  { type: 'IVA', period: '2024-02', dueDate: '2024-03-15', importance: 'high' },
  { type: 'Retención en la Fuente', period: '2024-01', dueDate: '2024-02-20', importance: 'medium' },
  { type: 'ICA', period: '2024-02', dueDate: '2024-03-10', importance: 'high' },
  { type: 'Renta', period: '2023', dueDate: '2024-04-30', importance: 'high' },
];

function fmt(n) {
  if (n == null) return '$0';
  return '$' + Number(n).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function authToken() {
  if (localStorage.getItem('impersonating')) return localStorage.getItem('impersonate_token');
  return localStorage.getItem('token');
}

export default function Declarations() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = authToken();
    if (!token) {
      navigate('/login');
      return;
    }
    // Simular carga de datos
    setTimeout(() => setLoading(false), 1000);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'completed': return { ...s.cardStatus, ...s.statusCompleted };
      case 'pending': return { ...s.cardStatus, ...s.statusPending };
      case 'overdue': return { ...s.cardStatus, ...s.statusOverdue };
      default: return s.cardStatus;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Completada';
      case 'pending': return 'Pendiente';
      case 'overdue': return 'Vencida';
      default: return status;
    }
  };

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
          <h1 style={s.title}>Declaraciones Tributarias</h1>
          <p style={s.subtitle}>
            Gestiona y consulta todas tus declaraciones de impuestos (IVA, Renta, ICA, Retención en la Fuente)
          </p>
        </div>

        <div style={s.grid}>
          {declarationsData.map((decl) => (
            <div
              key={decl.id}
              style={s.card}
              className="fade-in"
              onMouseEnter={e => e.currentTarget.style.transform = s.cardHover.transform}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            >
              <div style={s.cardIcon}>
                {decl.type === 'IVA' ? '💰' : decl.type === 'Renta' ? '📊' : '🏢'}
              </div>
              <h3 style={s.cardTitle}>{decl.type} - {decl.period}</h3>
              <p style={s.cardDescription}>{decl.description}</p>
              <div style={getStatusStyle(decl.status)}>
                {getStatusText(decl.status)}
              </div>
              <div style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--gray-600)', fontSize: '0.8rem' }}>Vence:</span>
                  <span style={{ fontWeight: '500', fontSize: '0.8rem' }}>{decl.dueDate}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--gray-600)', fontSize: '0.8rem' }}>Valor:</span>
                  <span style={{ fontWeight: '600', color: 'var(--gray-900)' }}>{fmt(decl.amount)}</span>
                </div>
                {decl.submittedDate && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                    <span style={{ color: 'var(--gray-600)', fontSize: '0.8rem' }}>Presentada:</span>
                    <span style={{ fontWeight: '500', fontSize: '0.8rem', color: 'var(--success)' }}>
                      {decl.submittedDate}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={s.upcomingSection}>
          <h2 style={s.upcomingTitle}>📅 Próximos Vencimientos</h2>
          <div className="table-container">
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Tipo</th>
                  <th style={s.th}>Período</th>
                  <th style={s.th}>Fecha Límite</th>
                  <th style={s.th}>Días Restantes</th>
                  <th style={s.th}>Importancia</th>
                </tr>
              </thead>
              <tbody>
                {upcomingDeadlines.map((deadline, index) => {
                  const dueDate = new Date(deadline.dueDate);
                  const today = new Date();
                  const daysRemaining = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <tr key={index} style={{ animationDelay: `${index * 0.05}s` }} className="fade-in">
                      <td style={s.td}>
                        <span style={{ fontWeight: '500' }}>{deadline.type}</span>
                      </td>
                      <td style={s.td}>{deadline.period}</td>
                      <td style={s.td}>{deadline.dueDate}</td>
                      <td style={{
                        ...s.td,
                        color: daysRemaining < 0 ? 'var(--danger)' : 
                               daysRemaining < 7 ? 'var(--warning)' : 'var(--success)',
                        fontWeight: '600',
                      }}>
                        {daysRemaining < 0 ? `Vencido hace ${Math.abs(daysRemaining)} días` : `${daysRemaining} días`}
                      </td>
                      <td style={s.td}>
                        <span className={`badge ${deadline.importance === 'high' ? 'badge-danger' : 'badge-warning'}`}>
                          {deadline.importance === 'high' ? 'Alta' : 'Media'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--gray-700)' }}>
            💡 Información Importante
          </h3>
          <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'var(--gray-600)', fontSize: '0.875rem' }}>
            <li style={{ marginBottom: '0.5rem' }}>Las declaraciones vencidas pueden generar multas e intereses</li>
            <li style={{ marginBottom: '0.5rem' }}>Consulta con tu contador para presentaciones complejas</li>
            <li>Mantén tus documentos de soporte organizados y disponibles</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
