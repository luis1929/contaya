import { NavLink } from 'react-router-dom';
import SuplantarBiller from '../SuplantarBiller';

const adminLinks = [
  { to: '/admin', label: 'Dashboard', icon: '📊' },
  { to: '/admin/billers', label: 'Facturadores', icon: '👥' },
  { to: '/admin/audit-log', label: 'Auditoría', icon: '📋' },
  { to: '/admin/settings', label: 'Configuración', icon: '⚙️' },
];

const billerLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/facturas', label: 'Facturas', icon: '📄' },
  { to: '/clientes', label: 'Clientes', icon: '👤' },
  { to: '/upload', label: 'Documentos', icon: '📁' },
  { to: '/declarations', label: 'Declaraciones', icon: '💰' },
];

export default function Sidebar({ isAdmin, collapsed, onToggle }) {
  const links = isAdmin ? adminLinks : billerLinks;

  return (
    <aside
      className={`
        fixed left-0 top-0 h-full bg-white border-r border-gray-200 z-30
        transition-all duration-300 flex flex-col
        ${collapsed ? 'w-16' : 'w-64'}
      `}
    >
      <div className={`flex items-center h-16 px-4 border-b border-gray-100 ${collapsed ? 'justify-center' : ''}`}>
        {!collapsed && (
          <NavLink to={isAdmin ? '/admin' : '/dashboard'} className="text-xl font-extrabold text-primary-dark tracking-tight">
            Contaya
          </NavLink>
        )}
        {collapsed && (
          <NavLink to={isAdmin ? '/admin' : '/dashboard'} className="text-xl font-extrabold text-primary-dark">C</NavLink>
        )}
        <button
          onClick={onToggle}
          className={`p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors ${collapsed ? 'absolute -right-3 top-5 bg-white border border-gray-200 shadow-sm' : 'ml-auto'}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={collapsed ? 'M13 5l7 7-7 7M5 5l7 7-7 7' : 'M11 19l-7-7 7-7m8 14l-7-7 7-7'} />
          </svg>
        </button>
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/admin' || link.to === '/dashboard'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
              ${isActive
                ? 'bg-primary/10 text-primary shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }
              ${collapsed ? 'justify-center px-0' : ''}`
            }
          >
            <span className="text-lg">{link.icon}</span>
            {!collapsed && <span>{link.label}</span>}
          </NavLink>
        ))}

        {isAdmin && (
          <div className="pt-2 border-t border-gray-100 mt-2">
            <SuplantarBiller collapsed={collapsed} />
          </div>
        )}
      </nav>

      <div className={`p-4 border-t border-gray-100 ${collapsed ? 'text-center' : ''}`}>
        <button
          onClick={() => { localStorage.clear(); window.location.href = '/'; }}
          className={`flex items-center gap-2 text-sm text-gray-500 hover:text-danger transition-colors w-full ${collapsed ? 'justify-center' : ''}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {!collapsed && 'Cerrar sesión'}
        </button>
      </div>
    </aside>
  );
}
