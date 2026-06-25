# Contaya

Plataforma contable multi-tenant para gestión de facturación electrónica, clientes y documentos.

## Tech Stack

| Capa | Tecnología |
|------|-----------|
| **Frontend** | React 19, React Router 7, Vite 8, Axios |
| **Backend** | Node.js, Express 5, pg (node-postgres) |
| **Base de datos** | PostgreSQL + Supabase schema |
| **Auth** | JWT (jsonwebtoken), bcryptjs |
| **Uploads** | Multer 2 (PDF, JPG, PNG, CSV, XLSX) |
| **Infra** | Oracle Cloud VM (Ubuntu), nginx, systemd, Cloudflare Tunnel |

## Arquitectura

```
┌───────────────────────────────────────────────┐
│  Navegador                                    │
│  └─ drivingradio.us                           │
└──────────────────┬────────────────────────────┘
                   │ HTTPS (Cloudflare)
┌──────────────────▼────────────────────────────┐
│  Cloudflare Tunnel → localhost:3001           │
│  (Express sirve API + frontend build)          │
└──────────────────┬────────────────────────────┘
                   │
┌──────────────────▼────────────────────────────┐
│  backend/server.js (Express 5 - monolito)      │
│  ├─ Auth (register, login, reset-password)    │
│  ├─ Invoices (CRUD, summary, consolidated)    │
│  ├─ Clients (CRUD con filtro multi-tenant)    │
│  ├─ Billers (CRUD admin)                      │
│  ├─ Documents (upload/list/delete)            │
│  ├─ Company (perfil empresa)                  │
│  └─ Health check                              │
└──────────────────┬────────────────────────────┘
                   │
┌──────────────────▼────────────────────────────┐
│  PostgreSQL (contaya)                          │
│  Tablas: users, billers, clients, invoices,    │
│          invoice_items, documents              │
└───────────────────────────────────────────────┘
```

## Estructura del proyecto

```
contaya/
├── backend/
│   ├── server.js        # API Express (único archivo)
│   └── uploads/         # Archivos subidos
├── frontend/
│   ├── src/
│   │   ├── App.jsx      # Router con 10 rutas
│   │   ├── services/    # api.js (axios), supabase.js
│   │   ├── pages/       # 10 páginas (Landing, Login, Dashboard, etc.)
│   │   └── components/  # Navbar, Hero, Features, etc.
│   └── dist/            # Build de producción
├── supabase-schema.sql  # Migración inicial
├── deploy.sh            # Script de despliegue
└── contaya-tunnel.yml   # Config Cloudflare Tunnel
```

## Prerrequisitos

- Node.js >= 18
- PostgreSQL 16
- npm

## Instalación

```bash
cd backend && npm install
cd ../frontend && npm install
```

## Ejecución local

```bash
# Base de datos
psql -U contaya -d contaya -f supabase-schema.sql

# Backend (puerto 3001)
cd backend && npm run dev

# Frontend (puerto 5173 con HMR)
cd frontend && npm run dev
```

## Variables de entorno

Crear `backend/.env`:

| Variable | Default | Descripción |
|----------|---------|-------------|
| `PORT` | `3001` | Puerto del servidor |
| `DB_HOST` | `localhost` | Host PostgreSQL |
| `DB_PORT` | `5432` | Puerto PostgreSQL |
| `DB_USER` | `contaya` | Usuario PostgreSQL |
| `DB_PASSWORD` | `contaya123` | Contraseña |
| `DB_NAME` | `contaya` | Base de datos |
| `JWT_SECRET` | `contaya_secret_change_in_prod` | Secreto JWT |

## API Endpoints

### Autenticación

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `POST` | `/api/auth/register` | No | Registrar admin |
| `POST` | `/api/auth/login` | No | Login (email admin / email o NIT facturador) |
| `POST` | `/api/auth/reset-password` | No | Restablecer contraseña admin |
| `GET` | `/api/auth/me` | JWT | Info del usuario actual |

