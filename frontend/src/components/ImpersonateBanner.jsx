import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ImpersonateBanner() {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user?.impersonating) return null;

  function handleExit() {
    const adminToken = localStorage.getItem('admin_token');
    const adminUserRaw = localStorage.getItem('admin_user');
    if (adminToken) {
      localStorage.setItem('token', adminToken);
      localStorage.removeItem('admin_token');
      localStorage.removeItem('impersonating');
      localStorage.removeItem('impersonate_token');
      const adminUser = adminUserRaw ? JSON.parse(adminUserRaw) : { role: 'admin' };
      localStorage.setItem('user', JSON.stringify(adminUser));
      window.dispatchEvent(new Event('auth-change'));
      navigate('/admin');
    } else {
      localStorage.clear();
      window.location.href = '/login';
    }
  }

  return (
    <div className="flex items-center justify-center gap-3 px-6 py-2.5 bg-amber-500 text-white text-sm">
      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>
        Estás viendo como <strong>{user.name || 'Cliente'}</strong>
        {user.impersonatedByName && (
          <span className="opacity-80"> · suplantado por {user.impersonatedByName}</span>
        )}
      </span>
      <button
        onClick={handleExit}
        className="ml-2 rounded-md bg-white/20 px-3 py-1 text-xs font-semibold hover:bg-white/30 transition-colors"
      >
        Volver al Admin
      </button>
    </div>
  );
}
