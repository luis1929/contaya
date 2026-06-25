import { Link } from 'react-router-dom';

const s = {
  nav: {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
    background: '#fff',
    borderBottom: '1px solid #e8ecf0',
  },
  inner: {
    maxWidth: '1200px', margin: '0 auto',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 2rem', height: '72px',
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    textDecoration: 'none', color: '#062A51',
    fontSize: '1.35rem', fontWeight: '700',
  },
  logoIcon: {
    width: '36px', height: '36px', borderRadius: '10px',
    background: '#BE3B5E',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '1.1rem', fontWeight: '800', color: '#fff', flexShrink: 0,
  },
  links: {
    display: 'flex', alignItems: 'center', gap: '0.25rem',
  },
  link: {
    color: '#062A51', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500',
    padding: '0.5rem 1rem', borderRadius: '8px',
  },
  linkBtn: {
    color: '#BE3B5E', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '700',
    padding: '0.5rem 1.25rem', borderRadius: '15px',
    border: '2px solid #BE3B5E',
    marginLeft: '0.75rem',
  },
};

const links = [
  { label: 'Características', href: '#features' },
];

export default function Navbar() {
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
          <Link to="/login" style={{ ...s.link, color: '#062A51' }}>Iniciar sesión</Link>
          <Link to="/register" style={s.linkBtn}>Registrarse</Link>
        </div>
      </div>
    </nav>
  );
}