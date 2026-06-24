import { Link } from 'react-router-dom';

const styles = {
  section: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1e3a8a, #2563eb, #1d4ed8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6rem 2rem 4rem',
    position: 'relative',
    overflow: 'hidden',
  },
  overlay: {
    position: 'absolute',
    top: '-50%', left: '-50%',
    width: '200%', height: '200%',
    background: 'radial-gradient(circle at 70% 30%, rgba(255,255,255,0.08), transparent 60%)',
  },
  content: {
    position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '720px',
  },
  title: {
    fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: '800', color: '#fff',
    lineHeight: '1.15', marginBottom: '1.5rem',
  },
  subtitle: {
    fontSize: 'clamp(1rem, 1.8vw, 1.2rem)', color: '#bfdbfe',
    lineHeight: '1.7', marginBottom: '2.5rem', maxWidth: '560px',
    margin: '0 auto 2.5rem',
  },
  buttons: {
    display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap',
  },
  btnPrimary: {
    background: '#fff', color: '#1e40af',
    padding: '0.875rem 2.5rem', borderRadius: '8px', border: 'none',
    fontSize: '1rem', fontWeight: '600', cursor: 'pointer', textDecoration: 'none',
  },
  btnSecondary: {
    background: 'transparent', color: '#fff', padding: '0.875rem 2.5rem',
    borderRadius: '8px', border: '2px solid rgba(255,255,255,0.5)', fontSize: '1rem',
    fontWeight: '600', cursor: 'pointer', textDecoration: 'none',
  },
};

export default function Hero() {
  return (
    <section style={styles.section}>
      <div style={styles.overlay} />
      <div style={styles.content}>
        <h1 style={styles.title}>
          Contabilidad inteligente para tu negocio
        </h1>
        <p style={styles.subtitle}>
          Gestiona facturas electrónicas, clientes y declaraciones DIAN 
          en una plataforma simple y eficiente.
        </p>
        <div style={styles.buttons}>
          <Link to="/login" style={styles.btnPrimary}>Iniciar sesión</Link>
          <a href="#features" style={styles.btnSecondary}>Características</a>
        </div>
      </div>
    </section>
  );
}
