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

Copie `.env.example` como `.env` y configure un `JWT_SECRET` aleatorio de al menos 32 caracteres. Para ejecutar el seed, configure también `ADMIN_PASSWORD` con al menos 12 caracteres.

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017/distrito-cosmetico
JWT_SECRET=
PORT=3000
CORS_ORIGIN=http://localhost:5173
ADMIN_EMAIL=admin@distritocosmetico.com
ADMIN_PASSWORD=
```

Variables disponibles:

| Variable | Uso | Valor predeterminado |
| --- | --- | --- |
| `MONGODB_URI` | Conexión a MongoDB. | Sin valor seguro; debe configurarse. |
| `JWT_SECRET` | Firma y verificación de sesiones JWT; obligatorio y de al menos 32 caracteres. | Ninguno. |
| `PORT` | Puerto HTTP de Express. | `3000` |
| `CORS_ORIGIN` | Orígenes permitidos, separados por comas, cuando frontend y backend se ejecutan separados. | Ninguno; la SPA integrada usa el mismo origen. |
| `ADMIN_EMAIL` | Correo del administrador creado por el seed. | `admin@distritocosmetico.com` |
| `ADMIN_PASSWORD` | Contraseña del administrador creado por el seed; mínimo 12 caracteres. | Ninguno. |
| `VITE_API_BASE_URL` | Base de la API para un frontend desplegado por separado. | `/api` |

## Datos iniciales

Con MongoDB disponible y `.env` configurado:

```bash
npm run seed
```

El seed es idempotente: crea o actualiza el administrador, las categorías, los productos y las órdenes de demostración a partir de los JSON del frontend. También crea los clientes asociados a esas órdenes con contraseñas aleatorias no divulgadas.

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
- El inicio de sesión y el registro tienen un límite de intentos por dirección IP; las solicitudes JSON están limitadas a 32 KB.
- La búsqueda escapa caracteres de expresiones regulares y limita la longitud de los filtros.
- CORS solo permite los orígenes configurados, y los errores internos no se devuelven al cliente.
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

Las pruebas del backend cubren el rol seguro de registro, identificadores de producto, disponibilidad del carrito, integridad de categorías, validaciones/compensación de stock durante la creación de órdenes y controles de seguridad HTTP. `npm test` también verifica la sintaxis de los puntos de entrada y scripts.

Las pruebas unitarias usan dobles de los modelos y no sustituyen una prueba de integración con una instancia real de MongoDB. La conversión de moneda también requiere acceso a Internet en tiempo de ejecución.

### Prueba integral con JMeter

Con `.env` configurado, Java 21 y Apache JMeter 5.6.3 instalado en `../apache-jmeter-5.6.3/apache-jmeter-5.6.3` (o indicando `JMETER_HOME`), ejecute:

```bash
npm run test:jmeter
```

El ejecutor crea una base MongoDB temporal con nombre único, ejecuta el seed, inicia la API en un puerto libre y corre `jmeter/distrito-cosmetico.jmx`. El plan verifica las 23 rutas mediante 26 pasos funcionales y dos rechazos esperados: HTTP `400` para un producto con stock cero y HTTP `409` para uno no disponible. JMeter los considera correctos solo si coinciden el código y el mensaje. Luego aplica 10 usuarios durante 60 segundos a cuatro rutas de lectura, con un máximo de 5 solicitudes por segundo. Las credenciales se leen del entorno y no se guardan en el plan.

Los resultados se guardan en `reports/jmeter/<identificador>/`: `results.jtl`, `dashboard/index.html`, `analysis.md` y registros de preparación. La base temporal se elimina al terminar; si la eliminación falla, `analysis.md` indica el nombre exacto para revisión. Para regenerar el plan después de editar su generador, use `npm run jmeter:generate`.
Si hay varias versiones de Java instaladas, configure `JMETER_JAVA_HOME` con la ruta del JDK 21; en Windows el ejecutor detecta `C:\Program Files\Java\jdk-21`.

Para ajustar el plan desde la interfaz de JMeter, abra `jmeter/distrito-cosmetico.jmx` y edite **Test Plan → User Defined Variables**. Allí están el host y puerto, las credenciales (tomadas del entorno por defecto), los IDs de productos del seed, los datos de pedido y la carga (`loadThreads`, `loadRampSeconds`, `loadDurationSeconds`, `targetRequestsPerMinute`). `npm run test:jmeter` usa esos valores del archivo; `npm run jmeter:generate` reconstruye el `.jmx` y restablece sus valores predeterminados.

### Caso de estudio de rendimiento: cinco servicios

El plan independiente [`jmeter/distrito-cosmetico-rendimiento.jmx`](jmeter/distrito-cosmetico-rendimiento.jmx) mide cinco servicios que cubren autenticación (`POST /api/auth/login`), categorías (`GET /api/categories`), búsqueda de productos (`GET /api/products?search`), carrito (`GET /api/cart`) y pedidos (`GET /api/orders`). El login ocurre una vez por usuario virtual para respetar el límite de 20 intentos cada 15 minutos. Las otras cuatro solicitudes se repiten durante la carga. Se extraen el token, ID del usuario, cantidades de categorías, productos, ítems del carrito y pedidos de las respuestas JSON. El plan valida HTTP 200 y `ok: true`.

En **Test Plan → User Defined Variables** se configuran `apiProtocol`, `apiHost`, `apiPort`, `csvFile`, `loadThreads`, `loadRampSeconds`, `loadDurationSeconds` y `targetRequestsPerMinute`. El ejecutor aislado admite entre 1 y 20 hilos por el límite de login de la API. Los insumos por usuario (`correo,password,searchTerm`) se leen mediante **CSV Data Set Config**. Para ejecución manual, cree una copia persistente e ignorada por Git de la plantilla [`jmeter/rendimiento-insumos.csv`](jmeter/rendimiento-insumos.csv):

```powershell
npm run jmeter:rendimiento:csv
```

El comando deja `jmeter/rendimiento-insumos.local.csv` y conserva su contenido si ya existe. Reemplace las credenciales de ejemplo por credenciales válidas; para varios hilos use cuentas distintas, pues compartir una cuenta puede causar conflictos al crear el carrito. El plan usa ese archivo por defecto. `csvFile` acepta un archivo alternativo con `-JcsvFile=ruta/insumos.csv`. Los parámetros de host, puerto y CSV se pueden sobrescribir con `-Jhost`, `-Jport`, `-Jprotocol` y `-JcsvFile`. Regenerar el plan restablece las variables predeterminadas:

```powershell
npm run jmeter:rendimiento:generate
```

Para ejecutar el caso de estudio de forma aislada, configure `.env` como en la prueba integral y ejecute:

```powershell
npm run test:jmeter:rendimiento
```

El ejecutor crea una base temporal, carga el seed, crea clientes de prueba y un CSV temporal con sus credenciales, inicia la API y genera `results.jtl`, `dashboard/index.html` y `analysis.md` en `reports/jmeter/rendimiento_<identificador>/`. El CSV temporal se elimina al terminar; la base temporal también se elimina. No modifica el CSV local persistente. El reporte incluye muestras, errores, p50, p95, p99 y solicitudes por segundo por servicio, más conclusiones basadas en los resultados. La consigna no establece umbrales de aceptación; compárelos con los objetivos definidos para el proyecto.

El generador copia la plantilla [`scripts/templates/distrito-cosmetico-rendimiento.jmx`](scripts/templates/distrito-cosmetico-rendimiento.jmx), guardada con el formato nativo de JMeter. Así, regenerar el plan no produce diferencias de formato al abrirlo y guardarlo en JMeter. Si se hacen cambios permanentes en la interfaz, actualice también esa plantilla antes de volver a regenerar.

## Roles de la aplicación

- **Invitado:** consulta el catálogo y usa un carrito local.
- **Cliente:** mantiene un carrito en MongoDB, crea órdenes y consulta sus compras.
- **Administrador:** gestiona productos y categorías, consulta todas las órdenes y actualiza su estado.

Health check: `GET /api/health`.
