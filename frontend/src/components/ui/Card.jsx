export default function Card({ children, className = '', hover = true, padding = true }) {
  return (
    <div
      className={`
        bg-white border border-gray-200 rounded-xl shadow-sm
        ${hover ? 'transition-all duration-200 hover:shadow-md hover:-translate-y-0.5' : ''}
        ${padding ? 'p-6' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
