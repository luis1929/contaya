import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const styles = {
  section: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
  },
  card: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '16px',
    padding: '3rem',
    width: '100%',
    maxWidth: '480px',
  },
  title: {
    fontSize: 'clamp(1.5rem, 4vw, 2rem)',
    fontWeight: '700',
    color: '#fff',
    marginBottom: '0.5rem',
    textAlign: 'center',
  },
  subtitle: {
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: '2rem',
    fontSize: '0.95rem',
  },
  field: {
    marginBottom: '1.25rem',
  },
  label: {
    display: 'block',
    color: '#cbd5e1',
    fontSize: '0.875rem',
    fontWeight: '500',
    marginBottom: '0.375rem',
  },
  input: {
    width: '100%',
    padding: '0.75rem 1rem',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '0.95rem',
    outline: 'none',
    boxSizing: 'border-box',
  },
  row: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1.5rem',
    alignItems: 'center',
  },
  checkbox: {
    accentColor: '#6366f1',
    width: '16px',
    height: '16px',
  },
  checkLabel: {
    color: '#94a3b8',
    fontSize: '0.875rem',
  },
  btn: {
    width: '100%',
    padding: '0.875rem',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  login: {
    textAlign: 'center',
    marginTop: '1.5rem',
    color: '#94a3b8',
    fontSize: '0.9rem',
  },
  loginLink: {
    color: '#818cf8',
    textDecoration: 'none',
    fontWeight: '500',
  },
};

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
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
    <section style={styles.section}>
      <div style={styles.card}>
        <h2 style={styles.title}>Crear cuenta</h2>
        <p style={styles.subtitle}>Comienza tu prueba gratuita de 14 días</p>
        {error && <p style={{ ...styles.checkLabel, color: '#f87171', textAlign: 'center', marginBottom: '1rem' }}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Nombre completo</label>
            <input style={styles.input} type="text" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Correo electrónico</label>
            <input style={styles.input} type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Contraseña</label>
            <input style={styles.input} type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
          </div>
          <button style={styles.btn} type="submit">Crear cuenta</button>
        </form>
        <p style={styles.login}>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" style={styles.loginLink}>Inicia sesión</Link>
        </p>
      </div>
    </section>
  );
}
