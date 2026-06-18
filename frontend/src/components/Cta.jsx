import { Link } from 'react-router-dom';

const styles = {
  section: {
    padding: '6rem 2rem',
    background: 'linear-gradient(135deg, #302b63, #0f0c29)',
    color: '#fff',
    textAlign: 'center',
  },
  container: {
    maxWidth: '700px',
    margin: '0 auto',
  },
  title: {
    fontSize: 'clamp(2rem, 4vw, 3rem)',
    fontWeight: '700',
    marginBottom: '1rem',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: '1.125rem',
    lineHeight: '1.7',
    marginBottom: '2.5rem',
  },
  btn: {
    display: 'inline-block',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff',
    padding: '1rem 2.5rem',
    borderRadius: '12px',
    border: 'none',
    fontSize: '1.125rem',
    fontWeight: '600',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'transform 0.2s, box-shadow 0.2s',
    boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
  },
};

export default function Cta() {
  return (
    <section style={styles.section}>
      <div style={styles.container}>
        <h2 style={styles.title}>¿Listo para transformar tu menú?</h2>
        <p style={styles.subtitle}>
          Únete a cientos de restaurantes que ya confían en Contaya para gestionar sus menús de forma profesional.
        </p>
        <Link to="/register" style={styles.btn}>
          Prueba gratuita por 14 días
        </Link>
      </div>
    </section>
  );
}
