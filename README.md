# Plataforma GM Express

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Clerk](https://img.shields.io/badge/Clerk-Auth-6C47FF?logo=clerk&logoColor=white)](https://clerk.com/)
[![Capacitor](https://img.shields.io/badge/Capacitor-8-119EFF?logo=capacitor&logoColor=white)](https://capacitorjs.com/)

Sistema integral de gestión y despacho de pedidos de alimentación corporativa para GM Express. Cubre el ciclo operativo completo: menú semanal, pedido del trabajador, consolidación por empresa, producción, facturación y configuración de plazos.

## Descripción general

GM Express entrega colaciones a empresas cliente. La plataforma separa ese flujo en dos superficies que comparten la misma API y la misma base de datos:

- **Panel web de administración**, usado por el rol `ADMIN`. Desde ahí se planifica el menú, se administran empresas y convenios, se sigue el estado de los pedidos y se exporta la información de producción y facturación.
- **Aplicación móvil**, usada por `TRABAJADOR` y `REPRESENTANTE`. El trabajador elige su menú dentro del plazo configurado. El representante de la empresa revisa la planilla, vincula trabajadores y consulta el resumen de su faena.

La autenticación es de Clerk. El webhook de Clerk crea y actualiza el usuario en PostgreSQL, y el rol guardado en base de datos decide qué superficie puede abrir.

## Créditos y autoría

**Proyecto colaborativo**, desarrollado por el equipo de GM Express.

| Persona | Rol |
| --- | --- |
| Javier Pizarro | Full Stack Developer |
| Bryan Carvajal | Full Stack Developer |
| Matias Gutierrez | Full Stack Developer |

## Stack tecnológico

### Backend

- **Node.js** con **Next.js 16** (App Router y Route Handlers en `web/app/api`).
- **Prisma ORM 5** como capa de acceso a datos.
- **Svix** para verificar la firma del webhook de Clerk.
- **ExcelJS** y **SheetJS (`xlsx`)** para importar minutas y exportar pedidos.

### Frontend

- **Panel web:** React 19, TypeScript, Tailwind CSS 4 y componentes de interfaz (shadcn / Base UI).
- **App móvil:** React 19, Vite 8, React Router 7 y Tailwind CSS 4, empaquetada con **Capacitor 8** para Android (`com.gmexpress.app`).

### Base de datos

- **PostgreSQL**, alojado en **Neon**.
- Prisma usa dos conexiones: `DATABASE_URL` (pool, runtime) y `DIRECT_URL` (conexión directa para migraciones).

### Autenticación

- **Clerk** en ambas superficies.
- Web: `@clerk/nextjs`, con el panel restringido al rol `ADMIN`.
- Móvil: `@clerk/clerk-react`. El rol `ADMIN` no opera la app; ve la pantalla de acceso denegado.

### Infraestructura de desarrollo

- API y panel en el puerto **3000**.
- App móvil en Vite, puerto **5173**, con proxy de `/api` hacia el servidor Next.js.
- Proyecto Android de Capacitor en `appmovil/android`. En desarrollo el emulador apunta a `http://10.0.2.2:5173`.

## Arquitectura y características clave

```text
App móvil (Vite + Capacitor)          Panel web (Next.js)
 Trabajador / Representante            Admin
            \                              /
             \                            /
              +-->  Route Handlers  <----+
                    web/app/api
                          |
                    Prisma + PostgreSQL
                          |
              Cron  /api/cron/auto-asignar
```

### Dualidad móvil y web

Las dos aplicaciones consumen la misma API.

| Superficie | Rutas principales | Qué resuelve |
| --- | --- | --- |
| Panel web | `/dashboard`, `/planificador`, `/pedidos`, `/facturacion`, `/empresas`, `/usuarios`, `/configuracion` | Operación diaria, menú, empresas, producción y facturación |
| App móvil | `/`, `/historial`, `/trabajadores` | Pedido del trabajador, historial y gestión del representante |

La API está agrupada por actor: `admin`, `trabajador`, `representante`, `usuarios`, más el webhook `webhooks/clerk`.

### Consultas del dashboard y tarea programada

El home del panel no encadena sus lecturas. `getDashboardStats` dispara en paralelo, con `Promise.all`, los conteos del día, los pedidos pendientes, las porciones, las empresas, la serie semanal y los últimos pedidos. Esa agregación es la que alimenta las tarjetas y el gráfico del dashboard.

La asignación del menú por defecto queda fuera de esa petición. El endpoint `GET /api/cron/auto-asignar` está pensado para un scheduler (Vercel Cron u otro) y se protege con `Authorization: Bearer <CRON_SECRET>` cuando la variable existe. El job:

1. Toma el día siguiente y no hace nada si cae en sábado o domingo.
2. Busca el menú del día ya configurado.
3. Recorre los trabajadores que no pidieron y que no tienen ese día bloqueado.
4. Crea esos pedidos en una sola transacción de Prisma.

El resultado queda persistido. El dashboard y la operación del día leen esos pedidos ya escritos, junto con el resto de las métricas.

### Otras capacidades

- Planificador semanal, selección del menú del día y carga de minuta Excel.
- Convenios por empresa (qué componentes del menú están habilitados y tipo de empaquetado).
- Estados de pedido: `PENDIENTE`, `CONFIRMADO`, `EN_PRODUCCION`, `ENTREGADO`, `CANCELADO`.
- Bloqueo de días por trabajador y hora límite de pedido en horario de Chile (`America/Santiago`).
- Exportación de producción e histórico, y módulo de facturación por empresa y rango de fechas.

## Requisitos previos e instalación

- Node.js 20 o superior y npm.
- Una base PostgreSQL en Neon (o compatible) con permisos para migrar.
- Una aplicación en Clerk, con el webhook apuntando a `/api/webhooks/clerk`.

El panel y la app móvil se instalan por separado.

### 1. Clonar

```bash
git clone <url-del-repositorio>
cd PlataformaGMExpressFORK
```

### 2. Panel web y API

```bash
cd web
npm install
```

Crea `web/.env` con:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST-pooler/DB?sslmode=require"
DIRECT_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
CLERK_WEBHOOK_SECRET="whsec_..."

CRON_SECRET="un-secreto-largo"
```

`DATABASE_URL` es la URL con pool de Neon. `DIRECT_URL` es la URL directa, la que Prisma usa en migraciones. Clerk lee `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` y `CLERK_SECRET_KEY` por convención del SDK.

Genera el cliente, aplica migraciones y levanta el servidor:

```bash
npx prisma generate
npx prisma migrate dev
npm run dev
```

El panel queda en [http://localhost:3000](http://localhost:3000) y redirige a `/auth/login`.

Datos de ejemplo (platos y un menú semanal):

```bash
npx prisma db seed
```

### 3. Aplicación móvil

En otra terminal, desde la raíz del repositorio:

```bash
cd appmovil
npm install
```

Crea `appmovil/.env` con la misma publishable key de Clerk:

```env
VITE_CLERK_PUBLISHABLE_KEY="pk_test_..."
```

```bash
npm run dev
```

Vite publica la app en [http://localhost:5173](http://localhost:5173) y reenvía `/api` a `http://localhost:3000`. El panel tiene que estar corriendo para que los pedidos y el menú respondan.

Para el emulador Android, el proyecto Capacitor ya está en `appmovil/android`. `capacitor.config.json` apunta el WebView a `http://10.0.2.2:5173` para recarga en vivo. Antes de un build de distribución hay que quitar `server.url` para que la app cargue el `dist` empaquetado (`npm run build` y luego `npx cap sync android`).

### Scripts

**`web/`**

| Script | Comando | Uso |
| --- | --- | --- |
| Desarrollo | `npm run dev` | Next.js en modo desarrollo |
| Producción | `npm run build` y `npm run start` | Build y servidor de producción |
| Lint | `npm run lint` | ESLint |
| Seed | `npx prisma db seed` | Carga platos y menú de ejemplo |

**`appmovil/`**

| Script | Comando | Uso |
| --- | --- | --- |
| Desarrollo | `npm run dev` | Vite con `--host` |
| Build | `npm run build` | Salida estática en `dist/` |
| Preview | `npm run preview` | Sirve el build |
| Lint | `npm run lint` | ESLint |

## Estructura del repositorio

```text
PlataformaGMExpressFORK/
├── web/                          Panel de administración y API
│   ├── app/
│   │   ├── (admin)/              Dashboard, pedidos, empresas, facturación, planificador
│   │   ├── api/                  Route Handlers (admin, trabajador, representante, cron, webhook)
│   │   └── auth/                 Login del panel
│   ├── components/               UI del panel y componentes base
│   ├── hooks/                    Estado de empresas, usuarios y planificador
│   ├── lib/                      Prisma, horario de Chile, pedidos, Excel y estadísticas
│   ├── prisma/                   schema.prisma, migraciones y seed
│   └── proxy.ts                  Sesión Clerk y control de rol ADMIN
├── appmovil/                     App de trabajador y representante
│   ├── src/
│   │   ├── pages/                Login, home, historial y trabajadores
│   │   ├── hooks/                Menú, pedidos, perfil, planilla y bloqueos
│   │   └── components/           UI móvil
│   ├── android/                  Proyecto nativo Capacitor
│   └── capacitor.config.json
├── prisma.config.ts
└── package.json                  Dependencias Prisma compartidas en la raíz
```

El esquema de dominio vive en `web/prisma/schema.prisma`: empresas y convenios, usuarios y roles, menú semanal, menú del día, pedidos y la configuración de hora límite.
