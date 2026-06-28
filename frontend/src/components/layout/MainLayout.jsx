import { useState } from 'react';
import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import Sidebar from './Sidebar';
import ImpersonateBanner from '../ImpersonateBanner';
import { useAuth } from '../../hooks/useAuth';

const HEADER_LABELS = {
  admin: 'Panel de Administración',
  biller: 'Facturación Electrónica',
};

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const effectiveToken = token || localStorage.getItem('impersonate_token');
  const isAdmin = user?.role === 'admin';
  const impersonating = user?.impersonating || !!localStorage.getItem('impersonate_token');

  if (!effectiveToken) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <ImpersonateBanner />
      <Sidebar isAdmin={isAdmin && !impersonating} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className={`transition-all duration-300 ml-0 ${collapsed ? 'md:ml-16' : 'md:ml-64'}`}>
        <header className="h-16 bg-white/95 backdrop-blur-sm border-b border-gray-200 flex items-center justify-between px-4 md:px-6 sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              aria-label="Abrir menú"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-sm font-medium text-gray-500">
              {HEADER_LABELS[isAdmin ? 'admin' : 'biller']}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {isAdmin && impersonating && (
              <NavLink to="/admin" className="text-sm text-primary hover:text-primary-dark font-medium transition-colors">
                ← Volver al panel admin
              </NavLink>
            )}
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-sm text-gray-600 font-medium">{user?.name || 'Usuario'}</span>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center text-sm font-semibold shadow-sm">
                {(user?.name || 'U')[0]}
              </div>
              <button
                onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
                className="text-xs text-gray-400 hover:text-danger transition-colors font-medium ml-2"
              >
                Salir
              </button>
            </div>
          </div>
        </header>
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
