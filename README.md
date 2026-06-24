# Contaya

Plataforma contable multi-tenant para gestión de facturación electrónica, clientes y documentos. Desarrollada para facturadores colombianos que requieren consolidar facturas electrónicas extraídas desde [Facturatech](https://plataforma.facturatech.co).

## Tech Stack

| Capa | Tecnología |
|------|-----------|
| **Frontend** | React 19, React Router 7, Vite 8, Axios |
| **Backend** | Node.js, Express 5, pg (node-postgres) |
| **Base de datos** | PostgreSQL 16 |
| **Scraper** | Node.js (ESM), Playwright |
| **Auth** | JWT (jsonwebtoken), bcryptjs |
| **Uploads** | Multer 2 |
| **Producción** | Oracle Cloud VM (Ubuntu), nginx, systemd, Cloudflare SSL |

## Arquitectura

```
┌─────────────────────────────────────────────────┐
│  Navegador                                      │
│  └─ drivingradio.us                             │
└──────────────┬──────────────────────────────────┘
               │ HTTPS (Cloudflare)
┌──────────────▼──────────────────────────────────┐
│  nginx                                          │
│  ├─ /api/*          → backend:3001              │
│  ├─ /uploads/*      → backend/uploads/          │
│  └─ /*              → frontend/dist/            │
└─────────────────────────────────────────────────┘
       │                          │
┌──────▼──────┐           ┌──────▼──────┐
│  Backend    │           │  Frontend   │
│  Express 5  │           │  React SPA  │
│  Port 3001  │           │  (Vite)     │
└──────┬──────┘           └─────────────┘
       │
┌──────▼──────┐
│  PostgreSQL │
│  (contaya)  │
└──────┬──────┘
       │
┌──────▼──────┐
│  Scraper    │
│  Playwright │
│  (manual)   │
└─────────────┘
```

## Estructura del proyecto

```
contaya/
├── deploy.sh                 # Script de despliegue en producción
├── backend/
│   ├── server.js             # Punto de entrada (Express)
│   ├── db/pool.js            # Pool de conexión PostgreSQL
│   ├── middleware/
│   │   ├── auth.js           # JWT + adminOnly
│   │   └── tenantContext.js  # Aislamiento multi-tenant
│   ├── routes/
│   │   ├── auth.js           # Login, register, reset-password, impersonate
│   │   ├── invoices.js       # Facturas CRUD, summary, consolidated
│   │   ├── clients.js        # Clientes por facturador
│   │   ├── billers.js        # Admin: CRUD de facturadores
│   │   ├── documents.js      # Upload/list/delete documentos
│   │   └── health.js         # Health check
│   └── uploads/              # Archivos subidos (tenant-scoped)
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # Router (9 rutas)
│   │   ├── services/api.js   # Cliente HTTP con interceptores
│   │   ├── pages/            # Landing, Login, Dashboard, Facturas, etc.
│   │   └── components/       # Navbar, Hero, Features, Footer, etc.
│   └── dist/                 # Build de producción
└── scraper/
    ├── index.js              # Scraper principal de Facturatech
    ├── scrape_biller_info.mjs
    ├── scrape_vladimir.sh
    └── scrape_mendieta.sh
```

## Prerrequisitos

- Node.js >= 18
- PostgreSQL 16
- npm

## Instalación

### Backend

```bash
cd backend
npm install
```

### Frontend

```bash
cd frontend
npm install
```

### Scraper

```bash
cd scraper
npm install
npx playwright install chromium
```

## Ejecución local

### Base de datos

Crear la base de datos PostgreSQL:

```sql
CREATE DATABASE contaya;
```

Ejecutar las migraciones multi-tenant si se añaden nuevas tablas:

```bash
psql -U contaya -d contaya -f backend/migrate-multitenant.sql
```

### Backend

```bash
cd backend
npm run dev       # Desarrollo con auto-reload
npm start         # Producción
```

El servidor corre en `http://localhost:3001`.

### Frontend

```bash
cd frontend
npm run dev       # Vite dev server con HMR
npm run build     # Build de producción
npm run preview   # Previsualizar build
npm run lint      # ESLint
```

## Variables de entorno

Crear un archivo `.env` en `backend/`:

| Variable | Default | Descripción |
|----------|---------|-------------|
| `PORT` | `3001` | Puerto del servidor backend |
| `DB_HOST` | `localhost` | Host de PostgreSQL |
| `DB_PORT` | `5432` | Puerto de PostgreSQL |
| `DB_USER` | `contaya` | Usuario de PostgreSQL |
| `DB_PASSWORD` | `contaya123` | Contraseña de PostgreSQL |
| `DB_NAME` | `contaya` | Nombre de la base de datos |
| `JWT_SECRET` | `contaya_secret_change_in_prod` | Secreto para firmar JWT |

> **Importante:** Cambiar `JWT_SECRET` y `DB_PASSWORD` en producción.

## API Endpoints

### Autenticación

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `POST` | `/api/auth/register` | No | Registrar admin |
| `POST` | `/api/auth/login` | No | Login (email admin / NIT facturador) |
| `POST` | `/api/auth/reset-password` | No | Restablecer contraseña (admin) |
| `GET` | `/api/auth/me` | JWT | Info del usuario actual |
| `POST` | `/api/auth/impersonate/:biller_id` | JWT+Admin | Suplantar facturador |

### Facturas

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/invoices` | JWT+BillerCtx | Listar facturas (con filtros) |
| `GET` | `/api/invoices/summary` | JWT+BillerCtx | Resumen de facturas |
| `GET` | `/api/invoices/summary-by-biller` | JWT+BillerCtx | Resumen agrupado por facturador |
| `GET` | `/api/invoices/clients-by-biller` | JWT+BillerCtx | Clientes agrupados por facturador |
| `GET` | `/api/invoices/consolidated` | JWT+BillerCtx | Datos consolidados anuales |

### Clientes

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/clients` | JWT+BillerCtx | Listar clientes del facturador |

### Facturadores (admin)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/billers` | JWT | Listar facturadores |
| `POST` | `/api/billers` | JWT+Admin | Crear facturador + ejecutar scraper |
| `PUT` | `/api/billers/:id` | JWT+Admin | Actualizar facturador |
| `DELETE` | `/api/billers/:id` | JWT+Admin | Eliminar facturador |

### Documentos

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `POST` | `/api/documents/upload` | JWT+BillerCtx | Subir documento |
| `GET` | `/api/documents` | JWT+BillerCtx | Listar documentos |
| `GET` | `/api/documents/:id` | JWT+BillerCtx | Obtener metadata |
| `DELETE` | `/api/documents/:id` | JWT+BillerCtx | Eliminar documento |

### Health

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/health` | No | Health check |

## Modelo multi-tenant

Cada facturador se identifica mediante un `biller_id` (UUID). El middleware `tenantContext` inyecta este ID en cada request autenticado y todas las consultas SQL se filtran automáticamente con `WHERE biller_id = $N::uuid`, garantizando aislamiento estricto de datos.

- **Admin**: ve todos los datos de todos los facturadores y puede suplantar a cualquiera.
- **Facturador**: solo ve sus propios datos (facturas, clientes, documentos).

### Flujo de autenticación

1. **Admin** inicia sesión con email → tabla `users`.
2. **Facturador** inicia sesión con NIT → tabla `billers` por `document_number`.
3. Token JWT expira en 7 días (2 horas para tokens de suplantación).
4. El payload del token incluye `role`, `biller_id` y `name`.

## Scraper

El scraper usa Playwright para extraer facturas de `plataforma.facturatech.co` y guardarlas en PostgreSQL.

```bash
cd scraper
node index.js --user=<NIT> --pass=<password> --biller-id=<uuid>
```

También puede ejecutarse con los scripts predefinidos:

```bash
bash scrape_vladimir.sh     # Vladimir Ortega Ospino
bash scrape_mendieta.sh     # Construcciones Lopez Mendieta
```

## Despliegue

El proyecto se despliega en Oracle Cloud (Ubuntu) con `deploy.sh`:

```bash
bash deploy.sh
```

Este script:
1. Hace pull de los últimos cambios
2. Instala dependencias del backend
3. Instala dependencias del frontend y genera build (`dist/`)
4. Ajusta permisos para nginx
5. Recarga nginx y reinicia el servicio systemd `contaya-api`

### Servicios en producción

| Servicio | Comando |
|----------|---------|
| API backend | `sudo systemctl restart contaya-api` |
| nginx | `sudo systemctl reload nginx` |
| Logs backend | `sudo journalctl -u contaya-api -f` |

## Sistema de Diseño y Mejoras de UI/UX

### Sistema de Diseño con Variables CSS
Contaya implementa un sistema de diseño completo basado en variables CSS para mantener consistencia visual:

```css
:root {
  --primary: #2563eb;           /* Azul principal */
  --primary-dark: #1e40af;      /* Azul oscuro */
  --gray-50: #f8fafc;           /* Fondo claro */
  --gray-800: #1e293b;          /* Texto principal */
  --shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
  --radius: 0.5rem;             /* Radio de bordes */
  --transition: all 0.2s ease-in-out;
}
```

### Mejoras Implementadas

#### 🎨 **Login Mejorado**
- **Loading states** con spinner animado
- **Hover effects** en botones y enlaces
- **Focus states** mejorados en inputs
- **Feedback visual** para errores
- **Transiciones suaves** en todos los elementos

#### 📊 **Página de Facturas**
- **Paginación** (20 facturas por página)
- **Estadísticas en tiempo real**: Total facturado, IVA, subtotal
- **Cards interactivas** con hover effects
- **Filtros avanzados** en grid responsive
- **Tabla mejorada** con:
  - Animaciones escalonadas en filas
  - Badges para estados (Firmado/Pendiente)
  - Información expandida de clientes
  - Cálculos automáticos de IVA (19%) y subtotal

#### 🎯 **Componentes Reutilizables**
```css
.card          /* Cards con sombras y hover */
.btn           /* Botones con variantes (primary, secondary, danger) */
.badge         /* Badges para estados (success, warning, danger, info) */
.loading-spinner /* Spinner animado */
.table-container /* Contenedor de tablas con scroll */
```

#### 📱 **Responsive Design**
- **Grid adaptable** para filtros y estadísticas
- **Tabla con scroll horizontal** en dispositivos móviles
- **Breakpoints optimizados** para diferentes tamaños de pantalla
- **Tipografía escalable** con unidades relativas

#### ✨ **Efectos Visuales**
- **Animaciones fade-in** para carga progresiva
- **Transiciones suaves** en hover states
- **Sombras y profundidad** para elementos interactivos
- **Feedback táctil** en botones y cards

### Flujo de Trabajo UI/UX
1. **Consistencia**: Todas las páginas usan el mismo sistema de variables CSS
2. **Accesibilidad**: Contraste adecuado, estados focus visibles
3. **Performance**: Animaciones optimizadas, carga progresiva
4. **Usabilidad**: Feedback inmediato en todas las interacciones

## Licencia

ISC
