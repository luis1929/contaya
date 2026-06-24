import { Link } from 'react-router-dom';

const styles = {
  section: { padding: '6rem 2rem', background: 'linear-gradient(135deg, #302b63, #0f0c29)', color: '#fff', textAlign: 'center' },
  container: { maxWidth: '700px', margin: '0 auto' },
  title: { fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: '700', marginBottom: '1rem' },
  subtitle: { color: '#94a3b8', fontSize: '1.125rem', lineHeight: '1.7', marginBottom: '2.5rem' },
  btn: { display: 'inline-block', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', padding: '1rem 2.5rem', borderRadius: '12px', border: 'none', fontSize: '1.125rem', fontWeight: '600', cursor: 'pointer', textDecoration: 'none', boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)' },
};

export default function Cta() {
  return (
    <section style={styles.section}>
      <div style={styles.container}>
        <h2 style={styles.title}>¿Listo para simplificar tu contabilidad?</h2>
        <p style={styles.subtitle}>
          Únete a miles de empresas que ya confían en Contaya para su gestión contable y fiscal.
        </p>
        <Link to="/register" style={styles.btn}>Comenzar prueba gratuita</Link>
      </div>
    </section>
  );
}
