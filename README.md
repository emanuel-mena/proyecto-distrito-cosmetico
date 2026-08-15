# Distrito Cosmético

Aplicación web de comercio electrónico para consultar y administrar productos cosméticos, gestionar el carrito y completar órdenes. El proyecto integra una SPA en Vue 3 con una API REST en Node.js/Express y persistencia en MongoDB mediante Mongoose.

En desarrollo, Vite y Express se ejecutan por separado. En producción, Express sirve tanto la API bajo `/api` como la SPA compilada desde un único proceso.

## Estado actual

El flujo principal está implementado de extremo a extremo:

- registro e inicio de sesión con JWT;
- autorización para clientes y administradores;
- catálogo con búsqueda, categorías y detalle de producto;
- carrito persistente en MongoDB para usuarios autenticados y en `localStorage` para invitados;
- creación de órdenes con validación y descuento de existencias;
- consulta de compras propias y administración de órdenes;
- CRUD administrativo de productos y categorías;
- conversión de precios de CRC a USD mediante una API pública externa;
- manejo centralizado de errores y respuestas HTTP;
- seed reproducible para datos iniciales;
- build integrado del frontend y el backend.

## Cumplimiento de la consigna de Avance Final

La implementación cubre los requisitos técnicos mínimos indicados en la consigna:

| Requisito | Implementación y evidencia en el repositorio | Estado |
| --- | --- | :---: |
| Backend con Node.js, rutas HTTP y controladores | Express se configura en [`src/server.js`](src/server.js); las rutas están separadas en [`src/routes`](src/routes) y delegan la lógica a [`src/controllers`](src/controllers). | Cumplido |
| Base de datos NoSQL | La conexión usa MongoDB y Mongoose en [`src/config/db.js`](src/config/db.js). | Cumplido |
| Usuarios, productos, categorías, órdenes y carrito | Los cinco esquemas requeridos se encuentran en [`src/models`](src/models). | Cumplido |
| Insertar, consultar, actualizar y eliminar | Los controladores implementan CRUD, principalmente para productos y categorías; carrito y órdenes incorporan las operaciones propias de cada flujo. | Cumplido |
| ORM/ODM: modelos, relaciones y CRUD | Mongoose funciona como ODM. Se usan referencias `ObjectId` entre carrito-usuario-producto, producto-categoría y orden-usuario-producto, además de `populate` y validaciones de esquema. | Cumplido |
| API REST propia | La API permite obtener y administrar productos, registrar usuarios, iniciar sesión, crear órdenes, consultar compras y administrar el carrito. | Cumplido |
| Códigos HTTP correctos | Se emplean `200`, `201`, `204`, `400`, `401`, `403`, `404`, `409`, `500` y `502` según el resultado de cada operación. | Cumplido |
| Consumo de una API de terceros | [`src/services/currency.service.js`](src/services/currency.service.js) consulta una API pública de tipos de cambio, procesa la tasa y dispone de un origen alternativo. | Cumplido |
| Integración backend + frontend | [`distrito-cosmetico-frontend/src/api/client.js`](distrito-cosmetico-frontend/src/api/client.js) centraliza `fetch`, serializa JSON, adjunta JWT y normaliza errores; los stores de Pinia consumen la API. | Cumplido |
| Organización y buenas prácticas | El código separa configuración, modelos, rutas, controladores, servicios, middleware y utilidades. La SPA separa vistas, componentes, stores, router y cliente HTTP. | Cumplido |

Además de los mínimos solicitados, la aplicación protege las operaciones administrativas por rol, evita registrar administradores desde el endpoint público, valida existencias antes de crear una orden y restaura el stock si la creación falla.

## Tecnologías

### Backend

- Node.js 20.19+
- Express 5
- MongoDB y Mongoose
- JSON Web Tokens y bcryptjs
- Node.js Test Runner

### Frontend

- Vue 3 y Vite
- Vue Router
- Pinia
- Bootstrap 5 y Bootstrap Icons
- ESLint y Prettier

## Estructura del proyecto

