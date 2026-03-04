# Landing Page RAMÉ Floristería

Landing page en React + Vite para catálogo y contacto, con panel administrativo protegido por sesión HTTP en backend.

## Requisitos

- Node.js 20 o superior

## Configuración

1. Copia el archivo de ejemplo:

   ```bash
   cp .env.example .env
   ```

2. Ajusta variables en `.env`:
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`
   - `ADMIN_SESSION_SECRET` (larga y aleatoria)
   - `ADMIN_SESSION_MAX_AGE_SECONDS` (opcional)
   - `API_PORT` (opcional)
   - `PORT` (opcional)

3. Instala dependencias:

   ```bash
   npm install
   ```

## Desarrollo

```bash
npm run dev
```

Este comando levanta:
- API de autenticación (`/api/admin/*`)
- Frontend Vite

## Producción

Compilar frontend:

```bash
npm run build
```

Levantar servidor de producción (API + estáticos de `dist`):

```bash
npm run start
```

## Seguridad del panel admin

- El frontend ya no contiene credenciales hardcodeadas.
- Login y sesión se validan en backend.
- La sesión se mantiene en cookie firmada (`HttpOnly`, `SameSite=Lax`).
- El panel sigue accesible desde `#admin`, pero requiere sesión válida en servidor.

## Persistencia de contenido

- Productos: `localStorage`
- Contenido del hero/banner: `localStorage` + respaldo en `IndexedDB`
