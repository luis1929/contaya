import { useState, useRef, useEffect } from 'react';
import { api } from '../../services/api';

const SUGGESTIONS = [
  '¿Cuántos clientes tengo?',
  '¿Cuántas facturas tengo?',
  'Resumen de ingresos',
  'Resumen del mes',
  'Top productos más vendidos',
  'Mejores clientes',
  'Últimas 5 facturas',
  'Resumen ejecutivo',
];

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: '¡Hola! Soy el asistente de gerencia. Puedes consultarme sobre facturas, clientes, ingresos y más. ¿Qué deseas saber?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    const msg = input.trim();
    if (!msg || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setLoading(true);
    try {
      const res = await api.chatQuery(msg);
      const data = res?.data?.data;
      setMessages(prev => [...prev, { role: 'bot', text: res?.data?.reply || 'Sin respuesta', data }]);
    } catch {
      setMessages(prev => [...prev, { role: 'bot', text: 'Error al procesar la consulta. Intenta de nuevo.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="block md:hidden fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setOpen(!open)}
          className="w-14 h-14 rounded-full bg-primary shadow-lg hover:shadow-xl hover:bg-primary-dark text-white flex items-center justify-center transition-all duration-200 active:scale-95"
          aria-label="Chat de gerencia"
        >
          {open ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          )}
        </button>
      </div>

      {open && (
        <div className="block md:hidden fixed inset-0 z-40 flex flex-col bg-white">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-primary text-white">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold">Asistente Gerencia</p>
                <p className="text-xs text-white/70">Consultas ejecutivas</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 rounded-full hover:bg-white/20 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary text-white rounded-br-sm'
                    : 'bg-white border border-gray-200 shadow-sm rounded-bl-sm'
                }`}>
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 shadow-sm rounded-2xl rounded-bl-sm px-4 py-3 text-sm text-gray-500">
                  <span className="inline-flex gap-1">
                    <span className="animate-bounce">.</span>
                    <span className="animate-bounce delay-100">.</span>
                    <span className="animate-bounce delay-200">.</span>
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 bg-white px-4 py-3">
            {messages.length === 1 && (
              <div className="mb-3">
                <p className="text-xs text-gray-400 mb-2">Sugerencias:</p>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTIONS.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => { setInput(s); document.getElementById('chat-input')?.focus(); }}
                      className="text-xs bg-gray-100 hover:bg-primary/10 hover:text-primary text-gray-600 px-2.5 py-1.5 rounded-full transition-colors border border-gray-200"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <form onSubmit={handleSend} className="flex gap-2">
              <input
                id="chat-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Escribe tu consulta..."
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
