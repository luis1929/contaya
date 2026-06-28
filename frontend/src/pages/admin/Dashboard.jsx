import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import StatsCard from '../../components/ui/StatsCard';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

function fmt(n) {
  if (n == null) return '$0';
  return '$' + Number(n).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAdminDashboard()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!data) return null;

  const { stats, activity, topBillers } = data;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Panel de Administración</h2>
        <p className="text-gray-500 mt-1">Resumen general del sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatsCard label="Facturadores" value={stats.billers.total} icon="👥" color="primary" />
        <StatsCard label="Activos" value={stats.billers.active} icon="✅" color="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Top Facturadores</h3>
            <Link to="/admin/billers" className="text-sm text-primary hover:text-primary-dark font-medium">Ver todos →</Link>
          </div>
          <div className="space-y-3">
            {topBillers.map((b, i) => (
              <div key={b.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{b.name}</p>
                    <p className="text-xs text-gray-500">{b.document_number}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{b.invoice_count} facturas</p>
                  <p className="text-xs text-gray-500">{fmt(b.total_sum)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-gray-900 mb-4">Actividad Reciente</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {activity.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">Sin actividad reciente</p>
            )}
            {activity.map((a) => (
              <div key={a.id} className="flex items-start gap-3 p-2">
                <div className={`
                  w-2 h-2 rounded-full mt-1.5 flex-shrink-0
                  ${a.action === 'create' ? 'bg-success' : a.action === 'delete' ? 'bg-danger' : 'bg-primary'}
                `} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">{a.actor_name}</span>
                    {' '}{a.action === 'create' ? 'creó' : a.action === 'delete' ? 'eliminó' : 'actualizó'} {a.resource}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(a.created_at).toLocaleString('es-CO')}
                  </p>
                </div>
                <Badge color={a.action === 'create' ? 'success' : a.action === 'delete' ? 'danger' : 'info'}>
                  {a.action}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
