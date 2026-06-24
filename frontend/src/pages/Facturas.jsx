import { useState, useEffect, useCallback } from 'react';
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
  },
  backHover: {
    background: 'var(--gray-100)',
    color: 'var(--gray-800)',
  },
  main: {
    maxWidth: '1400px',
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
  filters: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginBottom: '2rem',
    padding: '1.5rem',
    background: 'var(--white)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--gray-200)',
    boxShadow: 'var(--shadow-sm)',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    color: 'var(--gray-700)',
    fontSize: '0.75rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  input: {
    padding: '0.625rem 0.875rem',
    background: 'var(--white)',
    border: '1px solid var(--gray-300)',
    borderRadius: 'var(--radius)',
    color: 'var(--gray-900)',
    fontSize: '0.875rem',
    outline: 'none',
    transition: 'var(--transition)',
  },
  inputFocus: {
    borderColor: 'var(--primary)',
    boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.1)',
  },
  select: {
    padding: '0.625rem 0.875rem',
    background: 'var(--white)',
    border: '1px solid var(--gray-300)',
    borderRadius: 'var(--radius)',
    color: 'var(--gray-900)',
    fontSize: '0.875rem',
    outline: 'none',
    cursor: 'pointer',
    transition: 'var(--transition)',
  },
  btnGroup: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'flex-end',
  },
  btn: {
    padding: '0.625rem 1.25rem',
    background: 'var(--primary)',
    color: 'var(--white)',
    border: 'none',
    borderRadius: 'var(--radius)',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'var(--transition)',
    height: '42px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  btnHover: {
    background: 'var(--primary-dark)',
    transform: 'translateY(-1px)',
    boxShadow: 'var(--shadow-md)',
  },
  btnSecondary: {
    background: 'var(--gray-100)',
    color: 'var(--gray-700)',
    border: '1px solid var(--gray-300)',
  },
  btnSecondaryHover: {
    background: 'var(--gray-200)',
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
    padding: '4rem',
    fontSize: '0.95rem',
    background: 'var(--white)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--gray-200)',
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
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '0.5rem',
    marginTop: '2rem',
    padding: '1rem',
  },
  pageBtn: {
    padding: '0.5rem 0.875rem',
    background: 'var(--white)',
    border: '1px solid var(--gray-300)',
    borderRadius: 'var(--radius)',
    color: 'var(--gray-700)',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'var(--transition)',
    minWidth: '2.5rem',
  },
  pageBtnActive: {
    background: 'var(--primary)',
    color: 'var(--white)',
    borderColor: 'var(--primary)',
  },
  pageBtnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
};

