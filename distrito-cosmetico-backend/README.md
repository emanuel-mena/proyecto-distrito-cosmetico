# Distrito Cosmético

Aplicación web completa con API REST en Node.js/Express, MongoDB y frontend Vue 3. En producción Express sirve tanto `/api` como la SPA construida.

## Requisitos

- Node.js 20.19 o superior.
- MongoDB local o una URI de MongoDB Atlas.
- El repositorio completo, incluido el submódulo del frontend.

```bash
git clone --recurse-submodules <url-del-repositorio>
cd proyecto-distrito-cosmetico/distrito-cosmetico-backend
npm ci
```

Copie `.env.example` como `.env` y configure al menos `MONGODB_URI` y `JWT_SECRET`. No utilice las credenciales administrativas predeterminadas en producción.

## Desarrollo

```bash
npm run seed
npm run dev
```

`npm run dev` inicia Express en el puerto 3000 y Vite en el puerto 5173. Vite redirige `/api` al backend. Para iniciar solamente el API use `npm run dev:api`.

## Build y ejecución

```bash
npm run build
npm start
```

El build instala de forma reproducible las dependencias del frontend, ejecuta Vite y copia el resultado a `public/`. `npm start` sirve API, archivos estáticos y el fallback de Vue Router desde un único proceso Node.

Variables disponibles:

- `MONGODB_URI`: conexión de MongoDB.
- `JWT_SECRET`: secreto de firma de sesiones.
- `PORT`: puerto HTTP, predeterminado `3000`.
- `CORS_ORIGIN`: origen permitido durante desarrollo separado.
- `ADMIN_EMAIL` y `ADMIN_PASSWORD`: administrador creado por `npm run seed`.

## API

Las rutas se agrupan bajo `/api`: `auth`, `products`, `categories`, `cart`, `orders` y `currency`. Las rutas protegidas reciben `Authorization: Bearer <token>`.

Health check: `GET /api/health`.
