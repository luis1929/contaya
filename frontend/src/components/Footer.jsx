const styles = {
  footer: { background: '#062A51', color: '#b0c4de', padding: '4rem 2rem 2rem' },
  container: { maxWidth: '1200px', margin: '0 auto' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '3rem', marginBottom: '3rem' },
  brand: { fontSize: '1.5rem', fontWeight: '700', color: '#fff', marginBottom: '0.75rem' },
  desc: { lineHeight: '1.7', fontSize: '0.9rem', maxWidth: '300px' },
  colTitle: { color: '#fff', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' },
  link: { display: 'block', color: '#b0c4de', textDecoration: 'none', fontSize: '0.9rem', marginBottom: '0.5rem', cursor: 'pointer' },
  bottom: { borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '2rem', textAlign: 'center', fontSize: '0.85rem' },
};

export default function Footer() {
  return (
    <footer style={styles.footer}>
      <div style={styles.container}>
        <div style={styles.grid}>
          <div>
            <div style={styles.brand}>Contaya</div>
            <p style={styles.desc}>Plataforma inteligente de gestión contable y fiscal para empresas modernas.</p>
          </div>
          <div>
            <div style={styles.colTitle}>Producto</div>
            <a href="#features" style={styles.link}>Características</a>
            <a href="#" style={styles.link}>FAQ</a>
          </div>
          <div>
            <div style={styles.colTitle}>Compañía</div>
            <a href="#" style={styles.link}>Sobre nosotros</a>
            <a href="#" style={styles.link}>Contacto</a>
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