# Landing Page RAME Floristeria

Landing page en React + Vite para catalogo y contacto, con panel administrativo protegido por sesion HTTP.

## Requisitos

- Node.js 20 o superior

## Configuracion local

1. Copia el archivo de ejemplo:

   ```bash
   cp .env.example .env
   ```

2. Ajusta variables en `.env`:
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`
   - `ADMIN_SESSION_SECRET` (larga y aleatoria)
   - `ADMIN_SESSION_MAX_AGE_SECONDS` (opcional)
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_SHARED_STORE_TABLE` (opcional)
   - `SUPABASE_SHARED_STORE_KEY` (opcional)
   - `R2_ACCOUNT_ID`
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
   - `R2_BUCKET_NAME`
   - `R2_PUBLIC_BASE_URL`
   - `API_PORT` (opcional)
   - `PORT` (opcional)

3. Crea la tabla en Supabase ejecutando el SQL de `supabase/shared_store.sql`

4. Instala dependencias:

   ```bash
   npm install
   ```

## Desarrollo

```bash
npm run dev
```

Este comando levanta:
- API local de autenticacion (`/api/admin/*`)
- Frontend Vite

## Produccion local

Compilar frontend:

```bash
npm run build
```

Levantar servidor de produccion local (API + estaticos de `dist`):

```bash
npm run start
```

## Despliegue en Vercel

Este repo incluye funciones serverless en:
- `api/admin/login.js`
- `api/admin/session.js`
- `api/admin/logout.js`
- `api/store.js`
- `api/admin/store.js`
- `api/admin/images.js`

En Vercel define variables de entorno en Project Settings:
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
- `ADMIN_SESSION_MAX_AGE_SECONDS` (opcional)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_SHARED_STORE_TABLE` (opcional; por defecto `shared_store`)
- `SUPABASE_SHARED_STORE_KEY` (opcional; por defecto `main`)
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_BASE_URL`
- `API_JSON_BODY_MAX_BYTES` (opcional; por defecto 8388608, util si subes imagenes mas pesadas)
- `ADMIN_IMAGE_UPLOAD_MAX_BYTES` (opcional; por defecto 2097152)

Despues de guardar variables, fuerza un nuevo deploy.

## Seguridad del panel admin

- El frontend no contiene credenciales hardcodeadas.
- Login y sesion se validan en backend (local o Vercel Functions).
- La sesion usa cookie firmada (`HttpOnly`, `SameSite=Lax`).
- La llave `SUPABASE_SERVICE_ROLE_KEY` solo se usa en backend. No debe exponerse en el navegador.
- El panel sigue accesible desde `#admin`, pero requiere sesion valida.

## Persistencia de contenido

- Productos y banner: `localStorage` + respaldo en `IndexedDB` para respuesta rapida local
- Store compartido entre dispositivos: Supabase, via `api/store` y `api/admin/store`
- Imagenes de productos y banners: Cloudflare R2, via URLs firmadas de `api/admin/images`

## Imagenes en R2

Para subir imagenes directo a R2 desde el navegador, configura CORS en el bucket con tu dominio de produccion y `http://localhost:5173` si pruebas localmente.
