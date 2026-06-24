import { Link } from 'react-router-dom';

const styles = {
  footer: { background: '#1e3a8a', color: '#bfdbfe', padding: '3rem 2rem 2rem' },
  container: { maxWidth: '1200px', margin: '0 auto' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '3rem', marginBottom: '2rem' },
  brand: { fontSize: '1.5rem', fontWeight: '700', color: '#fff', marginBottom: '0.75rem' },
  desc: { lineHeight: '1.7', fontSize: '0.9rem', maxWidth: '300px' },
  colTitle: { color: '#93c5fd', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' },
  link: { display: 'block', color: '#bfdbfe', textDecoration: 'none', fontSize: '0.9rem', marginBottom: '0.5rem', cursor: 'pointer' },
  bottom: { borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem' },
};

export default function Footer() {
  return (
    <footer style={styles.footer}>
      <div style={styles.container}>
        <div style={styles.grid}>
          <div>
            <div style={styles.brand}>Contaya</div>
            <p style={styles.desc}>Plataforma de facturación y gestión contable.</p>
          </div>
          <div>
            <div style={styles.colTitle}>Producto</div>
            <a href="#features" style={styles.link}>Características</a>
            <Link to="/login" style={styles.link}>Iniciar sesión</Link>
          </div>
          <div>
            <div style={styles.colTitle}>Contacto</div>
            <a href="#" style={styles.link}>Soporte</a>
            <a href="#" style={styles.link}>info@contaya.co</a>
          </div>
          <div>
            <div style={styles.colTitle}>Legal</div>
            <a href="#" style={styles.link}>Términos</a>
            <a href="#" style={styles.link}>Privacidad</a>
          </div>
        </div>
        <div style={styles.bottom}>
          &copy; {new Date().getFullYear()} Contaya. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
