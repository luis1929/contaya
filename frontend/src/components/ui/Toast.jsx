import { useState, useEffect, useCallback } from 'react';

function ToastItem({ id, message, variant, onRemove }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(id), 4000);
    return () => clearTimeout(timer);
  }, [id, onRemove]);

  const colors = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    warning: 'bg-yellow-500 text-gray-900',
    info: 'bg-blue-600',
  };

  return (
    <div className={`flex items-center gap-3 rounded-lg px-4 py-3 text-white shadow-lg ${colors[variant] || colors.info} animate-slide-up`}>
      <span className="flex-1 text-sm">{message}</span>
      <button onClick={() => onRemove(id)} className="text-white/70 hover:text-white">&times;</button>
    </div>
  );
}

let toastId = 0;
let globalAdd = null;

export function toast(message, variant = 'info') {
  globalAdd?.({ id: ++toastId, message, variant });
}

export default function ToastContainer() {
  const [items, setItems] = useState([]);

  const add = useCallback((item) => {
    setItems(prev => [...prev, item]);
  }, []);

  const remove = useCallback((id) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  useEffect(() => {
    globalAdd = add;
    return () => { globalAdd = null; };
  }, [add]);

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 min-w-[300px]">
      {items.map(item => (
        <ToastItem key={item.id} {...item} onRemove={remove} />
      ))}
    </div>
  );
}
