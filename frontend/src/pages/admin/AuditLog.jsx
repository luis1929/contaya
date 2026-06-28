import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import StatsCard from '../../components/ui/StatsCard';

const ACTION_LABELS = {
  login: 'Inicio de sesión',
  logout: 'Cierre de sesión',
  create: 'Creación',
  update: 'Actualización',
  delete: 'Eliminación',
  upload: 'Subida de archivo',
  download: 'Descarga de archivo',
  view: 'Visualización',
  search: 'Búsqueda',
};

const RESOURCE_LABELS = {
  auth: 'Autenticación',
  billers: 'Facturadores',
  documents: 'Documentos',
  invoices: 'Facturas',
  declarations: 'Declaraciones',
  settings: 'Configuración',
};

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ action: '', resource: '', actor_role: '', desde: '', hasta: '', search: '' });

  const loadStats = async () => {
    try {
      const res = await api.getAuditStats();
      setStats(res);
    } catch (err) {
      console.error(err);
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 30, ...filters };
      const cleanParams = {};
      for (const [k, v] of Object.entries(params)) {
        if (v) cleanParams[k] = v;
      }
      const res = await api.getAuditLog(cleanParams);
      setLogs(res.data);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStats(); }, []);
  useEffect(() => { load(); }, [page, filters]);

  const handleFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const actionColor = (action) => {
    if (['create', 'upload'].includes(action)) return 'success';
    if (['delete'].includes(action)) return 'danger';
    if (['update'].includes(action)) return 'info';
    if (['login', 'logout'].includes(action)) return 'warning';
    return 'gray';
  };

  const actionIcon = (action) => {
    if (action === 'login') return '🔑';
    if (action === 'logout') return '🚪';
    if (action === 'upload') return '📤';
    if (action === 'download') return '📥';
    if (action === 'delete') return '🗑️';
    if (action === 'create') return '➕';
    if (action === 'update') return '✏️';
    if (action === 'view') return '👁️';
    if (action === 'search') return '🔍';
    return '•';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Registro de Auditoría</h2>
        <p className="text-gray-500 mt-1">Todas las acciones realizadas en el sistema</p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatsCard label="Total eventos" value={stats.total.total} />
          <StatsCard label="Actores únicos" value={stats.total.unique_actors} />
          <StatsCard label="Periodo" value="Últimos 30 días" />
          <StatsCard label="Facturadores" value={stats.byRole?.find(r => r.actor_role === 'biller')?.count || 0} />
        </div>
      )}

      <Card hover={false}>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <select value={filters.action} onChange={e => handleFilter('action', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/40">
            <option value="">Todas las acciones</option>
            {Object.entries(ACTION_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>

          <select value={filters.resource} onChange={e => handleFilter('resource', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/40">
            <option value="">Todos los recursos</option>
            {Object.entries(RESOURCE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>

          <select value={filters.actor_role} onChange={e => handleFilter('actor_role', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/40">
            <option value="">Todos los roles</option>
            <option value="admin">Administrador</option>
            <option value="biller">Facturador</option>
          </select>

          <input type="date" value={filters.desde} onChange={e => handleFilter('desde', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="Desde" />

          <input type="date" value={filters.hasta} onChange={e => handleFilter('hasta', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="Hasta" />

          <input type="text" value={filters.search} onChange={e => handleFilter('search', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="Buscar actor/recurso..." />
        </div>
      </Card>

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
                <div key={log.id} className="py-3 flex items-start gap-3 hover:bg-gray-50 px-2 -mx-2 rounded-lg transition-colors">
                  <span className="text-lg mt-0.5 flex-shrink-0">{actionIcon(log.action)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge color={actionColor(log.action)}>{ACTION_LABELS[log.action] || log.action}</Badge>
                      <Badge color="gray">{RESOURCE_LABELS[log.resource] || log.resource}</Badge>
                      <span className="text-xs text-gray-400 font-mono">{log.actor_role}</span>
                    </div>
                    <p className="text-sm text-gray-800 mt-1">
                      <span className="font-semibold">{log.actor_name || 'Sistema'}</span>
                      {log.resource_id && (
                        <span className="text-gray-400 ml-1 text-xs font-mono">
                          #{log.resource_id.length > 12 ? log.resource_id.substring(0, 12) + '…' : log.resource_id}
                        </span>
                      )}
                    </p>
                    {log.details && typeof log.details === 'object' && Object.keys(log.details).length > 0 && (
                      <p className="text-xs text-gray-400 mt-0.5 font-mono">
                        {JSON.stringify(log.details).substring(0, 120)}
                        {JSON.stringify(log.details).length > 120 ? '…' : ''}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span>{new Date(log.created_at).toLocaleString('es-CO')}</span>
                      {log.ip_address && <span className="font-mono">{log.ip_address}</span>}
                    </div>
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
