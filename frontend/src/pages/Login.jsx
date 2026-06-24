import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const s = {
  section: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem',
  },
  card: {
    background: '#fff', borderRadius: '12px', padding: '3rem',
    width: '100%', maxWidth: '440px', boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: 'clamp(1.5rem, 4vw, 1.75rem)',
    fontWeight: '700', color: '#111827',
    marginBottom: '0.25rem', textAlign: 'center',
  },
  subtitle: {
    color: '#6b7280', textAlign: 'center',
    marginBottom: '2rem', fontSize: '0.95rem',
  },
  field: { marginBottom: '1.25rem' },
  label: {
    display: 'block', color: '#374151',
    fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.375rem',
  },
  input: {
    width: '100%', padding: '0.75rem 1rem',
    background: '#fff',
    border: '1px solid #d1d5db', borderRadius: '8px', color: '#111827',
    fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
  },
  btn: {
    width: '100%', padding: '0.875rem',
    background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px',
    fontSize: '1rem', fontWeight: '600', cursor: 'pointer',
  },
  link: {
    textAlign: 'center', marginTop: '1.5rem',
    color: '#6b7280', fontSize: '0.9rem',
  },
  linkA: { color: '#2563eb', textDecoration: 'none', fontWeight: '500' },
  error: { color: '#dc2626', fontSize: '0.875rem', textAlign: 'center', marginBottom: '1rem' },
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/dashboard');
    } catch {
      setError('Error de conexión');
    }
  }

  return (
    <section style={s.section}>
      <div style={s.card}>
        <h2 style={s.title}>Iniciar sesión</h2>
        <p style={s.subtitle}>Accede a tu panel de Contaya</p>
        {error && <p style={s.error}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <div style={s.field}>
            <label style={s.label}>Correo o NIT</label>
            <input style={s.input} type="text" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div style={s.field}>
            <label style={s.label}>Contraseña</label>
            <input style={s.input} type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
            <a href="/forgot-password" style={{ color: '#2563eb', fontSize: '0.85rem', textDecoration: 'none' }}>¿Olvidaste tu contraseña?</a>
          </div>
          <button style={s.btn} type="submit">Entrar</button>
        </form>
        <p style={s.link}>
          ¿No tienes cuenta?{' '}
          <Link to="/register" style={s.linkA}>Regístrate</Link>
        </p>
      </div>
    </section>
  );
}
