import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

const s = {
  banner: {
    background: '#1e3a8a', color: '#fff', padding: '0.5rem 2rem',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem',
    fontSize: '0.85rem', fontFamily: 'system-ui, sans-serif',
  },
  name: { fontWeight: '700' },
  btn: {
    background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)',
    color: '#fff', padding: '0.3rem 0.8rem', borderRadius: '6px',
    cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600',
    transition: 'background .2s',
  },
};

export default function ImpersonateBanner() {
  const navigate = useNavigate();
  const info = api.getImpersonatingInfo();

  if (!info) return null;

  function handleExit() {
    api.stopImpersonating();
    navigate('/dashboard');
  }

  return (
    <div style={s.banner}>
      <span>Viendo como <span style={s.name}>{info.name}</span></span>
      <button style={s.btn} onClick={handleExit}>Salir</button>
    </div>
  );
}
