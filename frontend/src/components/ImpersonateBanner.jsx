import { useNavigate } from 'react-router-dom';

const s = {
  banner: {
    background: 'var(--primary-dark)', 
    color: 'var(--white)', 
    padding: '0.5rem 2rem',
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: '1rem',
    fontSize: '0.85rem', 
    fontFamily: 'system-ui, sans-serif',
  },
  name: { 
    fontWeight: '700',
    color: 'var(--white)',
  },
  btn: {
    background: 'rgba(255,255,255,0.2)', 
    border: '1px solid rgba(255,255,255,0.4)',
    color: 'var(--white)', 
    padding: '0.3rem 0.8rem', 
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer', 
    fontSize: '0.8rem', 
    fontWeight: '600',
    transition: 'background .2s',
  },
  btnHover: {
    background: 'rgba(255,255,255,0.3)',
  },
};

export default function ImpersonateBanner() {
  const navigate = useNavigate();
  
  // Verificar si está en modo impersonation
  const impersonatingInfo = localStorage.getItem('impersonating');
  if (!impersonatingInfo) return null;

  let info;
  try {
    info = JSON.parse(impersonatingInfo);
  } catch {
    return null;
  }

  function handleExit() {
    localStorage.removeItem('impersonate_token');
    localStorage.removeItem('impersonating');
    navigate('/dashboard');
  }

  return (
    <div style={s.banner}>
      <span>Viendo como <span style={s.name}>{info.name || 'Usuario'}</span></span>
      <button 
        style={s.btn}
        onClick={handleExit}
        onMouseEnter={e => e.currentTarget.style.background = s.btnHover.background}
        onMouseLeave={e => e.currentTarget.style.background = s.btn.background}
      >
        Salir
      </button>
    </div>
  );
}
