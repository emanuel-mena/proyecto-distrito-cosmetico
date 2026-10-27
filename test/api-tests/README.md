# Pruebas funcionales de API

Esta suite implementa los 30 casos de la consigna con Vitest y Axios. Ejecuta solicitudes HTTP reales contra la aplicación Express y una base MongoDB de prueba. No sustituye las pruebas unitarias existentes en `test/unit/`.

## Estructura

```
test/
├── api-tests/
│   ├── clients/
│   │   └── client.mjs
│   ├── tests/
│   │   ├── auth/
│   │   │   └── auth.cases.mjs
│   │   ├── products/
│   │   │   └── products.cases.mjs
│   │   ├── categories/
│   │   │   └── categories.cases.mjs
│   │   ├── cart/
│   │   │   └── cart.cases.mjs
│   │   ├── orders/
│   │   │   └── orders.cases.mjs
│   │   └── api.test.mjs
│   ├── utils/
│   │   └── context.mjs
│   └── README.md
├── config/
│   └── vitest.config.mjs
├── data/
│   └── data.mjs
├── jmeter/
└── unit/
```

## Arquitectura

| Capa | Archivo | Responsabilidad |
| --- | --- | --- |
| Configuración | `test/config/vitest.config.mjs` | Descubrimiento de casos, tiempos límite y reporte JUnit. |
| Cliente HTTP | `test/api-tests/clients/client.mjs` | URL base, autenticación, timeout y conservación de respuestas 4xx/5xx. |
| Datos | `test/data/data.mjs` | Usuarios, categoría, productos y órdenes de prueba; restablece el estado antes de cada caso. |
| Utilidades | `test/api-tests/utils/context.mjs` | Cliente HTTP, datos del caso y funciones auxiliares compartidas. |
| Ejecución de pruebas | `test/api-tests/tests/api.test.mjs` | Según el modo, usa el backend externo o inicia la API con una base temporal; restablece los datos e invoca los cinco grupos de casos. |
| Casos | `test/api-tests/tests/<área>/<área>.cases.mjs` | Los 30 escenarios numerados, un archivo por área: `auth`, `products`, `categories`, `cart` y `orders`. |

## Modos de ejecución

La suite funciona de dos maneras, según exista o no la variable `API_BASE_URL`:

| Modo | Cuándo se activa | Qué hace |
| --- | --- | --- |
| **Externo** | `API_BASE_URL` definida (por ejemplo `http://localhost:3000`) | Llama al backend ya levantado. Si el backend está caído, los casos fallan por no poder conectarse. Usa la base de `MONGODB_URI`. |
| **Autónomo** | `API_BASE_URL` ausente | Inicia la aplicación Express en un puerto libre y usa una base temporal (`api_test_...`), que elimina al terminar. |

En modo externo, la suite borra y recrea usuarios, categorías, productos, órdenes y carritos antes de cada caso. Por eso se niega a ejecutar si el nombre de la base de `MONGODB_URI` no contiene `test`, y el backend debe usar esa misma base. En ambos modos se requiere `MONGODB_URI`, y no se ejecuta el seed de la aplicación.

## Ejecución

Desde la raíz del repositorio, una sola vez:

```powershell
npm ci
```

Variables del archivo `.env`:

| Variable | Descripción |
| --- | --- |
| `MONGODB_URI` | Conexión a MongoDB. En modo externo, el nombre de la base debe contener `test` (por ejemplo `.../distrito-cosmetico-test?...`). |
| `JWT_SECRET` | Al menos 32 caracteres. Debe ser el mismo para el backend y las pruebas. |
| `API_BASE_URL` | Opcional. Si existe, activa el modo externo (`http://localhost:3000`). |

Modo externo, con dos terminales:

```powershell
# Terminal 1
npm run dev:api

# Terminal 2
npm run test:api
```

Con el backend activo deben pasar los 30 casos; si el backend se detiene, los casos fallan por no poder conectarse. Para el modo autónomo, elimine `API_BASE_URL` del `.env` y ejecute solo `npm run test:api`.

Se requiere Node.js 20.19 o superior y acceso a una instancia MongoDB. El resultado detallado aparece en terminal y en `reports/api/junit.xml` (archivo local ignorado por Git). Para volver a ejecutar solo un caso, use su número:

