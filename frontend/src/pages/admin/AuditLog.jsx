import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionFilter, setActionFilter] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 30 };
      if (actionFilter) params.action = actionFilter;
      const res = await api.getAuditLog(params);
      setLogs(res.data);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page, actionFilter]);

  const actionColor = (action) => {
    if (action === 'create') return 'success';
    if (action === 'delete') return 'danger';
    if (action === 'update') return 'info';
    return 'gray';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Registro de Auditoría</h2>
        <p className="text-gray-500 mt-1">Todas las acciones realizadas en el sistema</p>
      </div>

      <div className="flex gap-3">
        <select
          value={actionFilter}
          onChange={e => { setActionFilter(e.target.value); setPage(1); }}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="">Todas las acciones</option>
          <option value="create">Creación</option>
          <option value="update">Actualización</option>
          <option value="delete">Eliminación</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <Card hover={false}>
          {logs.length === 0 ? (
            <p className="text-center text-gray-400 py-8">No hay registros de auditoría</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {logs.map(log => (
                <div key={log.id} className="py-3 flex items-start gap-4">
                  <Badge color={actionColor(log.action)}>{log.action}</Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800">
                      <span className="font-semibold">{log.actor_name || 'Sistema'}</span>
                      {' '}{log.action === 'create' ? 'creó' : log.action === 'delete' ? 'eliminó' : 'modificó'}{' '}
                      <span className="font-medium">{log.resource}</span>
                      {log.resource_id && <span className="text-gray-400"> #{log.resource_id.substring(0, 8)}</span>}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(log.created_at).toLocaleString('es-CO')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            ← Anterior
          </Button>
          <span className="flex items-center px-3 text-sm text-gray-600">
            Página {page} de {totalPages}
          </span>
          <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
            Siguiente →
          </Button>
        </div>
      )}
    </div>
  );
}
