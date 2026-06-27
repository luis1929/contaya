import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

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
    fontWeight: '800', color: '#062A51', marginBottom: '0.5rem', textAlign: 'center',
  },
  subtitle: {
    color: '#7a8a9f', textAlign: 'center', marginBottom: '2rem', fontSize: '0.95rem',
  },
  field: { marginBottom: '1.25rem' },
  label: { display: 'block', color: '#062A51', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.375rem' },
  input: {
    width: '100%', padding: '0.75rem 1rem', background: '#fff',
    border: '1px solid #d0d5dd', borderRadius: '10px', color: '#062A51',
    fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
  },
  btn: {
    width: '100%', padding: '0.875rem', background: '#BE3B5E', color: '#fff',
    border: 'none', borderRadius: '12px', fontSize: '1rem', fontWeight: '700', cursor: 'pointer',
  },
  back: { textAlign: 'center', marginTop: '1.5rem', color: '#7a8a9f', fontSize: '0.9rem' },
  backA: { color: '#BE3B5E', textDecoration: 'none', fontWeight: '600' },
  success: { color: '#0a8f4c', fontSize: '0.875rem', textAlign: 'center', marginBottom: '1rem' },
  error: { color: '#e74c3c', fontSize: '0.875rem', textAlign: 'center', marginBottom: '1rem' },
};

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (password !== confirm) return setError('Las contraseñas no coinciden');
    if (password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres');
    try {
      await api.resetPassword(email, password);
      setSuccess('Contraseña restablecida correctamente. Redirigiendo...');
      setTimeout(() => window.location.href = '/login', 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error de conexión');
    }
  }

  return (
    <section style={s.section}>
      <div style={s.card}>
        <h2 style={s.title}>Restablecer contraseña</h2>
        <p style={s.subtitle}>Ingresa tu correo y una nueva contraseña</p>
        {error && <p style={s.error}>{error}</p>}
        {success && <p style={s.success}>{success}</p>}
        <form onSubmit={handleSubmit}>
          <div style={s.field}>
            <label style={s.label}>Correo electrónico</label>
            <input style={s.input} type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div style={s.field}>
            <label style={s.label}>Nueva contraseña</label>
            <input style={s.input} type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <div style={s.field}>
            <label style={s.label}>Confirmar contraseña</label>
            <input style={s.input} type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
          </div>
          <button style={s.btn} type="submit">Restablecer</button>
        </form>
        <p style={s.back}>
          <Link to="/login" style={s.backA}>← Volver a iniciar sesión</Link>
        </p>
      </div>
    </section>
  );
}