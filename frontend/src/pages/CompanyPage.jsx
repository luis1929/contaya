import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';

const s = {
  page: {
    minHeight: '100vh',
    background: 'var(--background)',
    color: 'var(--primary-dark)',
    fontFamily: 'Roboto, system-ui, sans-serif',
  },
  top: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '1rem 2rem', background: 'var(--surface)',
    borderBottom: '1px solid var(--border)',
  },
  logo: { 
    fontSize: '1.25rem', 
    fontWeight: '700', 
    color: 'var(--primary)', 
    textDecoration: 'none',
    transition: 'var(--transition)',
    ':hover': { color: 'var(--primary-dark)' }
  },
  topLink: { 
    color: 'var(--text-secondary)', 
    textDecoration: 'none', 
    fontSize: '0.85rem', 
    fontWeight: '500', 
    marginRight: '1.25rem',
    transition: 'var(--transition)',
    ':hover': { 
      color: 'var(--primary-dark)'
    }
  },
  logout: {
    background: 'none', 
    border: '1px solid var(--primary-dark)',
    color: 'var(--primary-dark)', 
    padding: '0.4rem 1rem', 
    borderRadius: '15px',
    cursor: 'pointer', 
    fontSize: '0.8rem', 
    fontWeight: '600',
    transition: 'var(--transition)',
    ':hover': {
      background: 'var(--primary-dark)',
      color: 'var(--white)'
    }
  },
  main: { maxWidth: '700px', margin: '0 auto', padding: '2rem' },
  title: { fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.25rem', color: 'var(--primary-dark)' },
  subtitle: { color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' },
  card: {
    background: 'var(--surface)', 
    border: '1px solid var(--border)',
    borderRadius: '16px', 
    padding: '2rem',
    transition: 'var(--transition)',
    ':hover': { boxShadow: 'var(--shadow-md)' }
  },
  field: { marginBottom: '1.25rem' },
  label: { 
    display: 'block', 
    color: 'var(--primary-dark)', 
    fontSize: '0.875rem', 
    fontWeight: '600', 
    marginBottom: '0.375rem'
  },
  input: {
    width: '100%', 
    padding: '0.75rem 1rem',
    background: 'var(--surface)', 
    border: '1px solid var(--border)',
    borderRadius: '10px', 
    color: 'var(--primary-dark)',
    fontSize: '0.95rem', 
    outline: 'none', 
    boxSizing: 'border-box',
    transition: 'var(--transition)',
    ':focus': {
      borderColor: 'var(--primary)',
      boxShadow: '0 0 0 2px rgba(37, 99, 235, 0.1)'
    }
  },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  btn: {
    padding: '0.75rem 2rem', 
    background: 'var(--primary-dark)', 
    color: 'var(--white)',
    border: 'none', 
    borderRadius: '12px', 
    fontSize: '1rem', 
    fontWeight: '700',
    cursor: 'pointer', 
    marginTop: '0.5rem',
    transition: 'var(--transition)',
    ':hover': {
      background: 'var(--primary)',
      boxShadow: 'var(--shadow-sm)'
    },
    ':active': { transform: 'translateY(1px)' }
  },
  success: { color: '#0a8f4c', fontSize: '0.875rem', marginTop: '0.75rem', textAlign: 'center' },
  loading: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '100vh', color: 'var(--text-muted)', fontSize: '1rem',
  },
};

export default function CompanyPage() {
  const [form, setForm] = useState({ name: '', rnc: '', address: '', email: '', phone: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');
    api.getCompany()
      .then(data => { if (data) setForm(data); })
      .catch(() => { localStorage.clear(); window.dispatchEvent(new Event('auth-change')); navigate('/login'); })
      .finally(() => setLoading(false));
  }, [navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setSuccess('');
    try {
      const data = await api.updateCompany(form);
      setForm(data);
      setSuccess('Datos guardados correctamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setSuccess('Error al guardar');
    }
    setSaving(false);
  }

  function handleLogout() {
    localStorage.clear();
    window.dispatchEvent(new Event('auth-change'));
    navigate('/');
  }

  function set(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  if (loading) return <div style={s.loading}>Cargando...</div>;

  return (
    <div style={s.page}>
      <div style={s.top}>
        <a href="/" style={s.logo}>Contaya</a>
        <div>
          <a href="/dashboard" style={s.topLink}>Dashboard</a>
          <a href="/facturas" style={s.topLink}>Facturas</a>
          <button style={s.logout} onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </div>
      <div style={s.main}>
        <h1 style={s.title}>Mi empresa</h1>
        <p style={s.subtitle}>Datos del facturador que aparecerán en las facturas</p>

        <div style={s.card}>
          <form onSubmit={handleSubmit}>
            <div style={s.field}>
              <label style={s.label}>Nombre de la empresa</label>
              <input style={s.input} type="text" value={form.name} onChange={set('name')} required />
            </div>
            <div style={s.row}>
              <div style={s.field}>
                <label style={s.label}>RNC / NIT</label>
                <input style={s.input} type="text" value={form.rnc} onChange={set('rnc')} />
              </div>
              <div style={s.field}>
                <label style={s.label}>Teléfono</label>
                <input style={s.input} type="text" value={form.phone} onChange={set('phone')} />
              </div>
            </div>
            <div style={s.field}>
              <label style={s.label}>Dirección</label>
              <input style={s.input} type="text" value={form.address} onChange={set('address')} />
            </div>
            <div style={s.field}>
              <label style={s.label}>Correo electrónico</label>
              <input style={s.input} type="email" value={form.email} onChange={set('email')} />
            </div>
            <button style={s.btn} type="submit" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar datos'}
            </button>
            {success && <p style={s.success}>{success}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}