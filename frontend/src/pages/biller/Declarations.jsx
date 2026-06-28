import Badge from '../../components/ui/Badge';

const declarations = [
  { id: 1, type: 'IVA', period: '2024-01', status: 'completed', dueDate: '2024-02-15', amount: 1250000 },
  { id: 2, type: 'Renta', period: '2023', status: 'pending', dueDate: '2024-04-30', amount: 3850000 },
  { id: 3, type: 'ICA', period: '2024-01', status: 'overdue', dueDate: '2024-02-10', amount: 450000 },
];

const deadlines = [
  { type: 'IVA', period: '2024-02', dueDate: '2024-03-15', importance: 'high' },
  { type: 'Retención', period: '2024-01', dueDate: '2024-02-20', importance: 'medium' },
  { type: 'ICA', period: '2024-02', dueDate: '2024-03-10', importance: 'high' },
];

function fmt(n) {
  return '$' + Number(n || 0).toLocaleString('es-CO');
}

export default function BillerDeclarations() {
  const getStatusColor = (s) => {
    if (s === 'completed') return 'success';
    if (s === 'pending') return 'warning';
    if (s === 'overdue') return 'danger';
    return 'gray';
  };
  const getStatusText = (s) => {
    if (s === 'completed') return 'Completada';
    if (s === 'pending') return 'Pendiente';
    if (s === 'overdue') return 'Vencida';
    return s;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Declaraciones Tributarias</h2>
        <p className="text-gray-500 mt-1">IVA, Renta, ICA y Retención en la Fuente</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {declarations.map(d => (
          <div key={d.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div className="text-2xl mb-2">
              {d.type === 'IVA' ? '💰' : d.type === 'Renta' ? '📊' : '🏢'}
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{d.type} - {d.period}</h3>
            <Badge color={getStatusColor(d.status)}>{getStatusText(d.status)}</Badge>
            <div className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Vence:</span>
                <span className="font-medium">{d.dueDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Valor:</span>
                <span className="font-semibold text-gray-900">{fmt(d.amount)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📅 Próximos Vencimientos</h3>
        <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Período</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Fecha Límite</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Días</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Importancia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {deadlines.map((d, i) => {
                const days = Math.ceil((new Date(d.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
                return (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-700">{d.type}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{d.period}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{d.dueDate}</td>
                    <td className={`px-4 py-3 text-sm font-semibold ${
                      days < 0 ? 'text-danger' : days < 7 ? 'text-warning' : 'text-success'
                    }`}>
                      {days < 0 ? `Vencido` : `${days} días`}
                    </td>
                    <td className="px-4 py-3">
                      <Badge color={d.importance === 'high' ? 'danger' : 'warning'}>
                        {d.importance === 'high' ? 'Alta' : 'Media'}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="md:hidden space-y-3">
          {deadlines.map((d, i) => {
            const days = Math.ceil((new Date(d.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
            return (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">{d.type} - {d.period}</span>
                  <Badge color={d.importance === 'high' ? 'danger' : 'warning'}>
                    {d.importance === 'high' ? 'Alta' : 'Media'}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Fecha Límite</span>
                  <span className="text-gray-700">{d.dueDate}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Días</span>
                  <span className={`font-semibold ${
                    days < 0 ? 'text-danger' : days < 7 ? 'text-warning' : 'text-success'
                  }`}>
                    {days < 0 ? 'Vencido' : `${days} días`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
