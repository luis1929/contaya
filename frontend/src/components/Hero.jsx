const styles = {
  section: {
    padding: '10rem 2rem 6rem',
    background: 'linear-gradient(135deg, #f8f9fc 0%, #eef1f7 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '90vh',
  },
  content: {
    textAlign: 'center', maxWidth: '850px',
  },
  badge: {
    display: 'inline-block', background: '#BE3B5E', color: '#fff',
    padding: '0.4rem 1.25rem', borderRadius: '50px', fontSize: '0.8rem',
    fontWeight: '600', letterSpacing: '0.05em', marginBottom: '2rem',
  },
  title: {
    fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: '800', color: '#062A51',
    lineHeight: '1.15', marginBottom: '1.5rem',
  },
  gradient: {
    color: '#BE3B5E',
  },
  subtitle: {
    fontSize: 'clamp(1rem, 1.8vw, 1.2rem)', color: '#4a5a72',
    lineHeight: '1.7', marginBottom: '2.5rem', maxWidth: '650px',
    margin: '0 auto 2.5rem',
  },
  buttons: {
    display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap',
  },
  btnPrimary: {
    background: '#BE3B5E', color: '#fff',
    padding: '0.875rem 2.5rem', borderRadius: '15px', border: 'none',
    fontSize: '1rem', fontWeight: '700', cursor: 'pointer', textDecoration: 'none',
  },
  btnSecondary: {
    background: 'transparent', color: '#062A51', padding: '0.875rem 2.5rem',
    borderRadius: '15px', border: '2px solid #062A51', fontSize: '1rem',
    fontWeight: '700', cursor: 'pointer', textDecoration: 'none',
  },
};

export default function Hero() {
  return (
    <section style={styles.section}>
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
          <a href="#features" style={styles.btnSecondary}>Ver características</a>
        </div>
      </div>
    </section>
  );
}