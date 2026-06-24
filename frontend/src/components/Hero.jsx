import { Link } from 'react-router-dom';

const styles = {
    section: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
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
    background: 'radial-gradient(circle at 30% 50%, rgba(99, 102, 241, 0.1), transparent 60%)',
  },
  content: {
    position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '800px',
  },
  badge: {
    display: 'inline-block', background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc',
    padding: '0.5rem 1.5rem', borderRadius: '50px', fontSize: '0.875rem',
    letterSpacing: '0.05em', marginBottom: '2rem',
    border: '1px solid rgba(99, 102, 241, 0.3)',
  },
  title: {
    fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: '800', color: '#fff',
    lineHeight: '1.1', marginBottom: '1.5rem',
  },
  gradient: {
    background: 'linear-gradient(135deg, #818cf8, #c084fc)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    fontSize: 'clamp(1rem, 2vw, 1.25rem)', color: '#94a3b8',
    lineHeight: '1.7', marginBottom: '2.5rem', maxWidth: '600px',
    margin: '0 auto 2.5rem',
  },
  buttons: {
    display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap',
  },
  btnPrimary: {
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff',
    padding: '0.875rem 2.5rem', borderRadius: '12px', border: 'none',
    fontSize: '1rem', fontWeight: '600', cursor: 'pointer', textDecoration: 'none',
  },
  btnSecondary: {
    background: 'transparent', color: '#e2e8f0', padding: '0.875rem 2.5rem',
    borderRadius: '12px', border: '1px solid #475569', fontSize: '1rem',
    fontWeight: '600', cursor: 'pointer', textDecoration: 'none',
  },
};

export default function Hero() {
  return (
    <section style={styles.section}>
      <div style={styles.overlay} />
      <div style={styles.content}>
        <div style={styles.badge}>Plataforma de Gestión Contable</div>
        <h1 style={styles.title}>
          Contabilidad inteligente <br />
          <span style={styles.gradient}>para tu negocio</span>
        </h1>
        <p style={styles.subtitle}>
          Gestiona facturas, extractos bancarios, notas de crédito y genera 
          declaraciones de IVA y Renta de forma automatizada. Todo en un solo lugar.
        </p>
        <div style={styles.buttons}>
          <Link to="/dashboard" style={styles.btnPrimary}>Ir al Dashboard</Link>
          <a href="#features" style={styles.btnSecondary}>Ver características</a>
        </div>
      </div>
    </section>
  );
}
