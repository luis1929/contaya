const testimonials = [
  {
    name: 'Roberta Castillo',
    role: 'Contadora Pública',
    company: 'Castillo & Asociados',
    text: 'Contaya me ahorra horas de trabajo cada mes. La extracción automática de datos de facturas es increíblemente precisa.',
    avatar: 'RC',
  },
  {
    name: 'Pedro Ramírez',
    role: 'CEO',
    company: 'Grupo Ramírez SRL',
    text: 'Pasamos de usar Excel a un sistema completo. Las declaraciones de IVA y Renta ahora se generan en minutos.',
    avatar: 'PR',
  },
  {
    name: 'Laura Méndez',
    role: 'Gerente Financiera',
    company: 'Distribuidora Méndez',
    text: 'La conciliación bancaria automatizada nos salvó de errores costosos. Recomiendo Contaya a cualquier negocio.',
    avatar: 'LM',
  },
];

const styles = {
  section: { padding: '6rem 2rem', background: '#0a0a1a', color: '#fff' },
  container: { maxWidth: '1100px', margin: '0 auto' },
  header: { textAlign: 'center', marginBottom: '4rem' },
  label: { color: '#818cf8', fontSize: '0.875rem', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1rem' },
  title: { fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: '700' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' },
  card: { background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '16px', padding: '2rem' },
  quote: { color: '#6366f1', fontSize: '2rem', marginBottom: '1rem', lineHeight: '1' },
  text: { color: '#cbd5e1', lineHeight: '1.7', marginBottom: '1.5rem', fontStyle: 'italic' },
  author: { display: 'flex', alignItems: 'center', gap: '1rem' },
  avatar: { width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '0.875rem', flexShrink: 0 },
  name: { fontWeight: '600', color: '#f1f5f9', fontSize: '0.95rem' },
  roleText: { color: '#64748b', fontSize: '0.85rem' },
};

export default function Testimonials() {
  return (
    <section style={styles.section}>
      <div style={styles.container}>
        <div style={styles.header}>
          <p style={styles.label}>Testimonios</p>
          <h2 style={styles.title}>Lo que dicen nuestros clientes</h2>
        </div>
        <div style={styles.grid}>
          {testimonials.map((t, i) => (
            <div key={i} style={styles.card}>
              <div style={styles.quote}>&ldquo;</div>
              <p style={styles.text}>{t.text}</p>
              <div style={styles.author}>
                <div style={styles.avatar}>{t.avatar}</div>
                <div>
                  <div style={styles.name}>{t.name}</div>
                  <div style={styles.roleText}>{t.role} &middot; {t.company}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
