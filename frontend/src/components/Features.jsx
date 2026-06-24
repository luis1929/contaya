const features = [
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
    title: 'Facturación Electrónica',
    desc: 'Gestiona y consulta tus facturas electrónicas con filtros por fecha, cliente y estado.',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
    title: 'Múltiples Facturadores',
    desc: 'Varios facturadores (billers) pueden acceder con su NIT y contraseña, cada uno ve solo sus facturas.',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/>
      </svg>
    ),
    title: 'Dashboard Inteligente',
    desc: 'Resumen con total facturado, cantidad de facturas y promedios. Datos claros de un vistazo.',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
      </svg>
    ),
    title: 'Scraping Automático',
    desc: 'Importa facturas desde plataformas externas con scraping automatizado.',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
      </svg>
    ),
    title: 'Clientes por Facturador',
    desc: 'Cada facturador ve sus propios clientes con el total facturado.',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    title: 'Seguro y Confiable',
    desc: 'Autenticación JWT, cada usuario accede solo a sus datos. Datos en PostgreSQL.',
  },
];

const styles = {
  section: { padding: '6rem 2rem', background: '#f8fafc' },
  container: { maxWidth: '1200px', margin: '0 auto' },
  header: { textAlign: 'center', marginBottom: '4rem' },
  label: { color: '#2563eb', fontSize: '0.875rem', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1rem' },
  title: { fontSize: 'clamp(2rem, 4vw, 2.5rem)', fontWeight: '700', color: '#111827', marginBottom: '1rem' },
  subtitle: { color: '#6b7280', fontSize: '1.125rem', maxWidth: '600px', margin: '0 auto' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' },
  card: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '2rem' },
  iconBox: { width: '56px', height: '56px', background: '#eff6ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' },
  cardTitle: { fontSize: '1.2rem', fontWeight: '600', marginBottom: '0.75rem', color: '#111827' },
  cardDesc: { color: '#6b7280', lineHeight: '1.7', fontSize: '0.95rem' },
};

export default function Features() {
  return (
    <section id="features" style={styles.section}>
      <div style={styles.container}>
        <div style={styles.header}>
          <p style={styles.label}>Características</p>
          <h2 style={styles.title}>Todo para tu gestión contable</h2>
          <p style={styles.subtitle}>Herramientas profesionales diseñadas para contadores y dueños de negocio</p>
        </div>
        <div style={styles.grid}>
          {features.map((f, i) => (
            <div key={i} style={styles.card}>
              <div style={styles.iconBox}>{f.icon}</div>
              <h3 style={styles.cardTitle}>{f.title}</h3>
              <p style={styles.cardDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
