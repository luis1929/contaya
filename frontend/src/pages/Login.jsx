import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const s = {
  section: {
    minHeight: '100vh',
    background: '#f8f9fc',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem',
  },
  card: {
    background: '#fff',
    border: '1px solid #e8ecf0',
    borderRadius: '16px', padding: '3rem',
    width: '100%', maxWidth: '480px',
  },
  title: {
    fontSize: 'clamp(1.5rem, 4vw, 2rem)',
    fontWeight: '800', color: '#062A51',
    marginBottom: '0.5rem', textAlign: 'center',
  },
  subtitle: {
    color: '#7a8a9f', textAlign: 'center',
    marginBottom: '2rem', fontSize: '0.95rem',
  },
  field: { marginBottom: '1.25rem' },
  label: {
    display: 'block', color: '#062A51',
    fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.375rem',
  },
  input: {
    width: '100%', padding: '0.75rem 1rem',
    background: '#fff',
    border: '1px solid #d0d5dd',
    borderRadius: '10px', color: '#062A51',
    fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
  },
  btn: {
    width: '100%', padding: '0.875rem',
    background: '#BE3B5E', color: '#fff', border: 'none', borderRadius: '12px',
    fontSize: '1rem', fontWeight: '700', cursor: 'pointer',
  },
  link: {
    textAlign: 'center', marginTop: '1.5rem',
    color: '#7a8a9f', fontSize: '0.9rem',
  },
  linkA: { color: '#BE3B5E', textDecoration: 'none', fontWeight: '600' },
  error: { color: '#e74c3c', fontSize: '0.875rem', textAlign: 'center', marginBottom: '1rem' },
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
      navigate(data.user.role === 'admin' ? '/admin' : '/dashboard');
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
            <input style={s.input} type="text" value={email} onChange={e => setEmail(e.target.value)} required placeholder="Correo o NIT" />
          </div>
          <div style={s.field}>
            <label style={s.label}>Contraseña</label>
            <input style={s.input} type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
            <Link to="/forgot-password" style={{ color: '#BE3B5E', fontSize: '0.85rem', textDecoration: 'none', fontWeight: '500' }}>¿Olvidaste tu contraseña?</Link>
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