function fmt(n) {
  if (n == null) return '$0';
  return '$' + Number(n).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function calculateIVA(total) {
  return total * 0.19;
}

function calculateSubtotal(total) {
  return total / 1.19;
}

export default function Facturas() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [focusedField, setFocusedField] = useState(null);
  const [filters, setFilters] = useState({
    desde: '',
    hasta: '',
    cliente: '',
    estatus: '',
  });
  const [stats, setStats] = useState({
    total: 0,
    count: 0,
    iva: 0,
    subtotal: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const navigate = useNavigate();

  function authToken() {
    if (localStorage.getItem('impersonating')) return localStorage.getItem('impersonate_token');
    return localStorage.getItem('token');
  }

  function authFetch(url) {
    const token = authToken();
    return fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.desde) params.set('desde', filters.desde);
      if (filters.hasta) params.set('hasta', filters.hasta);
      if (filters.cliente) params.set('cliente', filters.cliente);
      if (filters.estatus) params.set('estatus', filters.estatus);
      
      const query = params.toString() ? '?' + params.toString() : '';
      const res = await authFetch('/api/invoices' + query);
      
      if (!res.ok) {
        navigate('/login');
        return;
      }
      
      const data = await res.json();
      setInvoices(data);
      
      // Calcular estadísticas
      const total = data.reduce((sum, inv) => sum + (inv.total || 0), 0);
      const iva = calculateIVA(total);
      const subtotal = calculateSubtotal(total);
      
      setStats({
        total,
        count: data.length,
        iva,
        subtotal,
      });
      
      setCurrentPage(1); // Resetear a primera página al filtrar
    } catch (error) {
      console.error('Error cargando facturas:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, navigate]);

  useEffect(() => {
    loadInvoices();
  }, []);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      desde: '',
      hasta: '',
      cliente: '',
      estatus: '',
    });
  };

  const handleApplyFilters = () => {
    loadInvoices();
  };

  // Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentInvoices = invoices.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(invoices.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          style={{
            ...s.pageBtn,
            ...(i === currentPage ? s.pageBtnActive : {}),
          }}
          onClick={() => handlePageChange(i)}
          onMouseEnter={e => i !== currentPage && (e.currentTarget.style.background = 'var(--gray-100)')}
          onMouseLeave={e => i !== currentPage && (e.currentTarget.style.background = 'var(--white)')}
        >
          {i}
        </button>
      );
    }

    return (
      <div style={s.pagination}>
        <button
          style={{
            ...s.pageBtn,
            ...(currentPage === 1 ? s.pageBtnDisabled : {}),
          }}
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          onMouseEnter={e => currentPage > 1 && (e.currentTarget.style.background = 'var(--gray-100)')}
          onMouseLeave={e => currentPage > 1 && (e.currentTarget.style.background = 'var(--white)')}
        >
          ← Anterior
        </button>
        {pages}
        <button
          style={{
            ...s.pageBtn,
            ...(currentPage === totalPages ? s.pageBtnDisabled : {}),
          }}
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          onMouseEnter={e => currentPage < totalPages && (e.currentTarget.style.background = 'var(--gray-100)')}
          onMouseLeave={e => currentPage < totalPages && (e.currentTarget.style.background = 'var(--white)')}
        >
          Siguiente →
        </button>
      </div>
    );
  };

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
        <a
          href="/dashboard"
          style={s.back}
          onMouseEnter={e => e.currentTarget.style.background = s.backHover.background}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          ← Volver al Dashboard
        </a>
      </div>
      
      <div style={s.main}>
        <div style={s.header}>
          <h1 style={s.title}>Facturas</h1>
          <p style={s.subtitle}>
            Gestiona y consulta todas tus facturas electrónicas
            {invoices.length > 0 && ` · ${invoices.length} facturas encontradas`}
          </p>
        </div>

        {!loading && invoices.length > 0 && (
          <div style={s.stats}>
            <div
              style={s.statCard}
              onMouseEnter={e => e.currentTarget.style.transform = s.statCardHover.transform}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            >
              <div style={s.statLabel}>Total Facturado</div>
              <div style={{ ...s.statValue, ...s.statValueAccent }}>{fmt(stats.total)}</div>
            </div>
            <div
              style={s.statCard}
              onMouseEnter={e => e.currentTarget.style.transform = s.statCardHover.transform}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            >
              <div style={s.statLabel}>Total IVA</div>
              <div style={s.statValue}>{fmt(stats.iva)}</div>
            </div>
            <div
              style={s.statCard}
              onMouseEnter={e => e.currentTarget.style.transform = s.statCardHover.transform}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            >
              <div style={s.statLabel}>Subtotal</div>
              <div style={s.statValue}>{fmt(stats.subtotal)}</div>
            </div>
            <div
              style={s.statCard}
              onMouseEnter={e => e.currentTarget.style.transform = s.statCardHover.transform}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            >
              <div style={s.statLabel}>Cantidad</div>
              <div style={s.statValue}>{stats.count}</div>
            </div>
          </div>
        )}

        <div style={s.filters}>
          <div style={s.field}>
            <label style={s.label}>Desde</label>
            <input
              style={{
                ...s.input,
                ...(focusedField === 'desde' ? s.inputFocus : {}),
              }}
              type="date"
              value={filters.desde}
              onChange={e => handleFilterChange('desde', e.target.value)}
              onFocus={() => setFocusedField('desde')}
              onBlur={() => setFocusedField(null)}
            />
          </div>
          
          <div style={s.field}>
            <label style={s.label}>Hasta</label>
            <input
              style={{
                ...s.input,
                ...(focusedField === 'hasta' ? s.inputFocus : {}),
              }}
              type="date"
              value={filters.hasta}
              onChange={e => handleFilterChange('hasta', e.target.value)}
              onFocus={() => setFocusedField('hasta')}
              onBlur={() => setFocusedField(null)}
            />
          </div>
          
          <div style={s.field}>
            <label style={s.label}>Cliente</label>
            <input
              style={{
                ...s.input,
                ...(focusedField === 'cliente' ? s.inputFocus : {}),
              }}
              type="text"
              value={filters.cliente}
              onChange={e => handleFilterChange('cliente', e.target.value)}
              onFocus={() => setFocusedField('cliente')}
              onBlur={() => setFocusedField(null)}
              placeholder="Buscar por nombre..."
            />
          </div>
          
          <div style={s.field}>
            <label style={s.label}>Estado</label>
            <select
              style={s.select}
              value={filters.estatus}
              onChange={e => handleFilterChange('estatus', e.target.value)}
              onFocus={() => setFocusedField('estatus')}
              onBlur={() => setFocusedField(null)}
            >
              <option value="">Todos los estados</option>
              <option value="Firmado">Firmado</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Anulado">Anulado</option>
            </select>
          </div>
          
          <div style={s.btnGroup}>
            <button
              style={s.btn}
              onClick={handleApplyFilters}
              onMouseEnter={e => e.currentTarget.style.background = s.btnHover.background}
              onMouseLeave={e => e.currentTarget.style.background = s.btn.background}
            >
              🔍 Filtrar
            </button>
            
            <button
              style={{ ...s.btn, ...s.btnSecondary }}
              onClick={handleClearFilters}
              onMouseEnter={e => e.currentTarget.style.background = s.btnSecondaryHover.background}
              onMouseLeave={e => e.currentTarget.style.background = s.btnSecondary.background}
            >
              🗑️ Limpiar
            </button>
          </div>
        </div>

        {loading ? (
          <div style={s.loading}>
            <div className="loading-spinner" style={{ width: '3rem', height: '3rem' }} />
            <p>Cargando facturas...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div style={s.empty}>
            <p style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>📄 No se encontraron facturas</p>
            <p>Intenta ajustar los filtros o verifica que tengas facturas registradas.</p>
          </div>
        ) : (
          <>
            <div className="table-container fade-in">
              <table className="table">
                <thead>
                  <tr>
                    <th>NCF</th>
                    <th>Cliente</th>
                    <th>Fecha</th>
                    <th>Total</th>
                    <th>IVA 19%</th>
                    <th>Subtotal</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {currentInvoices.map((inv, index) => (
                    <tr key={inv.id} style={{ animationDelay: `${index * 0.05}s` }} className="fade-in">
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: '500' }}>
                        {inv.ncf}
                      </td>
                      <td>
                        <div style={{ fontWeight: '500' }}>
                          {inv.client_name || (inv.client || '').split('...')[0]}
                        </div>
                        {inv.client_email && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>
                            {inv.client_email}
                          </div>
                        )}
                      </td>
                      <td>{inv.created_at?.slice(0, 10)}</td>
                      <td style={{ fontWeight: '600', color: 'var(--gray-900)' }}>
                        {fmt(inv.total)}
                      </td>
                      <td style={{ color: 'var(--primary)', fontWeight: '500' }}>
                        {fmt(calculateIVA(inv.total))}
                      </td>
                      <td style={{ color: 'var(--gray-600)' }}>
                        {fmt(calculateSubtotal(inv.total))}
                      </td>
                      <td>
                        <span className={`badge ${inv.status === 'Firmado' ? 'badge-success' : 'badge-warning'}`}>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {renderPagination()}

            <div style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--gray-500)', fontSize: '0.875rem' }}>
              Mostrando {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, invoices.length)} de {invoices.length} facturas
            </div>
          </>
        )}
      </div>
    </div>
  );
}
