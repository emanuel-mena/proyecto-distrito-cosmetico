# Distrito Cosmético Backend

Backend REST con Node.js, Express, MongoDB y Mongoose. El frontend no forma parte de este servicio y no fue modificado.

## Instalación

1. Instalar MongoDB local o usar una URI de MongoDB Atlas.
2. Ejecutar `npm install`.
3. Copiar `.env.example` como `.env` y configurar `MONGODB_URI` y `JWT_SECRET`.
4. Cargar datos iniciales con `node src/seed/seed.js`.
5. Iniciar con `npm run dev` o `npm start`.

Health check: `GET http://localhost:3000/api/health`.

## API

Las rutas están agrupadas bajo `/api`: `auth`, `products`, `categories`, `cart`, `orders` y `currency`. Las rutas protegidas reciben `Authorization: Bearer <token>`. El primer usuario administrador se crea con `ADMIN_EMAIL` y `ADMIN_PASSWORD` durante el seed.

Ejemplos:

```bash
curl http://localhost:3000/api/products
curl "http://localhost:3000/api/currency/convert?amount=15000&from=crc&to=usd"
```

La conversión usa `fawazahmed0/exchange-api`, con fallback CDN incluido.