### Facturas

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/invoices` | JWT | Listar (admin: todas; con `?biller_id=` filtra) |
| `GET` | `/api/invoices/summary` | JWT | Resumen (admin: global; con `?biller_id=` filtra) |
| `GET` | `/api/invoices/summary-by-biller` | JWT | Resumen agrupado por facturador |
| `GET` | `/api/invoices/clients-by-biller` | JWT | Clientes agrupados |
| `GET` | `/api/invoices/consolidated` | JWT | Datos consolidados anuales |

### Clientes

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/clients` | JWT | Listar (admin: todos; con `?biller_id=` filtra) |

### Facturadores (admin)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/billers` | JWT | Listar facturadores |
| `POST` | `/api/billers` | JWT+Admin | Crear facturador |
| `PUT` | `/api/billers/:id` | JWT+Admin | Actualizar facturador |
| `DELETE` | `/api/billers/:id` | JWT+Admin | Eliminar facturador |

### Documentos

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `POST` | `/api/documents/upload` | JWT | Subir documento (PDF, JPG, PNG, CSV, XLSX) |
| `GET` | `/api/documents` | JWT | Listar (admin: todos; con `?biller_id=` filtra) |
| `GET` | `/api/documents/:id` | JWT | Obtener metadata |
| `DELETE` | `/api/documents/:id` | JWT | Eliminar |

### Empresa

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/company` | JWT | Obtener perfil empresa |
| `PUT` | `/api/company` | JWT | Actualizar perfil empresa |

### Health

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/health` | No | Health check |

## Modelo multi-tenant

El aislamiento se implementa mediante la función `filterBillerId(req)` en cada ruta:

```javascript
function filterBillerId(req) {
  if (req.user.role === 'biller') return req.user.biller_id;  // forzoso
  return req.query.biller_id || null;                          // admin: opcional
}
```

### Comportamiento por rol

| Rol | Sin `?biller_id=` | Con `?biller_id=xxx` |
|-----|-------------------|----------------------|
| **Admin** (tabla `users`) | Ve TODOS los datos (lista global) | Ve SOLO datos de ese biller |
| **Biller** (tabla `billers`) | Ve SOLO sus datos | Ve SOLO sus datos (ignora el param) |

### Flujo de autenticación

1. **Admin** ingresa email + password → se busca en `users` → JWT con `role: 'admin'`
2. **Biller** ingresa email o NIT + password → se busca en `billers` → JWT con `role: 'biller'`, `biller_id`
3. Token JWT expira en 7 días
4. Cada request incluye `Authorization: Bearer <token>` → middleware verifica e inyecta `req.user`, `req.biller_id`

## Base de datos

6 tablas en PostgreSQL:

| Tabla | Propósito | Relación |
|-------|-----------|----------|
| `users` | Admins del sistema | — |
| `billers` | Facturadores (multi-tenant) | `biller_id` FK en clients, invoices, documents |
| `clients` | Clientes por facturador | FK → billers |
| `invoices` | Facturas electrónicas | FK → billers, clients; `raw_data` (jsonb) |
| `invoice_items` | Líneas de factura | FK → invoices (CASCADE) |
| `documents` | Documentos subidos | FK → billers; `extracted_data` (jsonb) |

## Despliegue

```bash
bash deploy.sh
```

El script:
1. Pull de últimos cambios desde GitHub
2. `npm install` en backend y frontend
3. `vite build` → `frontend/dist/`
4. Recarga nginx y reinicia `contaya-api` (systemd)

### Servicios en producción

| Servicio | Comando |
|----------|---------|
| API backend | `sudo systemctl restart contaya-api` |
| nginx | `sudo systemctl reload nginx` |
| Logs backend | `sudo journalctl -u contaya-api -f` |
| Tunnel | `cloudflared tunnel run` (vía systemd) |