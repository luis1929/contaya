# Contaya

Plataforma contable multi-tenant para gestión de facturación electrónica, clientes, documentos y sincronización automática con FacturaTech.

## Tech Stack

| Capa | Tecnología |
|------|-----------|
| **Frontend** | React 19, React Router 7, Vite 8, Axios, Tailwind CSS |
| **Backend** | Node.js, Express 5, pg (node-postgres) |
| **Base de datos** | PostgreSQL |
| **Auth** | JWT (jsonwebtoken), bcryptjs |
| **Uploads** | Multer 2 (PDF, JPG, PNG, CSV, XLSX) |
| **Scraper** | Playwright (headless Chromium), PDF parsing |
| **Infra** | Oracle Cloud VM (Ubuntu), nginx, systemd, Cloudflare Tunnel |
| **IA** | NVIDIA Nemotron 3 Ultra, Mistral Ministral 14B, Gemma 4 31B (vía opencode) |

### Características Implementadas

| Característica | Estado | Descripción |
|---------|--------|-------------|
| **Paleta de Colores Facturatec** | ✅ | Colores institucionales unificados: azul oscuro (#062A51), azul de acento (#2563eb), fondo gris claro (#f4f6f9) |
| **Enlace Dashboard en Navegación** | ✅ | Acceso rápido al panel principal desde cualquier página |
| **Efectos Hover y Transiciones** | ✅ | Animaciones suaves y consistentes en todos los elementos interactivos |
| **Estilo Consistente Multi-Página** | ✅ | Todos los módulos (Dashboard, Facturas, Clientes, Admin, etc.) usan la misma identidad visual |
| **Mejoras de Accesibilidad** | ✅ | Mejores contrastes y navegación lógica entre componentes |
| **Diseño Responsive (Mobile)** | ✅ | Tablas convertidas a tarjetas en mobile, sidebar colapsable, navbar con menú hamburguesa |
| **Sincronización FacturaTech** | ✅ | Scraper headless que extrae facturas, NC/ND, clientes, productos, detalle de líneas, XML/PDF |
| **Carga de RUT (PDF)** | ✅ | Subir RUT en PDF, extracción automática de datos del cliente, autocompletado |
| **Sincronización desde Cliente** | ✅ | Botón "Sincronizar con FacturaTech" en creación de cliente que dispara sync asíncrono |
| **Esquema BD Simplificado** | ✅ | Eliminadas tablas `clients`, `items`, `invoice_items`; `invoices` simplificada a columnas esenciales; datos desde XML on-the-fly |
| **Filtro Cliente por Rango Fecha** | ✅ | Dropdown de clientes en Facturas con conteo, filtrado por rango de fechas seleccionado |
| **Visor Factura Extendido** | ✅ | Muestra fecha firma, forma de pago, email, notas, fecha emisión extraídos del XML UBL |

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
│  ├─ Clients (CRUD, upload-rut, sync)          │
│  ├─ Billers (CRUD admin, sync, credentials)   │
│  ├─ Documents (upload/list/delete)            │
│  ├─ Company (perfil empresa)                  │
│  └─ Health check                              │
└──────────────┬──────────────────┬─────────────┘
               │                  │
┌──────────────▼─────┐  ┌────────▼─────────────┐
│  scraper/           │  │  PostgreSQL           │
│  index.js           │  │  Tablas: users,       │
│  └ Playwright       │  │  billers, invoices,   │
│  └ sync.sh          │  │  documents,           │
│  └ SPAWN desde API  │  │  biller_credentials   │
│    (child_process)  │  │  (sin clients/items)  │
└─────────────────────┘  └───────────────────────┘
```

## Estructura del proyecto

```
contaya/
├── backend/
│   ├── server.js              # API Express (ruteo modular)
│   ├── controllers/           # Lógica de rutas
│   ├── middleware/             # Auth, RBAC, tenant context
│   ├── routes/                # Rutas Express
│   ├── services/              # RUT parser, crypto, audit
│   ├── db/                    # Pool de conexión
│   ├── lib/                   # Helpers (response, asyncHandler)
│   └── uploads/               # Archivos subidos
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # Router con 11+ rutas
│   │   ├── services/api.js    # Axios con interceptor JWT
│   │   ├── pages/
│   │   │   ├── admin/Dashboard.jsx, Billers.jsx, ...
│   │   │   ├── biller/Dashboard.jsx, Facturas.jsx, Clients.jsx,
│   │   │   │        Items.jsx, Declarations.jsx, RutUpload.jsx
│   │   │   ├── Landing.jsx, Login.jsx, Register.jsx, ...
│   │   │   └── CompanyPage.jsx, InvoiceViewer.jsx
│   │   ├── components/        # Navbar, Sidebar, MainLayout, UI
│   │   └── layouts/           # MainLayout, AdminLayout
│   └── dist/                  # Build de producción
├── scraper/
│   ├── index.js               # Entry point headless
│   ├── sync.sh                # Script shell para sync
│   ├── lib/
│   │   ├── auth.js            # Login a FacturaTech
│   │   ├── browser.js         # Sesión Playwright
│   │   ├── sync.js            # Orquestación completa
│   │   ├── parser.js          # Parseo de tablas HTML
│   │   ├── persist.js         # Persistencia a PostgreSQL
│   │   └── extractors/
│   │       ├── invoices.js    # Facturas + NC/ND + detalle
│   │       ├── clients.js     # Clientes
│   │       ├── items.js       # Productos/servicios
│   │       └── config.js      # Configuración del facturador
│   └── migrate-sync.sql       # Migración scraper
├── deploy.sh                   # Script de despliegue
├── contaya-tunnel.yml          # Config Cloudflare Tunnel
└── AGENTS.md                   # Memoria del agente opencode
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
| `POST` | `/api/auth/login` | No | Login (email admin → role admin; email o NIT → role biller) |
| `POST` | `/api/auth/reset-password` | No | Restablecer contraseña admin |
| `GET` | `/api/auth/me` | JWT | Info del usuario actual |
| `POST` | `/api/auth/impersonate/:biller_id` | JWT+Admin | Genera token temporal (2h) para ver datos de ese facturador |

### Facturas

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/invoices` | JWT | Listar (admin: todas; con `?biller_id=` filtra) |
| `GET` | `/api/invoices/summary` | JWT | Resumen (admin: global; con `?biller_id=` filtra) |
| `GET` | `/api/invoices/summary-by-biller` | JWT | Resumen agrupado por facturador |
| `GET` | `/api/invoices/client-list` | JWT | Lista de clientes únicos con conteo (filtra por `?desde=` `?hasta=`) |
| `GET` | `/api/invoices/consolidated` | JWT | Datos consolidados anuales |

### Clientes (legacy — endpoints removidos)

Los clientes ya no se almacenan en tabla propia. La información se extrae on-the-fly del XML de las facturas.
- Endpoint disponible: `GET /api/invoices/client-list` (para dropdown filtro en Facturas)
- Carga RUT: `POST /api/clients/upload-rut` (sube PDF → extrae datos y crea/actualiza cliente temporalmente)
- Sync FacturaTech: `POST /api/clients/sync-facturatech`

### Facturadores (admin)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/billers` | JWT | Listar facturadores |
| `POST` | `/api/billers` | JWT+Admin | Crear facturador (con credenciales FacturaTech opcional) |
| `PUT` | `/api/billers/:id` | JWT+Admin | Actualizar facturador |
| `DELETE` | `/api/billers/:id` | JWT+Admin | Eliminar facturador |
| `POST` | `/api/billers/:id/sync` | JWT+Admin | Iniciar sincronización FacturaTech para un facturador |
| `GET` | `/api/billers/credentials/status` | JWT | Estado de las credenciales FacturaTech |
| `POST` | `/api/billers/credentials` | JWT | Guardar/encriptar credenciales FacturaTech |
| `DELETE` | `/api/billers/credentials` | JWT | Eliminar credenciales |
| `GET` | `/api/billers/credentials/admin-list` | JWT+Admin | Listar credenciales (admin)

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

## Frontend — Rutas

| Ruta | Página | Acceso |
|------|--------|--------|
| `/` | Landing | Público |
| `/login` | Login | Público |
| `/register` | Registro admin | Público |
| `/forgot-password` | Recuperar contraseña | Público |
| `/admin` | Admin Dashboard | `role: 'admin'` |
| `/admin/billers` | Gestión de facturadores | `role: 'admin'` |
| `/dashboard` | Dashboard facturador | `role: 'biller'` o impersonación |
| `/facturas` | Facturas | Autenticado |
| `/facturas/:id` | Visor de factura | Autenticado |
| `/clientes` | Clientes (extraídos de facturas) | Autenticado |
| `/items` | Productos (placeholder — sin tabla BD) | Autenticado |
| `/declarations` | Declaraciones | Autenticado |
| `/rut-upload` | Carga RUT + sincronizar FacturaTech | Autenticado |
| `/upload` | Subir documentos | Autenticado |
| `/company` | Perfil empresa | Autenticado |

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

1. **Admin** ingresa email + password → se busca en `users` → JWT con `role: 'admin'` → redirige a `/admin`
2. **Biller** ingresa email o NIT + password → se busca en `billers` → JWT con `role: 'biller'`, `biller_id` → redirige a `/dashboard`
3. **Impersonación**: Admin hace click en "Entrar como" → `POST /api/auth/impersonate/:id` → token temporal (2h) con `role: 'biller'` + `impersonated_by` → dashboard muestra banner amarillo con opción "Volver al Admin"
4. Token JWT expira en 7 días (2h para tokens de impersonación)
5. Cada request incluye `Authorization: Bearer <token>` → middleware verifica e inyecta `req.user`, `req.biller_id`

## Panel de Administración (`/admin`)

El panel admin permite:
- **Listar** todos los facturadores con nombre, RNC, email, ciudad, estado (activo/inactivo) y conteo de clientes
- **Impersonar** — entrar como cualquier facturador para auditar sus datos sin salir de la sesión
- **Activar/Desactivar** facturadores
- **Eliminar** facturadores
- **Stats** — total de facturadores y clientes registrados

## Base de datos

6 tablas en PostgreSQL (simplificadas tras migración):

| Tabla | Propósito | Relación |
|-------|-----------|----------|
| `users` | Admins del sistema | — |
| `billers` | Facturadores (multi-tenant) | `biller_id` FK en invoices, documents |
| `biller_credentials` | Credenciales FacturaTech encriptadas | FK → billers |
| `invoices` | Facturas electrónicas | FK → billers; `xml_content` (text), `client_name`, `total`, `status`, `has_xml`, `has_pdf`, `created_at` |
| `documents` | Documentos subidos | FK → billers; `extracted_data` (jsonb) |
| `migration_versions` | Control de migraciones | — |

**Cambios clave en la migración:**
- Eliminadas: `clients`, `items`, `invoice_items` (los datos ahora se extraen on-the-fly del XML en `invoices.xml_content`)
- `invoices` simplificada: solo columnas esenciales
- Migration v2: se agregaron `client_name` (text) y `total` (numeric) como metadatos ligeros poblados por el scraper desde el HTML (sin necesidad de XML)
- Analytics e InvoiceViewer parsen `xml_content` (UBL 2.1) para obtener: cliente, items, totales, fecha firma, forma de pago, email, notas

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

## Scraper FacturaTech

El scraper automatiza la extracción de datos desde `https://plataforma.facturatech.co/` usando Playwright (headless Chromium).

### Qué extrae

| Extracto | Descripción |
|----------|-------------|
| **Facturas** | Facturas de venta (FV), notas crédito (NC), notas débito (ND) con NCF, cliente, CUFE, total, estado |
| **Detalle de facturas** | Líneas de cada factura (código, descripción, cantidad, precio unitario, IVA) + impuestos/retenciones |
| **Clientes** | Nombre, NIT, email, teléfono, ciudad |
| **Productos/Items** | Código, nombre, precio unitario, unidad, moneda, IVA |
| **Configuración** | Razón social, NIT, email, dirección, actividades económicas |
| **XML/PDF** | URLs de descarga de XML y PDF de cada factura |

### Modos de ejecución

```bash
# Sync completo (facturas + clientes + items + detalle)
cd scraper && bash sync.sh --user=USER --pass=PASS --biller-id=UUID

# Solo extraer, sin persistir (guarda JSON)
node index.js --user=USER --pass=PASS --biller-id=UUID --output=/tmp/sync.json

# Extraer sin detalle de líneas (más rápido)
node index.js --user=USER --pass=PASS --biller-id=UUID --details=false

# Sync interactivo (usa .env)
bash sync.sh
```

### Integración con API

El backend dispara el scraper como proceso hijo (`child_process.spawn`, `detached: true`) cuando:
- Se crea un facturador con credenciales FacturaTech
- Se solicita `POST /api/billers/:id/sync`
- Se solicita `POST /api/clients/sync-facturatech` (desde creación de cliente)

### Credenciales

Las credenciales de FacturaTech se almacenan en `biller_credentials` encriptadas con AES-256-CBC usando `CREDENTIALS_ENCRYPTION_KEY` (variable de entorno).

### Pipeline de datos

```
FacturaTech (web)
    │ Playwright headless
    ▼
scraper/lib/extractors/*.js
    │ extracción → JSON
    ▼
scraper/lib/persist.js
    │ INSERT/UPDATE en PostgreSQL
    ▼
Base de datos (contaya)
    │ disponible via API REST
    ▼
Frontend React
```

## Configuración IA (opencode)

Agentes configurados en `~/.config/opencode/opencode.json` con modelos NVIDIA (API compatible OpenAI en `https://integrate.api.nvidia.com/v1`):

| Agente | Alias | Modelo | Uso |
|--------|-------|--------|-----|
| Build (default) | `@build` | `opencode/big-pickle` | Desarrollo general, edición de código |
| Nemotron | `@nemotron` | `nvidia/nvidia/nemotron-3-ultra-550b-a55b` | Razonamiento profundo + escritura de código |
| Plan | `@plan` | `nvidia/nvidia/nemotron-3-ultra-550b-a55b` | Solo lectura — arquitectura, debugging, análisis |
| General | `@general` | `nvidia/mistralai/ministral-14b-instruct-2512` | Tareas rápidas, investigación, edits pequeños |
| Explore | `@explore` | `nvidia/google/gemma-4-31b-it` | Búsqueda ligera en código, preguntas simples |

Uso en opencode: `@nemotron refactoriza este servicio`, `@plan analiza esta arquitectura`, `@general busca dónde se usa X`, `@explore encuentra Y`.

API Key NVIDIA en `opencode.json` → `provider.nvidia.options.apiKey` (o vía `opencode auth login -p nvidia`).