import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

const links = [
  { label: 'Características', href: '#features' },
];

export default function Navbar() {
  const navigate = useNavigate();
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem('token'));
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    function check() { setLoggedIn(!!localStorage.getItem('token')); }
    window.addEventListener('auth-change', check);
    return () => window.removeEventListener('auth-change', check);
  }, []);

  function handleLogout() {
    localStorage.clear();
    window.dispatchEvent(new Event('auth-change'));
    navigate('/login');
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-100 bg-[var(--surface)] border-b border-[var(--border)] shadow-[var(--shadow-sm)]">
      <div className="max-w-[1200px] mx-auto flex items-center justify-between px-4 sm:px-8 h-[72px]">
        <Link to="/" className="flex items-center gap-2 no-underline text-[var(--primary-dark)] text-[1.35rem] font-bold">
          <div className="w-9 h-9 rounded-xl bg-[var(--primary-dark)] flex items-center justify-center text-base font-extrabold text-white shrink-0">
            C
          </div>
          Contaya
        </Link>

        <button
          className="md:hidden p-2 rounded-lg text-[var(--text-primary)] hover:bg-[var(--background)]"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>

        <div className="hidden md:flex items-center gap-1">
          {links.map((l, i) => (
            l.to ? (
              <Link key={i} to={l.to}
                className="text-[var(--text-primary)] no-underline text-sm font-medium px-4 py-2 rounded-lg hover:bg-[var(--background)] hover:text-[var(--primary-dark)] transition-[var(--transition)]">
                {l.label}
              </Link>
            ) : (
              <a key={i} href={l.href}
                className="text-[var(--text-primary)] no-underline text-sm font-medium px-4 py-2 rounded-lg hover:bg-[var(--background)] hover:text-[var(--primary-dark)] transition-[var(--transition)]">
                {l.label}
              </a>
            )
          ))}
          {loggedIn ? (
            <button onClick={handleLogout}
              className="text-sm font-medium px-4 py-2 rounded-lg bg-transparent text-[#e74c3c] border-none font-semibold cursor-pointer hover:text-[#c0392b] transition-colors">
              Cerrar sesión
            </button>
          ) : (
            <Link to="/login"
              className="text-sm font-semibold px-5 py-2 rounded-[15px] border-2 border-[var(--primary-dark)] text-[var(--primary-dark)] no-underline hover:bg-[var(--primary-dark)] hover:text-white transition-[var(--transition)] ml-3">
              Iniciar sesión
            </Link>
          )}
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-[var(--surface)] border-t border-[var(--border)] px-4 py-4 space-y-2">
          {links.map((l, i) => (
            l.to ? (
              <Link key={i} to={l.to} onClick={() => setMenuOpen(false)}
                className="block text-[var(--text-primary)] no-underline text-sm font-medium px-4 py-2 rounded-lg hover:bg-[var(--background)] hover:text-[var(--primary-dark)]">
                {l.label}
              </Link>
            ) : (
              <a key={i} href={l.href} onClick={() => setMenuOpen(false)}
                className="block text-[var(--text-primary)] no-underline text-sm font-medium px-4 py-2 rounded-lg hover:bg-[var(--background)] hover:text-[var(--primary-dark)]">
                {l.label}
              </a>
            )
          ))}
          {loggedIn ? (
            <button onClick={() => { setMenuOpen(false); handleLogout(); }}
              className="w-full text-left text-sm font-semibold px-4 py-2 rounded-lg bg-transparent text-[#e74c3c] border-none cursor-pointer hover:text-[#c0392b]">
              Cerrar sesión
            </button>
          ) : (
            <Link to="/login" onClick={() => setMenuOpen(false)}
              className="block text-center text-sm font-semibold px-5 py-2 rounded-[15px] border-2 border-[var(--primary-dark)] text-[var(--primary-dark)] no-underline hover:bg-[var(--primary-dark)] hover:text-white">
              Iniciar sesión
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