```powershell
npx vitest run --config test/config/vitest.config.mjs -t "23"
```

## Estrategia y cobertura

- Se comprueban **17 combinaciones de método y ruta** en cinco áreas: autenticación (6), productos (6), categorías (4), carrito (6) y órdenes (8).
- Los casos positivos validan el contrato HTTP y, donde importa, el cambio de estado. Los negativos comprueban validación de datos, recursos inexistentes, disponibilidad, stock, autenticación y autorización.
- Cada caso recibe datos nuevos. Los escenarios que crean, actualizan o eliminan recursos no dependen de la ejecución de otro caso.
- Se comprueban tanto `status` como `body`. En los escenarios de denegación se verifica además que no haya cambios no autorizados.
- Axios usa `validateStatus: () => true` para que las respuestas 4xx/5xx lleguen a las assertions en vez de convertirse en excepciones del cliente.
- Cada caso se identifica con su número y se rotula como **Positiva** o **Negativa**; todos los casos incluyen en el nombre el código HTTP esperado, de modo que la salida de la terminal ya indica qué se valida.

## Inventario de casos

| ID | Área | Escenario | HTTP esperado |
| --- | --- | --- | --- |
| 01 | Autenticación | Registro válido | 201 |
| 02 | Autenticación | Registro público no concede rol admin | 201 |
| 03 | Autenticación | Correo inválido | 400 |
| 04 | Autenticación | Correo duplicado | 409 |
| 05 | Autenticación | Login válido | 200 |
| 06 | Autenticación | Contraseña incorrecta | 401 |
| 07 | Productos | Listar | 200 |
| 08 | Productos | Filtrar por categoría | 200 |
| 09 | Productos | Obtener por ID | 200 |
| 10 | Productos | ID inexistente | 404 |
| 11 | Productos | Crear como admin | 201 |
| 12 | Productos | Crear como cliente | 403 |
| 13 | Categorías | Listar | 200 |
| 14 | Categorías | Crear y generar slug | 201 |
| 15 | Categorías | Falta nombre | 400 |
| 16 | Categorías | Eliminar categoría con productos | 409 |
| 17 | Carrito | Consultar sin token | 401 |
| 18 | Carrito | Agregar producto | 201 |
| 19 | Carrito | Producto no disponible | 409 |
| 20 | Carrito | Cantidad superior al stock | 400 |
| 21 | Carrito | Cambiar cantidad | 201 |
| 22 | Carrito | Quitar producto | 200 |
| 23 | Órdenes | Crear, vaciar carrito y descontar stock | 201 |
| 24 | Órdenes | Carrito vacío | 400 |
| 25 | Órdenes | Falta dirección | 400 |
| 26 | Órdenes | Listar solo las propias | 200 |
| 27 | Órdenes | Consultar historial ajeno | 403 |
| 28 | Órdenes | Consultar detalle ajeno | 403 |
| 29 | Órdenes | Cliente intenta cambiar estado | 403 |
| 30 | Órdenes | Admin cambia estado | 200 |

El caso 21 comprueba `201` porque el endpoint `PUT` actual reutiliza el controlador de `POST`. Es una característica observada del contrato vigente; puede revisarse si se decide uniformar las respuestas REST.

## Demostración

1. Ejecutar `npm run test:api` y mostrar el resumen de 30 casos aprobados y el reporte JUnit.
2. Abrir un caso positivo (23) y uno negativo (27) para explicar sus assertions.
3. Para demostrar cómo se muestra un fallo, cambiar temporalmente la expectativa de estado del caso 10 de `404` a `200`, ejecutarlo de forma aislada y mostrar la diferencia entre esperado y real. Restaurar `404` y ejecutar de nuevo. **No entregar la suite con esa modificación.**

   ```powershell
   npx vitest run --config test/config/vitest.config.mjs -t "10"
   ```

4. Detener el backend (`Ctrl + C` en la Terminal 1) y ejecutar de nuevo `npm run test:api`: todos los casos fallan por no poder conectarse al servidor.

El reporte de cobertura de código no se usa como medida de cumplimiento: esta es una suite funcional por HTTP y el requisito se mide por endpoints y casos verificados.