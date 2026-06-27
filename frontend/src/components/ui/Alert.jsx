const variants = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

const icons = {
  success: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  error: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
  warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z',
  info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
};

export default function Alert({ variant = 'info', title, children, onDismiss, className = '' }) {
  return (
    <div className={`flex items-start gap-3 rounded-lg border p-4 ${variants[variant]} ${className}`}>
      <svg className="mt-0.5 h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d={icons[variant]} />
      </svg>
      <div className="flex-1">
        {title && <p className="font-medium">{title}</p>}
        {children && <div className="text-sm mt-0.5">{children}</div>}
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="text-current opacity-50 hover:opacity-100">&times;</button>
      )}
    </div>
  );
}
