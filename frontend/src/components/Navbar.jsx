import { useState } from 'react';
import { Link } from 'react-router-dom';

const s = {
  nav: {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
    background: '#fff',
    borderBottom: '1px solid #e5e7eb',
  },
  inner: {
    maxWidth: '1200px', margin: '0 auto',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 2rem', height: '64px',
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    textDecoration: 'none', color: '#1e40af',
    fontSize: '1.25rem', fontWeight: '700',
  },
  links: {
    display: 'flex', alignItems: 'center', gap: '0.25rem',
  },
  link: {
    color: '#4b5563', textDecoration: 'none', fontSize: '0.875rem',
    padding: '0.5rem 1rem', borderRadius: '8px',
    fontWeight: '500',
  },
  linkBtn: {
    color: '#fff', textDecoration: 'none', fontSize: '0.875rem', fontWeight: '600',
    padding: '0.5rem 1.5rem', borderRadius: '8px',
    background: '#2563eb',
    marginLeft: '0.5rem',
  },
};

export default function Navbar() {
  return (
    <nav style={s.nav}>
      <div style={s.inner}>
        <Link to="/" style={s.logo}>
          Contaya
        </Link>
        <div style={{ ...s.links, display: 'flex', alignItems: 'center' }}>
          <a href="#features" style={s.link}>Características</a>
          <Link to="/login" style={s.linkBtn}>Iniciar sesión</Link>
        </div>
      </div>
    </nav>
  );
}