```text
.
|-- src/
|   |-- config/          # conexión a MongoDB
|   |-- controllers/     # reglas de negocio y respuestas HTTP
|   |-- middlewares/     # autenticación, autorización y errores
|   |-- models/          # esquemas y relaciones de Mongoose
|   |-- routes/          # endpoints de la API REST
|   |-- seed/            # carga inicial de datos
|   |-- services/        # integración con la API externa
|   |-- utils/           # JWT y utilidades asíncronas
|   `-- server.js        # configuración e inicio de Express
|-- distrito-cosmetico-frontend/
|   |-- public/          # imágenes, marca y favicon
|   `-- src/
|       |-- api/         # cliente HTTP
|       |-- components/  # componentes por dominio
|       |-- router/      # rutas y guardas de navegación
|       |-- stores/      # estado y acceso a la API con Pinia
|       `-- views/       # páginas de la SPA
|-- scripts/             # desarrollo conjunto y build integrado
|-- test/                # pruebas automatizadas del backend
|-- .env.example
`-- package.json
```

## Instalación

Requisitos:

- Node.js `>= 20.19.0`;
- npm;
- MongoDB local o una URI de MongoDB Atlas.

El frontend forma parte de este mismo repositorio; no requiere inicializar submódulos.

```bash
git clone <URL_DEL_REPOSITORIO>
cd proyecto-distrito-cosmetico
npm ci
npm --prefix distrito-cosmetico-frontend ci
```

Copie `.env.example` como `.env` y cambie al menos `JWT_SECRET`. Las credenciales incluidas son únicamente valores de desarrollo.

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017/distrito-cosmetico
JWT_SECRET=cambie-este-secreto-en-produccion
PORT=3000
CORS_ORIGIN=http://localhost:5173
ADMIN_EMAIL=admin@distritocosmetico.com
ADMIN_PASSWORD=Admin123456
```

Variables disponibles:

| Variable | Uso | Valor predeterminado |
| --- | --- | --- |
| `MONGODB_URI` | Conexión a MongoDB. | Sin valor seguro; debe configurarse. |
| `JWT_SECRET` | Firma y verificación de sesiones JWT. | `dev-secret` solo como respaldo local. |
| `PORT` | Puerto HTTP de Express. | `3000` |
| `CORS_ORIGIN` | Origen permitido cuando frontend y backend se ejecutan separados. | Cualquier origen |
| `ADMIN_EMAIL` | Correo del administrador creado por el seed. | `admin@distritocosmetico.com` |
| `ADMIN_PASSWORD` | Contraseña del administrador creado por el seed. | `Admin123456` |
| `VITE_API_BASE_URL` | Base de la API para un frontend desplegado por separado. | `/api` |

## Datos iniciales

Con MongoDB disponible y `.env` configurado:

```bash
npm run seed
```

El seed es idempotente: crea o actualiza el administrador, las categorías, los productos y las órdenes de demostración a partir de los JSON del frontend. También crea los clientes asociados a esas órdenes.

## Ejecución en desarrollo

```bash
npm run dev
```

Este comando inicia:

- API Express en `http://localhost:3000`;
- SPA Vite en `http://localhost:5173`.

Vite redirige las solicitudes `/api` al backend. Para iniciar únicamente la API:

```bash
npm run dev:api
```

## Build y ejecución integrada

```bash
npm run build
npm start
```

`npm run build` instala las dependencias bloqueadas del frontend, ejecuta Vite y copia el resultado a `public/`. Luego, `npm start` sirve la API, los archivos estáticos y el fallback de Vue Router desde Express en el puerto configurado.

## API REST

Las respuestas exitosas con contenido JSON usan `{ "ok": true }`; las eliminaciones exitosas responden `204` sin cuerpo y los errores usan `{ "ok": false, "error": "..." }`. Las rutas protegidas esperan:

```http
Authorization: Bearer <token>
```

### Autenticación y salud

| Método | Ruta | Acceso | Función |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Público | Verificar que el servicio HTTP responde. |
| `POST` | `/api/auth/register` | Público | Crear una cuenta con rol `cliente`. |
| `POST` | `/api/auth/login` | Público | Validar credenciales y emitir un JWT. |

