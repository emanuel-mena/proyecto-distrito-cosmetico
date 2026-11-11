# Handoff: correcciones detectadas por SonarCloud

Estado de partida: rama `main` tras fusionar el PR #2. El pipeline funciona y el Quality Gate del PR pasó porque evalúa solo código nuevo. El análisis de `main` reporta **5 vulnerabilidades, 1 bug y 2 code smells** (Seguridad E, Fiabilidad C). Este documento lista cada uno con archivo, línea, motivo y corrección propuesta, para usarlo como guion de demostración: corregir en una rama, abrir un PR y ver el Quality Gate y las calificaciones mejorar.

Las líneas corresponden a `main` en el commit `62781d1` más el PR #2 (los archivos de `src/` no cambiaron en el PR).

Las correcciones son propuestas: no se aplicaron ni se ejecutaron contra el código. Los hallazgos vienen del análisis de SonarCloud sobre `main` (revisión `af77ba4`).

Orden recomendado: del mayor impacto al menor. Cada punto es independiente y puede ir en su propio commit.

---

## 1. Inyección NoSQL en la creación y actualización de productos (S5147, bloqueante)

**Archivos y líneas**

- [src/controllers/product.controller.js:53](../src/controllers/product.controller.js) `Category.findOne({ nombre: data.categoria, activa: true })` en `create`.
- [src/controllers/product.controller.js:69](../src/controllers/product.controller.js) la misma consulta en `update`.

**Por qué hay que corregirlo**

`data.categoria` viene de `req.body` sin comprobar su tipo. Un cliente puede enviar `"categoria": { "$ne": null }` y la consulta pasa de "categoría con este nombre" a "cualquier categoría activa". Así se evita la validación de categoría y se asocia el producto a una categoría arbitraria. Es la misma clase de ataque que `test/unit/security.test.js` ya cubre en el login, pero aquí no se aplica esa defensa. Las rutas exigen rol administrador, lo que reduce la probabilidad pero no elimina el riesgo (una cuenta de administrador comprometida o un error del frontend).

**Corrección propuesta**

Validar el tipo antes de consultar y forzar igualdad con `$eq`:

```js
if (data.categoria !== undefined) {
  if (typeof data.categoria !== "string")
    return res.status(400).json({ ok: false, error: "Categoría inválida" });
  const category = await Category.findOne({ nombre: { $eq: data.categoria }, activa: true });
  ...
}
```

Aplicar en ambas funciones (idealmente extrayendo una función auxiliar `resolveCategory(nombre)` para no duplicar).

**Cómo comprobarlo**

Prueba nueva en `test/api-tests/`: `POST /api/products` como administrador con `categoria: { "$ne": null }` debe responder `400`. Antes de la corrección responde `201`.

---

## 2. Inyección NoSQL en el listado de productos (S5147, bloqueante)

**Archivo y línea**

- [src/controllers/product.controller.js:24](../src/controllers/product.controller.js) `Product.find(q)`.

**Por qué hay que corregirlo**

`q.categoria` y `q.nombre` se construyen desde `req.query`. El código ya valida `typeof === "string"` y escapa el regex, así que **en la práctica este punto ya está mitigado**: es el hallazgo más cercano a un falso positivo, porque el análisis de Sonar no reconoce esa validación como saneamiento. Aun así conviene corregirlo para dejar la defensa explícita, porque un cambio futuro que quite el `typeof` reabriría la inyección.

**Corrección propuesta**

```js
q.categoria = { $eq: req.query.categoria };
```

o bien `Product.find(q).setOptions({ sanitizeFilter: true })`. Si tras el cambio Sonar sigue marcándolo, es válido marcarlo como *Falso positivo* en la interfaz con un comentario que cite las validaciones de las líneas 15 y 20. Esa es una buena parte de la demostración: no todo hallazgo se corrige en código.

**Cómo comprobarlo**

Agregar una prueba que fije que `GET /api/products?categoria=x` solo devuelve productos de esa categoría. Si se quiere reproducir el ataque, comprobar antes cómo interpreta Express la consulta `categoria[$ne]=x` (el analizador de consultas por defecto no siempre crea objetos), en lugar de asumir el resultado.

---

## 3. Inyección NoSQL en el carrito (S5147, bloqueante)

**Archivo y línea**

- [src/controllers/cart.controller.js:29](../src/controllers/cart.controller.js) `Product.findOne(productQuery(req.body.productId))`.

**Por qué hay que corregirlo**

`productQuery` (líneas 5 a 9) devuelve `{ _id: value }` usando el valor tal como llegó. `mongoose.isValidObjectId` acepta algunos objetos, por lo que `req.body.productId` no está garantizado como cadena. Un cliente autenticado cualquiera (no solo administrador) controla esta entrada, así que es el punto de mayor exposición de los tres.

**Corrección propuesta**

Normalizar la entrada en `productQuery` (y en `identifierQuery` de `product.controller.js:5`, que tiene el mismo patrón):

```js
const productQuery = (value) => {
  const text = typeof value === "string" || typeof value === "number" ? String(value) : "";
  if (/^\d+$/.test(text)) return { id: Number(text) };
  if (mongoose.isValidObjectId(text)) return { _id: text };
  return { _id: null };
};
```

**Cómo comprobarlo**

`POST /api/cart/items` con `productId: { "$ne": null }` debe responder `404` y no agregar ningún producto al carrito. Es posible que el código actual ya responda así, porque un objeto probablemente no pasa `isValidObjectId`; en ese caso la prueba solo fija el comportamiento y el hallazgo puede ser en parte un falso positivo. Conviene reproducirlo antes de decidir.

---

## 4. Asignación masiva al crear productos (S4684, crítica)

