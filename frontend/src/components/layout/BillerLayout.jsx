import { useState } from 'react';
import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import Sidebar from './Sidebar';
import ImpersonateBanner from '../ImpersonateBanner';

export default function BillerLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const token = localStorage.getItem('token') || localStorage.getItem('impersonate_token');
  if (!token) {
    navigate('/login');
    return null;
  }

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin' && !localStorage.getItem('impersonating');

  return (
    <div className="min-h-screen bg-gray-50">
      <ImpersonateBanner />
      <Sidebar isAdmin={false} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className={`transition-all duration-300 ${collapsed ? 'ml-16' : 'ml-64'}`}>
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-20">
          <h1 className="text-sm font-medium text-gray-500">
            {user.name || 'Facturador'}
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
