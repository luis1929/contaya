import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../App.css';

const s = {
  section: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
  },
  card: {
    background: 'var(--white)',
    borderRadius: 'var(--radius-xl)',
    padding: '3rem',
    width: '100%',
    maxWidth: '440px',
    boxShadow: 'var(--shadow-lg)',
    animation: 'fadeIn 0.5s ease-out',
  },
  title: {
    fontSize: 'clamp(1.5rem, 4vw, 1.75rem)',
    fontWeight: '700',
    color: 'var(--gray-900)',
    marginBottom: '0.5rem',
    textAlign: 'center',
  },
  subtitle: {
    color: 'var(--gray-600)',
    textAlign: 'center',
    marginBottom: '2.5rem',
    fontSize: '0.95rem',
    lineHeight: '1.5',
  },
  field: {
    marginBottom: '1.5rem',
  },
  label: {
    display: 'block',
    color: 'var(--gray-700)',
    fontSize: '0.875rem',
    fontWeight: '500',
    marginBottom: '0.5rem',
  },
  input: {
    width: '100%',
    padding: '0.875rem 1rem',
    background: 'var(--white)',
    border: '1px solid var(--gray-300)',
    borderRadius: 'var(--radius)',
    color: 'var(--gray-900)',
    fontSize: '0.95rem',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'var(--transition)',
  },
  inputFocus: {
    borderColor: 'var(--primary)',
    boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.1)',
  },
  btn: {
    width: '100%',
    padding: '1rem',
    background: 'var(--primary)',
    color: 'var(--white)',
    border: 'none',
    borderRadius: 'var(--radius)',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'var(--transition)',
    marginTop: '0.5rem',
  },
  btnHover: {
    background: 'var(--primary-dark)',
    transform: 'translateY(-1px)',
    boxShadow: 'var(--shadow-md)',
  },
  link: {
    textAlign: 'center',
    marginTop: '2rem',
    color: 'var(--gray-600)',
    fontSize: '0.9rem',
  },
  linkA: {
    color: 'var(--primary)',
    textDecoration: 'none',
    fontWeight: '600',
    transition: 'var(--transition)',
  },
  linkAHover: {
    color: 'var(--primary-dark)',
    textDecoration: 'underline',
  },
  error: {
    color: 'var(--danger)',
    fontSize: '0.875rem',
    textAlign: 'center',
    marginBottom: '1.5rem',
    padding: '0.75rem',
    background: '#fee2e2',
    borderRadius: 'var(--radius)',
    border: '1px solid #fecaca',
  },
  loading: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
  },
  forgotPassword: {
    display: 'block',
    textAlign: 'right',
    marginBottom: '1.5rem',
    color: 'var(--primary)',
    fontSize: '0.85rem',
    textDecoration: 'none',
    fontWeight: '500',
    transition: 'var(--transition)',
  },
  forgotPasswordHover: {
    color: 'var(--primary-dark)',
    textDecoration: 'underline',
  },
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Credenciales incorrectas');
        return;
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/dashboard');
    } catch (err) {
      setError('Error de conexión. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section style={s.section}>
      <div style={s.card} className="fade-in">
        <h2 style={s.title}>Iniciar sesión</h2>
        <p style={s.subtitle}>Accede a tu panel de gestión contable</p>
        
        {error && <div style={s.error}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div style={s.field}>
            <label style={s.label}>Correo o NIT</label>
            <input
              style={{
                ...s.input,
                ...(focusedField === 'email' ? s.inputFocus : {}),
              }}
              type="text"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              placeholder="ejemplo@contaya.com o 123456789-0"
              required
              disabled={loading}
            />
          </div>
          
          <div style={s.field}>
            <label style={s.label}>Contraseña</label>
            <input
              style={{
                ...s.input,
                ...(focusedField === 'password' ? s.inputFocus : {}),
              }}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>
          
          <Link
            to="/forgot-password"
            style={s.forgotPassword}
            onMouseEnter={e => e.currentTarget.style.color = s.forgotPasswordHover.color}
            onMouseLeave={e => e.currentTarget.style.color = s.forgotPassword.color}
          >
            ¿Olvidaste tu contraseña?
          </Link>
          
          <button
            style={s.btn}
            type="submit"
            disabled={loading}
            onMouseEnter={e => !loading && (e.currentTarget.style.background = s.btnHover.background)}
            onMouseLeave={e => !loading && (e.currentTarget.style.background = s.btn.background)}
          >
            {loading ? (
              <span style={s.loading}>
                <div className="loading-spinner" style={{ width: '1rem', height: '1rem' }} />
                Procesando...
              </span>
            ) : (
              'Entrar'
            )}
          </button>
        </form>
        
        <p style={s.link}>
          ¿No tienes cuenta?{' '}
          <Link
            to="/register"
            style={s.linkA}
            onMouseEnter={e => e.currentTarget.style.color = s.linkAHover.color}
            onMouseLeave={e => e.currentTarget.style.color = s.linkA.color}
          >
            Regístrate
          </Link>
        </p>
      </div>
    </section>
  );
}
