# CHANGELOG_AI — Contaya

Registro de cambios y estado actual del proyecto.

---

## [e313b34] — 2026-06-24 — Arquitectura Multitenancy

### Descripción
Implementación completa de arquitectura multitenancy (multi-inquilino) con aislamiento estricto de datos por `biller_id`. Cada biller (facturador) ve solo sus propios datos; el admin ve todo.

### Archivos creados
| Archivo | Propósito |
|---------|-----------|
| `backend/db/pool.js` | Pool de PostgreSQL centralizado |
| `backend/middleware/auth.js` | `authMiddleware` (JWT) + `adminOnly` |
| `backend/middleware/tenantContext.js` | `billerContext` + `whereBiller()` — inyecta `req.billerId` y filtra queries |
| `backend/routes/auth.js` | Login (admin+biller), register, reset-password, /me |
| `backend/routes/invoices.js` | CRUD facturas con scope por `biller_id` |
| `backend/routes/clients.js` | Clientes scoped: admin ve todos, biller solo los suyos (INNER JOIN invoices) |
| `backend/routes/billers.js` | CRUD billers (admin-only para crear/editar/eliminar) |
| `backend/routes/health.js` | Health check endpoint |
| `backend/migrate-multitenant.sql` | Migración: agrega `biller_id` a clients y documents, índices |

### Archivos modificados
| Archivo | Cambio |
|---------|--------|
| `backend/server.js` | Refactorizado de 395 líneas monolíticas a ~20 líneas que importan rutas |
| `backend/routes/documents.js` | Reescrito: ahora usa DB con `biller_id`, middleware auth, multer local |

### Archivos eliminados
| Archivo | Razón |
|---------|-------|
| `backend/controllers/documentController.js` | Usaba almacenamiento en memoria, reemplazado por DB |
| `backend/services/pdfService.js` | No usado por las nuevas rutas |

### Lógica implementada
- **Login dual**: admin por email (tabla `users`), biller por NIT (tabla `billers`)
- **JWT**: payload incluye `biller_id` (UUID), `role`, `name`
- **billerContext middleware**: si `role === 'biller'` → `req.billerId = uuid`; si admin → `null`
- **whereBiller() helper**: agrega `AND biller_id = $N::uuid` automáticamente a las queries
- **Aislamiento**: todas las rutas de datos (invoices, clients, documents) filtran por `biller_id`
- **Admin**: ve todos los datos sin filtro

### Estado actual del servidor (Oracle Cloud)
- Backend Node.js/Express en puerto 3001, systemd `contaya-api`
- Frontend React + Vite, servido por nginx en drivingradio.us
- PostgreSQL 16 local, base `contaya`
- nginx reverse proxy: `/api/` y `/uploads/` → backend, resto → frontend/dist
- Cloudflare SSL Full, proxy naranja

### Tenant IDs en producción
| Biller | UUID | Facturas |
|--------|------|----------|
| Vladimir Ortega Ospino | `86bdb982-cf8e-43f9-a24e-d550fbada4af` | 95 |
| CONSTRUCCIONES LOPEZ MENDIETA S.A.S. | `2418bbee-7cc8-46eb-a6f6-edec77f9f690` | 301 |

### Datos verificados
- Admin login: ✅ ve 396 facturas totales
- Vladimir login (72005672-4 / Ortega2026$): ✅ ve solo 95 facturas
- Clients scoped: ✅ Vladimir ve 9 clientes propios

---

## [8a00365] — 2026-06-24 — Rediseño completo estilo facturatech

### Descripción
Todas las páginas fueron rediseñadas al estilo facturatech (blanco/azul, fondo `#f8fafc`, azul `#2563eb`, texto `#111827`).

### Archivos modificados
| Archivo | Cambio |
|---------|--------|
| `frontend/src/pages/Login.jsx` | Card blanca sobre gradiente azul |
| `frontend/src/pages/Register.jsx` | Card blanca sobre gradiente azul |
| `frontend/src/pages/ForgotPassword.jsx` | Card blanca sobre gradiente azul |
| `frontend/src/pages/Dashboard.jsx` | Fondo `#f8fafc`, tabla blanca, cards blancas |
| `frontend/src/pages/Facturas.jsx` | Fondo `#f8fafc`, tabla blanca |
| `frontend/src/pages/Clients.jsx` | Fondo `#f8fafc`, cards blancas |

---

## [cad4bec] — 2026-06-24 — Rediseño landing estilo facturatech

### Descripción
Landing page rediseñada imitando www.facturatech.co: navbar blanca con solo "Características" e "Iniciar sesión", hero gradiente azul, features en cards blancas, footer azul.

### Archivos modificados
`frontend/src/components/Navbar.jsx`, `Hero.jsx`, `Features.jsx`, `Footer.jsx`
`frontend/src/pages/Landing.jsx`

---

## [337e94d] — 2026-06-24 — Fix Clientes para billers

### Descripción
Backend: `/api/clients` ahora permite billers (filtra por `biller_id`).
Frontend: Facturas.jsx y Clients.jsx envían `Authorization: Bearer` en los fetch.

---

## [64450eb] — 2026-06-18 — Cleanup Supabase/Vercel + sincronización

### Descripción
Eliminados todos los archivos de Supabase y Vercel del repositorio. Sincronizado local con servidor Oracle.

---

## [1691c66] — 2026-06-18 — Actualización producción inicial

### Descripción
Primera versión funcional en producción con login, clientes, facturas, scraper multi-facturador.

---

## [ad169b3] — 2026-06-18 — Initial commit

### Descripción
Commit inicial: Contaya, sistema contable con landing page y estructura base.
