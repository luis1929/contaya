import Card from './Card';

export default function StatsCard({ label, value, icon, color = 'primary', trend, format }) {
  const colorClasses = {
    primary: 'text-primary bg-blue-50',
    success: 'text-success bg-green-50',
    warning: 'text-warning bg-amber-50',
    danger: 'text-danger bg-red-50',
  };

  const formatted = format === 'currency'
    ? '$' + Number(value || 0).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
    : value ?? 0;

  return (
    <Card padding={false}>
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{formatted}</p>
            {trend !== undefined && (
              <p className={`text-xs font-medium ${trend >= 0 ? 'text-success' : 'text-danger'}`}>
                {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
              </p>
            )}
          </div>
          {icon && (
            <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
              <span className="text-xl">{icon}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
