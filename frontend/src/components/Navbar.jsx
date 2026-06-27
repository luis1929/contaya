import { Link } from 'react-router-dom';

const s = {
  nav: {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
    background: 'var(--surface)',
    borderBottom: '1px solid var(--border)',
    boxShadow: 'var(--shadow-sm)',
  },
  inner: {
    maxWidth: '1200px', margin: '0 auto',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 2rem', height: '72px',
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    textDecoration: 'none', color: 'var(--primary-dark)',
    fontSize: '1.35rem', fontWeight: '700',
  },
  logoIcon: {
    width: '36px', height: '36px', borderRadius: '10px',
    background: 'var(--primary-dark)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '1.1rem', fontWeight: '800', color: 'var(--white)', flexShrink: 0,
  },
  links: {
    display: 'flex', alignItems: 'center', gap: '0.25rem',
  },
  link: {
    color: 'var(--text-primary)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500',
    padding: '0.5rem 1rem', borderRadius: '8px',
    transition: 'var(--transition)',
  },
  linkHover: {
    background: 'var(--background)',
    color: 'var(--primary-dark)',
  },
  linkBtn: {
    color: 'var(--primary-dark)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '700',
    padding: '0.5rem 1.25rem', borderRadius: '15px',
    border: '2px solid var(--primary-dark)',
    marginLeft: '0.75rem',
    transition: 'var(--transition)',
  },
  linkBtnHover: {
    background: 'var(--primary-dark)',
    color: 'var(--white)',
  },
};

const links = [
  { label: 'Características', href: '#features' },
  { label: 'Dashboard', to: '/dashboard' },
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
            l.to ? (
              <Link 
                key={i} 
                to={l.to} 
                style={s.link}
                onMouseEnter={(e) => {
                  Object.assign(e.currentTarget.style, s.linkHover);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = s.link.color;
                }}
              >
                {l.label}
              </Link>
            ) : (
              <a 
                key={i} 
                href={l.href} 
                style={s.link}
                onMouseEnter={(e) => {
                  Object.assign(e.currentTarget.style, s.linkHover);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = s.link.color;
                }}
              >
                {l.label}
              </a>
            )
          ))}
          <Link 
            to="/login" 
            style={{ 
              ...s.link, 
              color: 'var(--primary-dark)',
              background: 'transparent',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              Object.assign(e.currentTarget.style, s.linkHover);
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--primary-dark)';
            }}
          >
            Iniciar sesión
          </Link>
          <Link 
            to="/register" 
            style={s.linkBtn}
            onMouseEnter={(e) => {
              Object.assign(e.currentTarget.style, s.linkBtnHover);
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = s.linkBtn.color;
            }}
          >
            Registrarse
          </Link>
        </div>
      </div>
    </nav>
  );
}