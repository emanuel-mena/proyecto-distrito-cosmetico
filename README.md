# Distrito Cosmético

Aplicación web de comercio electrónico para la consulta y compra de productos cosméticos. El proyecto está compuesto por un frontend en Vue 3 y una API REST en Node.js/Express conectada a MongoDB.

## Funcionalidades

- Catálogo de productos y categorías.
- Registro e inicio de sesión con autenticación JWT.
- Carrito de compras para usuarios autenticados.
- Creación y consulta de órdenes.
- Conversión de moneda mediante la API.
- Panel administrativo para gestionar productos, categorías y estados de órdenes.
- Modo producción en el que Express sirve la API y la SPA desde un único proceso.

## Tecnologías

- **Frontend:** Vue 3, Vite, Vue Router, Pinia, Bootstrap 5 y Bootstrap Icons.
- **Backend:** Node.js 20.19+, Express 5, Mongoose, MongoDB, JSON Web Tokens y bcryptjs.
- **Herramientas:** ESLint, Prettier, Nodemon y Node Test Runner.

## Estructura

```text
proyecto-distrito-cosmetico/
├── distrito-cosmetico-backend/              # API, modelos, seed y servidor
└── distrito-cosmetico-frontend/
    └── PrograWebA-Proyecto/                 # Aplicación Vue 3
```

El frontend se mantiene como un submódulo Git. Para clonar el proyecto completo:

```bash
git clone --recurse-submodules <url-del-repositorio>
cd proyecto-distrito-cosmetico
```

Si el repositorio ya fue clonado sin submódulos:

```bash
git submodule update --init --recursive
```

## Requisitos

- Node.js 20.19 o superior.
- npm.
- MongoDB local o una instancia de MongoDB Atlas.

## Configuración

Desde `distrito-cosmetico-backend`, cree el archivo `.env` a partir de `.env.example`:

```bash
cd distrito-cosmetico-backend
copy .env.example .env       # Windows
# cp .env.example .env       # macOS/Linux
```

Configure estas variables:

| Variable | Descripción | Valor predeterminado |
| --- | --- | --- |
| `MONGODB_URI` | URI de conexión a MongoDB | `mongodb://127.0.0.1:27017/distrito-cosmetico` |
| `JWT_SECRET` | Secreto para firmar los tokens | — |
| `PORT` | Puerto de la API | `3000` |
| `CORS_ORIGIN` | Origen permitido para el frontend | `http://localhost:5173` |
| `ADMIN_EMAIL` | Correo del administrador creado por el seed | — |
| `ADMIN_PASSWORD` | Contraseña del administrador creado por el seed | — |

No use credenciales ni secretos de ejemplo en producción.

## Desarrollo

Instale las dependencias del backend y frontend:

```bash
cd distrito-cosmetico-backend
npm ci

cd ../distrito-cosmetico-frontend/PrograWebA-Proyecto
npm ci
```

Inicialice la base de datos con los productos, categorías, usuarios y órdenes de ejemplo:

```bash
cd ../../distrito-cosmetico-backend
npm run seed
```

Para iniciar API y frontend simultáneamente:

```bash
npm run dev
```

- API: `http://localhost:3000`
- Frontend: `http://localhost:5173`
- Health check: `http://localhost:3000/api/health`

Para iniciar únicamente la API use `npm run dev:api`. El frontend redirige automáticamente las solicitudes `/api` hacia el backend.

## Build y producción

Desde `distrito-cosmetico-backend`:

```bash
npm run build
npm start
```

`npm run build` instala las dependencias del frontend, genera su build de Vite y copia el resultado a `distrito-cosmetico-backend/public`. Luego `npm start` sirve la API y la aplicación web desde el puerto configurado en `PORT`.

## Pruebas y calidad

Backend:

```bash
cd distrito-cosmetico-backend
npm test
```

Frontend:

```bash
cd distrito-cosmetico-frontend/PrograWebA-Proyecto
npm run lint
npm run build
```

## API principal

Todas las rutas están bajo `/api`. Las rutas protegidas requieren el encabezado `Authorization: Bearer <token>`.

| Recurso | Ruta | Operaciones principales |
| --- | --- | --- |
| Autenticación | `/api/auth` | Registro e inicio de sesión |
| Productos | `/api/products` | Consulta; CRUD para administradores |
| Categorías | `/api/categories` | Consulta; CRUD para administradores |
| Carrito | `/api/cart` | Consultar, agregar, actualizar y eliminar productos |
| Órdenes | `/api/orders` | Crear, consultar y actualizar estado |
| Moneda | `/api/currency/convert` | Conversión de precios |

## Licencia

El frontend incluye un archivo `LICENSE`. Consulta ese archivo para conocer los términos de uso del proyecto.
