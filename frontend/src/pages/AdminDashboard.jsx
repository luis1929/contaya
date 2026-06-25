import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

const s = {
  page: { minHeight: '100vh', background: '#f4f7fc', color: '#1e293b', fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif' },
  top: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 2rem', background: '#062a51', color: '#fff' },
  main: { maxWidth: '1200px', margin: '0 auto', padding: '2rem' },
  title: { fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.25rem' },
  subtitle: { color: '#64748b', fontSize: '0.9rem', marginBottom: '2rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1rem' },
  card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem' },
  name: { fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.5rem' },
  meta: { color: '#64748b', fontSize: '0.8rem', marginBottom: '0.25rem' },
  badge: (v) => ({ display: 'inline-block', padding: '0.2rem 0.5rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: '600', background: v ? '#dcfce7' : '#fef9c3', color: v ? '#166534' : '#854d0e' }),
  actions: { display: 'flex', gap: '0.5rem', marginTop: '0.75rem' },
  btn: (c = '#2563eb') => ({ padding: '0.4rem 0.8rem', background: c, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer' }),
  stats: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' },
  statCard: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem', textAlign: 'center' },
  statValue: { fontSize: '1.5rem', fontWeight: '700', color: '#062a51' },
  statLabel: { fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' },
};

export default function AdminDashboard() {
  const [billers, setBillers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    if (u.role !== 'admin') return navigate('/login');
    api.getBillers().then(setBillers).catch(() => navigate('/login')).finally(() => setLoading(false));
  }, []);

  async function handleImpersonate(biller) {
    try {
      const data = await api.impersonate(biller.id);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({ ...data.biller, role: 'biller', impersonating: true }));
      localStorage.setItem('admin_token', localStorage.getItem('token'));
      navigate('/dashboard');
    } catch { alert('Error al impersonar'); }
  }

  async function toggleActive(biller) {
    try {
      const updated = await api.updateBiller(biller.id, { is_active: !biller.is_active });
      setBillers(prev => prev.map(b => b.id === updated.id ? updated : b));
    } catch { alert('Error al actualizar'); }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este facturador?')) return;
    try {
      await api.deleteBiller(id);
      setBillers(prev => prev.filter(b => b.id !== id));
    } catch { alert('Error al eliminar'); }
  }

  const totalClients = billers.reduce((sum, b) => sum + (b.client_count || 0), 0);

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#94a3b8' }}>Cargando...</div>;

  return (
    <div style={s.page}>
      <div style={s.top}>
        <span style={{ fontSize: '1.1rem', fontWeight: '700' }}>Contaya — Panel Admin</span>
        <button style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', padding: '0.4rem 1rem', borderRadius: '5px', cursor: 'pointer' }} onClick={() => { localStorage.clear(); navigate('/'); }}>Cerrar sesión</button>
      </div>
      <div style={s.main}>
        <h1 style={s.title}>Administración</h1>
        <p style={s.subtitle}>Gestiona facturadores, activa/desactiva cuentas e impersona para auditar</p>

        <div style={s.stats}>
          <div style={s.statCard}><div style={s.statValue}>{billers.length}</div><div style={s.statLabel}>Facturadores</div></div>
          <div style={s.statCard}><div style={s.statValue}>{totalClients}</div><div style={s.statLabel}>Clientes</div></div>
        </div>

        <div style={s.grid}>
          {billers.map(b => (
            <div key={b.id} style={s.card}>
              <div style={s.name}>{b.name}</div>
              <div style={s.meta}>RNC: {b.document_number || '—'}  |  {b.email || '—'}</div>
              <div style={s.meta}>Ciudad: {b.city || '—'}  |  Tel: {b.phone || '—'}</div>
              <div style={{ margin: '0.5rem 0' }}><span style={s.badge(b.is_active)}>{b.is_active ? 'Activo' : 'Inactivo'}</span></div>
              <div style={s.actions}>
                <button style={s.btn('#2563eb')} onClick={() => handleImpersonate(b)}>Entrar como</button>
                <button style={s.btn(b.is_active ? '#f59e0b' : '#10b981')} onClick={() => toggleActive(b)}>{b.is_active ? 'Desactivar' : 'Activar'}</button>
                <button style={s.btn('#ef4444')} onClick={() => handleDelete(b.id)}>Eliminar</button>
              </div>
            </div>
          ))}
          {billers.length === 0 && <p style={{ color: '#94a3b8', gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>No hay facturadores registrados</p>}
        </div>
      </div>
    </div>
  );
}