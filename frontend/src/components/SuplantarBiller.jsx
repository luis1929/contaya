import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function SuplantarBiller({ collapsed }) {
  const [open, setOpen] = useState(false);
  const [billers, setBillers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchBillers = async () => {
    if (billers.length) return;
    setLoading(true);
    try {
      const res = await api.getAdminBillers({ limit: 100 });
      setBillers(res.data);
    } catch (err) {
      console.error('Error al cargar facturadores:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setOpen(!open);
    if (!open) fetchBillers();
  };

  const handleSelect = async (biller) => {
    try {
      const data = await api.impersonate(biller.id);
      localStorage.setItem('admin_token', localStorage.getItem('token'));
      const adminUser = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({
        id: biller.id,
        name: biller.name,
        nit: biller.document_number,
        role: 'biller',
        impersonating: true,
        impersonatedBy: adminUser.id,
        impersonatedByName: adminUser.name,
      }));
      window.dispatchEvent(new Event('auth-change'));
      setOpen(false);
      navigate('/dashboard');
    } catch (err) {
      alert('Error al suplantar: ' + (err.response?.data?.error || err.message));
    }
  };

  const filtered = billers.filter(b =>
    b.name?.toLowerCase().includes(search.toLowerCase()) ||
    b.document_number?.includes(search)
  );

  if (collapsed) {
    return (
      <div ref={ref} className="relative">
        <button
          onClick={handleOpen}
          className="flex items-center justify-center w-full px-3 py-2.5 text-sm font-medium text-gray-600 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors"
          title="Suplantar facturador"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </button>
        {open && (
          <div className="absolute left-12 top-0 z-50 w-72 rounded-xl border border-gray-200 bg-white shadow-xl">
            <SuplantarContent search={search} setSearch={setSearch} filtered={filtered} loading={loading} onSelect={handleSelect} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={ref} className="relative px-2">
      <button
        onClick={handleOpen}
        className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-gray-600 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors"
      >
        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
        <span>Suplantar vista</span>
        {loading && <span className="ml-auto w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
      </button>
      {open && (
        <div className="absolute left-2 right-2 top-full mt-1 z-50 rounded-xl border border-gray-200 bg-white shadow-xl">
          <SuplantarContent search={search} setSearch={setSearch} filtered={filtered} loading={loading} onSelect={handleSelect} />
        </div>
      )}
    </div>
  );
}

function SuplantarContent({ search, setSearch, filtered, loading, onSelect }) {
  return (
    <>
      <div className="p-2">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre o NIT..."
          autoFocus
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
        />
      </div>
      <div className="max-h-60 overflow-y-auto border-t border-gray-100">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400">
            {search ? 'Sin resultados' : 'No hay facturadores'}
          </div>
        ) : (
          filtered.map(b => (
            <button
              key={b.id}
              onClick={() => onSelect(b)}
              className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0"
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                {b.name?.[0] || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{b.name}</p>
                <p className="text-xs text-gray-500 truncate">NIT {b.document_number} · {b.invoice_count || 0} facturas</p>
              </div>
              <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))
        )}
      </div>
      <div className="p-2 border-t border-gray-100">
        <p className="text-[10px] text-gray-400 text-center">
          Verás la aplicación exactamente como ese facturador
        </p>
      </div>
    </>
  );
}
