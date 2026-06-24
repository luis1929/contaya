import { useState } from 'react';
import { Link } from 'react-router-dom';

const s = {
  nav: {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
    background: 'rgba(7, 7, 18, 0.85)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
  inner: {
    maxWidth: '1200px', margin: '0 auto',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 2rem', height: '64px',
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    textDecoration: 'none', color: '#fff',
    fontSize: '1.25rem', fontWeight: '700',
  },
  logoIcon: {
    width: '32px', height: '32px', borderRadius: '8px',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '1rem', fontWeight: '800', flexShrink: 0,
  },
  links: {
    display: 'flex', alignItems: 'center', gap: '0.25rem',
  },
  link: {
    color: '#94a3b8', textDecoration: 'none', fontSize: '0.875rem',
    padding: '0.5rem 1rem', borderRadius: '8px',
    transition: 'background 0.2s',
  },
  linkBtn: {
    color: '#fff', textDecoration: 'none', fontSize: '0.875rem', fontWeight: '600',
    padding: '0.5rem 1.25rem', borderRadius: '8px',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    marginLeft: '0.5rem',
  },
  mobileBtn: {
    display: 'none', background: 'none', border: 'none', color: '#fff',
    fontSize: '1.5rem', cursor: 'pointer', padding: '0.5rem',
  },
  mobileMenu: {
    display: 'none', flexDirection: 'column', gap: '0.25rem',
    padding: '0 2rem 1.5rem',
  },
  mobileLink: {
    color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem',
    padding: '0.75rem 1rem', borderRadius: '8px', display: 'block',
  },
};

const links = [
  { label: 'Características', href: '#features' },
  { label: 'Facturas', href: '/facturas' },
  { label: 'Clientes', href: '/clientes' },
  { label: 'Precios', href: '#' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav style={s.nav}>
      <div style={s.inner}>
        <Link to="/" style={s.logo}>
          <div style={s.logoIcon}>C</div>
          Contaya
        </Link>

        <div style={{ ...s.links, display: 'flex', alignItems: 'center' }}>
          {links.map((l, i) => (
            <a key={i} href={l.href} style={s.link}>{l.label}</a>
          ))}
          <Link to="/login" style={{ ...s.link, color: '#cbd5e1' }}>Iniciar sesión</Link>
          <Link to="/register" style={s.linkBtn}>Empezar gratis</Link>
        </div>
      </div>
    </nav>
  );
}
