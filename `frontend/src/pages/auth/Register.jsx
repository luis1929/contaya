import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('Las contraseñas no coinciden'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Oops, algo salió mal'); return; }
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/admin');
    } catch { setError('Error de conexión'); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-dark to-primary flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md animate-[fadeIn_0.5s_ease-out]">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">¡Regístrate!</h2>
          <p className="text-gray-500 mt-1">Únete como administrador</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-center">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {['name', 'email', 'password', 'confirm'].map(f => (
            <div key={f}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {f === 'name' ? 'Tu nombre' : f === 'email' ? 'Correo' : f === 'password' ? 'Contraseña' : 'Repite la contraseña'}
              </label>
              <input
                type={f === 'password' || f === 'confirm' ? 'password' : f === 'email' ? 'email' : 'text'}
                value={form[f]} onChange={e => setForm({ ...form, [f]: e.target.value })}
                placeholder={f === 'name' ? 'Ej: Juan Pérez' : f === 'email' ? 'tucorreo@example.com' : '••••••••'}
                required disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              />
            </div>
          ))}

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Registrando...</>
            ) : '¡Vamos!'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-gray-500">
          ¿Ya tienes cuenta? <Link to="/login" className="text-primary hover:text-primary-dark font-semibold">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