### Productos y categorías

| Método | Ruta | Acceso | Función |
| --- | --- | --- | --- |
| `GET` | `/api/products` | Público | Listar productos; acepta `categoria` y `search`. |
| `GET` | `/api/products/:id` | Público | Consultar un producto por id numérico o `_id`. |
| `POST` | `/api/products` | Administrador | Crear un producto. |
| `PUT` | `/api/products/:id` | Administrador | Actualizar un producto. |
| `DELETE` | `/api/products/:id` | Administrador | Eliminar un producto. |
| `GET` | `/api/categories` | Público | Listar categorías. |
| `POST` | `/api/categories` | Administrador | Crear una categoría. |
| `PUT` | `/api/categories/:id` | Administrador | Actualizar una categoría y sincronizar sus productos. |
| `DELETE` | `/api/categories/:id` | Administrador | Eliminar una categoría sin productos asociados. |

### Carrito y órdenes

| Método | Ruta | Acceso | Función |
| --- | --- | --- | --- |
| `GET` | `/api/cart` | Autenticado | Obtener o crear el carrito del usuario. |
| `POST` | `/api/cart/items` | Autenticado | Agregar un producto. |
| `PUT` | `/api/cart/items/:productId` | Autenticado | Cambiar una cantidad. |
| `DELETE` | `/api/cart/items/:productId` | Autenticado | Quitar un producto. |
| `DELETE` | `/api/cart` | Autenticado | Vaciar el carrito. |
| `GET` | `/api/orders` | Autenticado | Listar compras propias; un administrador obtiene todas. |
| `GET` | `/api/orders/user/:userId` | Propietario o administrador | Consultar las compras de un usuario. |
| `GET` | `/api/orders/:id` | Propietario o administrador | Obtener el detalle de una orden. |
| `POST` | `/api/orders` | Autenticado | Crear una orden desde el carrito y descontar stock. |
| `PATCH` | `/api/orders/:id/status` | Administrador | Actualizar el estado de una orden. |

### API externa de divisas

| Método | Ruta | Acceso | Función |
| --- | --- | --- | --- |
| `GET` | `/api/currency/convert?amount=1&from=crc&to=usd` | Público | Consultar la tasa externa y convertir el monto. |

El backend consume `@fawazahmed0/currency-api` mediante dos orígenes públicos. Si el principal falla, intenta el alternativo; si ambos fallan, responde `502`. El frontend conserva CRC y muestra un aviso cuando la conversión no está disponible.

## Seguridad y consistencia de datos

- Las contraseñas se almacenan con hash bcrypt.
- El registro público fuerza el rol `cliente` aunque el cuerpo solicite otro rol.
- JWT protege carrito, órdenes y operaciones administrativas.
- El middleware `adminOnly` responde `403` ante permisos insuficientes.
- Mongoose valida campos requeridos, valores mínimos, unicidad y estados permitidos.
- Una categoría con productos asociados no se puede eliminar.
- La creación de órdenes verifica producto, disponibilidad y stock; ante un fallo restaura las existencias ya descontadas.
- El middleware de errores devuelve respuestas JSON uniformes y un `404` para rutas inexistentes.

## Pruebas y calidad

```bash
npm test
npm --prefix distrito-cosmetico-frontend run lint
npm run build
```

Actualmente hay 9 pruebas unitarias del backend. Cubren el rol seguro de registro, identificadores de producto, disponibilidad del carrito, integridad de categorías y validaciones/compensación de stock durante la creación de órdenes. `npm test` también verifica la sintaxis de los puntos de entrada y scripts.

Las pruebas unitarias usan dobles de los modelos y no sustituyen una prueba de integración con una instancia real de MongoDB. La conversión de moneda también requiere acceso a Internet en tiempo de ejecución.

## Roles de la aplicación

- **Invitado:** consulta el catálogo y usa un carrito local.
- **Cliente:** mantiene un carrito en MongoDB, crea órdenes y consulta sus compras.
- **Administrador:** gestiona productos y categorías, consulta todas las órdenes y actualiza su estado.

Health check: `GET /api/health`.
