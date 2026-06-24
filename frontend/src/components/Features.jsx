const features = [
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
    title: 'Gestión de Facturas',
    desc: 'Sube y procesa facturas en PDF. Extracción automática de datos como RNC, NCF, montos y fechas.',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/>
      </svg>
    ),
    title: 'Declaración de IVA',
    desc: 'Calcula automáticamente el ITBIS y genera las declaraciones mensuales de IVA listas para presentar.',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
      </svg>
    ),
    title: 'Declaración de Renta',
    desc: 'Prepara tu declaración anual de ISR con base en ingresos, gastos y retenciones registradas.',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
      </svg>
    ),
    title: 'Conciliación Bancaria',
    desc: 'Importa extractos bancarios y concilia automáticamente con tus facturas y movimientos registrados.',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
      </svg>
    ),
    title: 'Control de Gastos',
    desc: 'Clasifica y monitorea todos tus gastos deducibles. Obtén reportes detallados por categoría y período.',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
      </svg>
    ),
    title: 'Reportes y Analytics',
    desc: 'Visualiza dashboards con indicadores clave: flujo de caja, cuentas por cobrar/pagar y rentabilidad.',
  },
];

const styles = {
  section: { padding: '6rem 2rem', background: '#0a0a1a', color: '#fff' },
  container: { maxWidth: '1200px', margin: '0 auto' },
  header: { textAlign: 'center', marginBottom: '4rem' },
  label: { color: '#818cf8', fontSize: '0.875rem', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1rem' },
  title: { fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: '700', marginBottom: '1rem' },
  subtitle: { color: '#94a3b8', fontSize: '1.125rem', maxWidth: '600px', margin: '0 auto' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' },
  card: { background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '16px', padding: '2rem' },
  iconBox: { width: '56px', height: '56px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' },
  cardTitle: { fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem', color: '#f1f5f9' },
  cardDesc: { color: '#94a3b8', lineHeight: '1.7', fontSize: '0.95rem' },
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
