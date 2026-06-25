import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

const styles = {
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
  login: {
    textAlign: 'center', marginTop: '1.5rem',
    color: '#7a8a9f', fontSize: '0.9rem',
  },
  loginLink: { color: '#BE3B5E', textDecoration: 'none', fontWeight: '600' },
  error: { color: '#e74c3c', fontSize: '0.875rem', textAlign: 'center', marginBottom: '1rem' },
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
      const data = await api.register(name, email, password);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.dispatchEvent(new Event('auth-change'));
      navigate(data.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Error de conexión');
    }
  }

  return (
    <section style={styles.section}>
      <div style={styles.card}>
        <h2 style={styles.title}>Crear cuenta</h2>
        <p style={styles.subtitle}>Comienza tu prueba gratuita de 14 días</p>
        {error && <p style={styles.error}>{error}</p>}
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