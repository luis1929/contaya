import { useState } from 'react';
import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import Sidebar from './Sidebar';
import ImpersonateBanner from '../ImpersonateBanner';
import { useAuth } from '../../hooks/useAuth';

export default function BillerLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const { user, token, isAuthenticated } = useAuth();

  const effectiveToken = token || localStorage.getItem('impersonate_token');
  if (!effectiveToken) {
    navigate('/login');
    return null;
  }

  const isAdmin = user?.role === 'admin' && !user?.impersonating;

  return (
    <div className="min-h-screen bg-gray-50">
      <ImpersonateBanner />
      <Sidebar isAdmin={false} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className={`transition-all duration-300 ${collapsed ? 'ml-16' : 'ml-64'}`}>
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-20">
          <h1 className="text-sm font-medium text-gray-500">
            {user?.name || 'Facturador'}
          </h1>
          {isAdmin && (
            <NavLink to="/admin" className="text-sm text-primary hover:text-primary-dark font-medium">
              ← Volver al panel admin
            </NavLink>
          )}
        </header>
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
