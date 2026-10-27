# Pruebas funcionales de API

Esta suite implementa los 30 casos de la consigna con Vitest y Axios. Ejecuta solicitudes HTTP reales contra la aplicación Express y una base MongoDB de prueba. No sustituye las pruebas unitarias existentes en `test/unit/`.

## Arquitectura

| Capa | Archivo | Responsabilidad |
| --- | --- | --- |
| Ejecución y reportes | `vitest.config.mjs` | Descubrimiento de casos, tiempos límite y reporte JUnit. |
| Cliente HTTP | `client.mjs` | URL base, autenticación, timeout y conservación de respuestas 4xx/5xx. |
| Datos | `data.mjs` | Usuarios, categoría, productos y órdenes de prueba; restablece el estado antes de cada caso. |
| Ejecución de pruebas | `api.test.mjs` | Inicia la API y la base temporal, restablece los datos e invoca los cinco grupos de casos. |
| Contexto compartido | `context.mjs` | Cliente HTTP, datos del caso y funciones auxiliares. |
| Casos | `auth.cases.mjs`, `products.cases.mjs`, `categories.cases.mjs`, `cart.cases.mjs`, `orders.cases.mjs` | Los 30 escenarios numerados, organizados por área. |

La suite lee `MONGODB_URI` del entorno o de `.env`, pero se conecta con un **nombre de base único** (`api_test_...`). Al finalizar, elimina esa base. Se niega a ejecutar si falta la URI y solo elimina una base cuyo nombre coincide con el creado por la propia ejecución. El servidor Express se inicia en un puerto libre. No se ejecuta el seed de la aplicación.

## Ejecución

Desde la raíz del repositorio:

```powershell
npm ci
npm run test:api
```

Se requiere Node.js 20.19 o superior y acceso a una instancia MongoDB mediante `MONGODB_URI`. La base configurada en la URI no se usa para las pruebas; la misma conexión sirve para crear la base temporal. El resultado detallado aparece en terminal y en `reports/api/junit.xml` (archivo local ignorado por Git). Para volver a ejecutar solo un caso, use por ejemplo:

```powershell
npx vitest run --config test/api-tests/vitest.config.mjs -t '23 crea una orden'
```

## Estrategia y cobertura

- Se comprueban **17 combinaciones de método y ruta** en cinco áreas: autenticación (6), productos (6), categorías (4), carrito (6) y órdenes (8).
- Los casos positivos validan el contrato HTTP y, donde importa, el cambio de estado. Los negativos comprueban validación de datos, recursos inexistentes, disponibilidad, stock, autenticación y autorización.
- Cada caso recibe datos nuevos. Los escenarios que crean, actualizan o eliminan recursos no dependen de la ejecución de otro caso.
- Se comprueban tanto `status` como `body`. En los escenarios de denegación se verifica además que no haya cambios no autorizados.
- Axios usa `validateStatus: () => true` para que las respuestas 4xx/5xx lleguen a las assertions en vez de convertirse en excepciones del cliente.

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
3. Para demostrar cómo se muestra un fallo, cambiar temporalmente la expectativa de estado del caso 10 de `404` a `200`, ejecutar el caso aislado y mostrar la diferencia entre esperado y real. Restaurar `404` y ejecutar de nuevo. **No entregar la suite con esa modificación.**

El reporte de cobertura de código no se usa como medida de cumplimiento: esta es una suite funcional por HTTP y el requisito se mide por endpoints y casos verificados.
