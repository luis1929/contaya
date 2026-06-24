import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const s = {
  section: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem',
  },
  card: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '16px', padding: '3rem',
    width: '100%', maxWidth: '480px',
  },
  title: {
    fontSize: 'clamp(1.5rem, 4vw, 2rem)',
    fontWeight: '700', color: '#fff',
    marginBottom: '0.5rem', textAlign: 'center',
  },
  subtitle: {
    color: '#94a3b8', textAlign: 'center',
    marginBottom: '2rem', fontSize: '0.95rem',
  },
  field: { marginBottom: '1.25rem' },
  label: {
    display: 'block', color: '#cbd5e1',
    fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.375rem',
  },
  input: {
    width: '100%', padding: '0.75rem 1rem',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px', color: '#fff',
    fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
  },
  btn: {
    width: '100%', padding: '0.875rem',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff', border: 'none', borderRadius: '12px',
    fontSize: '1rem', fontWeight: '600', cursor: 'pointer',
  },
  link: {
    textAlign: 'center', marginTop: '1.5rem',
    color: '#94a3b8', fontSize: '0.9rem',
  },
  linkA: { color: '#818cf8', textDecoration: 'none', fontWeight: '500' },
  error: { color: '#f87171', fontSize: '0.875rem', textAlign: 'center', marginBottom: '1rem' },
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
            <label style={s.label}>Correo electrónico</label>
            <input style={s.input} type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div style={s.field}>
            <label style={s.label}>Contraseña</label>
            <input style={s.input} type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
            <a href="/forgot-password" style={{ color: '#818cf8', fontSize: '0.85rem', textDecoration: 'none' }}>¿Olvidaste tu contraseña?</a>
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
