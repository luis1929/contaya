const styles = {
  section: { padding: '6rem 2rem', background: '#f8f9fc', color: '#062A51' },
  container: { maxWidth: '1000px', margin: '0 auto' },
  header: { textAlign: 'center', marginBottom: '3.5rem' },
  label: { color: '#BE3B5E', fontSize: '0.85rem', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1rem' },
  title: { fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', fontWeight: '800', color: '#062A51', marginBottom: '1rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' },
  card: {
    background: '#fff', border: '1px solid #e8ecf0', borderRadius: '16px',
    padding: '2rem', display: 'flex', flexDirection: 'column',
  },
  quote: { color: '#BE3B5E', fontSize: '2rem', lineHeight: '1', marginBottom: '0.75rem', fontFamily: 'Georgia, serif' },
  text: { color: '#4a5a72', fontSize: '0.9rem', lineHeight: '1.7', flex: 1, marginBottom: '1.25rem' },
  author: { fontWeight: '700', color: '#062A51', fontSize: '0.9rem' },
  role: { color: '#7a8a9f', fontSize: '0.8rem', marginTop: '0.15rem' },
};

const testimonials = [
  {
    text: 'Plataforma intuitiva y muy fácil de usar. Puedo enviar facturas electrónicas al instante desde cualquier lugar, incluso desde mi celular.',
    author: 'Carlos Mendoza',
    role: 'Contador',
  },
  {
    text: 'La conciliación bancaria automatizada me ahorra horas cada mes. Los reportes son claros y el soporte técnico es excelente.',
    author: 'María Fernanda López',
    role: 'Gerente Financiera',
  },
  {
    text: 'Implementamos Contaya en toda nuestra oficina contable. La gestión de facturas y declaraciones de IVA nunca había sido tan sencilla.',
    author: 'Andrés Peláez',
    role: 'CEO, Consultora Contable',
  },
];

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
              <div>
                <div style={styles.author}>{t.author}</div>
                <div style={styles.role}>{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}