const colors = {
  success: 'bg-green-100 text-green-700 border-green-200',
  warning: 'bg-amber-100 text-amber-700 border-amber-200',
  danger: 'bg-red-100 text-red-700 border-red-200',
  info: 'bg-blue-100 text-blue-700 border-blue-200',
  gray: 'bg-gray-100 text-gray-600 border-gray-200',
};

export default function Badge({ children, color = 'gray', className = '', dot }) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full
        text-xs font-medium border ${colors[color]} ${className}
      `}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${color === 'success' ? 'bg-green-500' : color === 'warning' ? 'bg-amber-500' : color === 'danger' ? 'bg-red-500' : color === 'info' ? 'bg-blue-500' : 'bg-gray-400'}`} />}
      {children}
    </span>
  );
}
