import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'temporal123' }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error'); return; }
      setMessage('Se ha restablecido tu contraseña a: temporal123');
    } catch { setError('Error de conexión'); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-dark to-primary flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md animate-[fadeIn_0.5s_ease-out]">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Recuperar contraseña</h2>
          <p className="text-gray-500 mt-1">Ingresa tu correo para restablecer</p>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-center">{error}</div>}
        {message && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm text-center">{message}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Correo electrónico</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com" required disabled={loading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
            />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? 'Procesando...' : 'Recuperar'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-gray-500">
          <Link to="/login" className="text-primary hover:text-primary-dark font-semibold">← Volver al login</Link>
        </p>
      </div>
    </div>
  );
}