**Archivo y línea**

- [src/controllers/product.controller.js:58](../src/controllers/product.controller.js) `Product.create(data)`, donde `data` nace de `{ ...req.body }` en las líneas 46 a 51.

**Por qué hay que corregirlo**

El cuerpo completo de la solicitud se vuelca al modelo. El cliente puede fijar campos que debería calcular el servidor, como `categoriaRef`, `id` (línea 49 lo acepta directamente) o `_id`, y cualquier campo que se añada al esquema en el futuro queda expuesto automáticamente. El mismo patrón aparece en `update` ([línea 67](../src/controllers/product.controller.js) `{ ...req.body }` pasado a `findOneAndUpdate` en las líneas 74 a 78), donde se podría reescribir `categoriaRef` o `_id`.

**Corrección propuesta**

Lista blanca de campos según el modelo (`src/models/Product.js`):

```js
const FIELDS = ["nombre", "categoria", "precio", "descripcion", "imagen",
                "disponible", "seccion", "promocion", "stock"];
const pick = (body) =>
  Object.fromEntries(FIELDS.filter((k) => k in body).map((k) => [k, body[k]]));
```

Usar `pick(req.body)` en `create` y `update`. El `id` numérico solo se genera en el servidor, salvo que se decida lo contrario.

**Cómo comprobarlo**

`POST /api/products` como administrador con `categoriaRef` o `_id` arbitrarios: el producto creado no debe reflejarlos. Verificar que las pruebas 11 y 12 de la suite siguen pasando.

---

## 5. Promesa sin manejar al arrancar el servidor (S9383, bug)

**Archivo y línea**

- [src/server.js:68](../src/server.js) `if (require.main === module) start();`

**Por qué hay que corregirlo**

`start()` es asíncrona (conecta a MongoDB). Si `connectDB()` falla, por ejemplo con una URI incorrecta, la promesa se rechaza sin `.catch`. Node termina el proceso con un `UnhandledPromiseRejection` y un mensaje poco claro, y el contenedor o el orquestador no recibe un código de salida controlado.

**Corrección propuesta**

```js
if (require.main === module) {
  start().catch((err) => {
    console.error("No se pudo iniciar el servidor:", err.message);
    process.exit(1);
  });
}
```

**Cómo comprobarlo**

Ejecutar `npm start` con `MONGODB_URI` inválida: debe mostrar el mensaje y salir con código 1.

---

## 6. Expresión regular con backtracking en el registro (S8786, code smell)

**Archivo y línea**

- [src/controllers/auth.controller.js:9](../src/controllers/auth.controller.js) `/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)`.

**Por qué hay que corregirlo**

Con una cadena larga sin `@` o sin punto final, el motor prueba muchas combinaciones y el tiempo crece más que linealmente (ReDoS). El riesgo está acotado porque la línea ya limita `correo.length > 254`, pero la validación de longitud se evalúa **después** del regex en el orden de la condición. Reordenar o simplificar elimina la dependencia de ese orden.

**Corrección propuesta**

Comprobar la longitud primero y usar una expresión sin solapamiento, por ejemplo `/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/`, o delegar en una validación de formato más simple (existe un `@`, un punto en el dominio).

**Cómo comprobarlo**

Prueba 03 (correo inválido, `400`) y 01 (registro válido, `201`) deben seguir pasando; añadir un caso con un correo de 254 caracteres sin `@` y comprobar que responde `400` rápidamente.

---

## 7. Archivo de pruebas sin llamadas a `test()` (S2187, bloqueante, probable falso positivo)

**Archivo**

- [test/api-tests/tests/api.test.mjs](../test/api-tests/tests/api.test.mjs) (Sonar no reporta línea).

**Por qué aparece**

El archivo define el ciclo de vida (`beforeAll`, `afterAll`) y registra los casos llamando a `registerAuthTests()`, `registerProductTests()` y las otras tres funciones, que sí contienen los `test()`. La regla busca llamadas directas y no las ve.

**Qué hacer**

No hay que cambiar el código. Marcarlo como **Falso positivo** en SonarCloud con el comentario "los casos se registran desde `test/api-tests/tests/*/*.cases.mjs`". Alternativa: excluir ese archivo de la regla con `sonar.issue.ignore.multicriteria` en `sonar-project.properties`.

---

## Flujo sugerido para la demostración

1. Mostrar el dashboard de `main`: Seguridad E, Fiabilidad C, 5 vulnerabilidades.
2. Crear la rama `fix/sonar-hallazgos` y aplicar los puntos 1 a 6 con un commit por punto.
3. Agregar las pruebas indicadas en "Cómo comprobarlo" (puntos 1, 3 y 4) y ejecutar `npm test` y `npm run test:api`.
4. Abrir el PR y observar el pipeline: pruebas aprobadas, Quality Gate aprobado, comentario de SonarCloud.
5. Fusionar y mostrar que, tras el `push` a `main`, las calificaciones de seguridad y fiabilidad suben y las vulnerabilidades bajan a 0 (o a 1 si se decide dejar el punto 2 como falso positivo).
6. Cerrar con el punto 7: explicar por qué un hallazgo se marca como falso positivo y no se "arregla".

## Qué debe quedar al final

| Métrica | Antes (`main`) | Esperado |
| --- | --- | --- |
| Vulnerabilidades | 5 | 0 |
| Bugs | 1 | 0 |
| Code smells | 2 | 0 (con el punto 7 marcado como falso positivo) |
| Seguridad | E | A |
| Fiabilidad | C | A |

Los valores esperados dependen de que Sonar reconozca las correcciones; si algún hallazgo persiste tras el cambio, revisar su detalle en la interfaz antes de asumir que el código sigue mal.
