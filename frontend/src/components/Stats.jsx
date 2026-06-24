const styles = {
  section: { padding: '6rem 2rem', background: 'linear-gradient(135deg, #0f0c29, #1a1a3e)', color: '#fff' },
  container: { maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '3rem', textAlign: 'center' },
  number: { fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: '800', background: 'linear-gradient(135deg, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.5rem' },
  label: { color: '#94a3b8', fontSize: '1rem', fontWeight: '500' },
};

const stats = [
  { number: '50K+', label: 'Facturas procesadas' },
  { number: '5K+', label: 'Usuarios activos' },
  { number: '99.9%', label: 'Uptime garantizado' },
  { number: '4.8', label: 'Valoración media' },
];

export default function Stats() {
  return (
    <section style={styles.section}>
      <div style={styles.container}>
        {stats.map((s, i) => (
          <div key={i}>
            <div style={styles.number}>{s.number}</div>
            <div style={styles.label}>{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
