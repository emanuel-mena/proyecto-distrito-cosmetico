import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import mongoose from "mongoose";
import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";
import dotenv from "dotenv";
import { createApi } from "./client.mjs";
import {
  resetData,
  password,
  Cart,
  Product,
  Category,
  Order,
} from "./data.mjs";

process.env.JWT_SECRET = "api-test-secret-with-at-least-thirty-two-characters";
const require = createRequire(import.meta.url);
const sign = require("../src/utils/jwt");

let server, api, as, data, testDbName;
const token = (user) => sign(user);
const errorIs = (response, status, message) => {
  expect(response.status).toBe(status);
  expect(response.data).toMatchObject({ ok: false, error: message });
};
const orderBody = { telefono: "88889999", direccion: "Cartago" };
const addAvailable = () =>
  as(token(data.clientA)).post("/api/cart/items", {
    productId: data.available.id,
    cantidad: 2,
  });

beforeAll(async () => {
  dotenv.config();
  if (!process.env.MONGODB_URI)
    throw new Error("Configure MONGODB_URI para ejecutar la suite API");
  // MongoDB receives a unique database name. The configured application's database is untouched.
  testDbName = `api_test_${randomUUID().replaceAll("-", "").slice(0, 24)}`;
  await mongoose.connect(process.env.MONGODB_URI, { dbName: testDbName });
  const { app } = require("../src/server");
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  ({ api, as } = createApi(`http://127.0.0.1:${server.address().port}`));
});

beforeEach(async () => {
  data = await resetData();
});

afterAll(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (testDbName && mongoose.connection.db?.databaseName === testDbName)
    await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe("Autenticación", () => {
  it("01 registra un cliente con datos válidos", async () => {
    const r = await api.post("/api/auth/register", {
      nombre: "Nuevo",
      correo: "nuevo@test.local",
      password,
    });
    expect(r.status).toBe(201);
    expect(r.data).toMatchObject({
      ok: true,
      user: { nombre: "Nuevo", correo: "nuevo@test.local", rol: "cliente" },
    });
    expect(r.data.token).toEqual(expect.any(String));
  });
  it("02 impide asignar rol administrador desde el registro público", async () => {
    const r = await api.post("/api/auth/register", {
      nombre: "Nuevo",
      correo: "nuevo@test.local",
      password,
      rol: "admin",
    });
    expect(r.status).toBe(201);
    expect(r.data).toMatchObject({ ok: true, user: { rol: "cliente" } });
  });
  it("03 rechaza un correo de registro inválido", async () => {
    errorIs(
      await api.post("/api/auth/register", {
        nombre: "Nuevo",
        correo: "invalido",
        password,
      }),
      400,
      "Datos de registro inválidos",
    );
  });
  it("04 rechaza un correo duplicado", async () => {
    errorIs(
      await api.post("/api/auth/register", {
        nombre: "Otro",
        correo: data.clientA.correo,
        password,
      }),
      409,
      "El correo ya está registrado",
    );
  });
  it("05 inicia sesión con credenciales correctas", async () => {
    const r = await api.post("/api/auth/login", {
      correo: data.clientA.correo,
      password,
    });
    expect(r.status).toBe(200);
    expect(r.data).toMatchObject({
      ok: true,
      user: { correo: data.clientA.correo, rol: "cliente" },
    });
    expect(r.data.token).toEqual(expect.any(String));
  });
  it("06 rechaza una contraseña incorrecta", async () => {
    errorIs(
      await api.post("/api/auth/login", {
        correo: data.clientA.correo,
        password: "incorrecta",
      }),
      401,
      "Correo o contraseña incorrectos",
    );
  });
});

describe("Productos", () => {
  it("07 lista los productos", async () => {
    const r = await api.get("/api/products");
    expect(r.status).toBe(200);
    expect(r.data.ok).toBe(true);
    expect(r.data.data.map((p) => p.id)).toContain(101);
  });
  it("08 filtra productos por categoría", async () => {
    const r = await api.get("/api/products", {
      params: { categoria: data.category.nombre },
    });
    expect(r.status).toBe(200);
    expect(r.data.ok).toBe(true);
    expect(r.data.data.length).toBeGreaterThan(0);
    expect(r.data.data.every((p) => p.categoria === data.category.nombre)).toBe(
      true,
    );
  });
  it("09 obtiene un producto existente", async () => {
    const r = await api.get("/api/products/101");
    expect(r.status).toBe(200);
    expect(r.data).toMatchObject({
      ok: true,
      data: { id: 101, nombre: "Serum API" },
    });
  });
  it("10 devuelve 404 por un producto inexistente", async () => {
    errorIs(
      await api.get("/api/products/999999"),
      404,
      "Producto no encontrado",
    );
  });
  it("11 permite al administrador crear un producto", async () => {
    const r = await as(token(data.admin)).post("/api/products", {
      nombre: "Tónico API",
      categoria: data.category.nombre,
      precio: 1500,
      stock: 4,
      disponible: true,
    });
    expect(r.status).toBe(201);
    expect(r.data).toMatchObject({
      ok: true,
      data: {
        nombre: "Tónico API",
        precio: 1500,
        categoria: data.category.nombre,
      },
    });
  });
  it("12 impide a un cliente crear productos", async () => {
    const r = await as(token(data.clientA)).post("/api/products", {
      nombre: "Prohibido API",
      categoria: data.category.nombre,
      precio: 100,
    });
    errorIs(r, 403, "Permisos insuficientes");
    expect(await Product.exists({ nombre: "Prohibido API" })).toBeNull();
  });
});

describe("Categorías", () => {
  it("13 lista las categorías", async () => {
    const r = await api.get("/api/categories");
    expect(r.status).toBe(200);
    expect(r.data.ok).toBe(true);
    expect(r.data.data.map((c) => c.nombre)).toContain(data.category.nombre);
  });
  it("14 crea una categoría y genera su slug", async () => {
    const r = await as(token(data.admin)).post("/api/categories", {
      nombre: "Protección Solar",
    });
    expect(r.status).toBe(201);
    expect(r.data).toMatchObject({
      ok: true,
      data: { nombre: "Protección Solar", slug: "proteccion-solar" },
    });
  });
  it("15 rechaza una categoría sin nombre", async () => {
    errorIs(
      await as(token(data.admin)).post("/api/categories", {}),
      400,
      "nombre es requerido",
    );
  });
  it("16 impide eliminar una categoría con productos", async () => {
    errorIs(
      await as(token(data.admin)).delete(`/api/categories/${data.category.id}`),
      409,
      "No se puede eliminar una categoría que tiene productos",
    );
    expect(await Category.exists({ _id: data.category._id })).toBeTruthy();
  });
});

describe("Carrito", () => {
  it("17 exige token para consultar el carrito", async () => {
    errorIs(await api.get("/api/cart"), 401, "Token requerido");
  });
  it("18 agrega dos unidades de un producto disponible", async () => {
    const r = await addAvailable();
    expect(r.status).toBe(201);
    expect(r.data).toMatchObject({
      ok: true,
      data: { items: [{ cantidad: 2 }] },
    });
    expect(r.data.data.items[0].producto.id).toBe(101);
  });
  it("19 rechaza un producto no disponible", async () => {
    errorIs(
      await as(token(data.clientA)).post("/api/cart/items", {
        productId: 102,
        cantidad: 1,
      }),
      409,
      "El producto no está disponible",
    );
  });
  it("20 rechaza una cantidad superior al stock", async () => {
    errorIs(
      await as(token(data.clientA)).post("/api/cart/items", {
        productId: 101,
        cantidad: 6,
      }),
      400,
      "Cantidad no disponible",
    );
  });
  it("21 actualiza la cantidad de un producto", async () => {
    expect((await addAvailable()).status).toBe(201);
    const r = await as(token(data.clientA)).put("/api/cart/items/101", {
      cantidad: 3,
    });
    expect(r.status).toBe(201); // Current endpoint delegates to the add handler.
    expect(r.data).toMatchObject({
      ok: true,
      data: { items: [{ cantidad: 3 }] },
    });
  });
  it("22 quita un producto del carrito", async () => {
    expect((await addAvailable()).status).toBe(201);
    const r = await as(token(data.clientA)).delete("/api/cart/items/101");
    expect(r.status).toBe(200);
    expect(r.data).toMatchObject({ ok: true, data: { items: [] } });
  });
});

describe("Órdenes", () => {
  it("23 crea una orden, vacía el carrito y descuenta stock", async () => {
    expect((await addAvailable()).status).toBe(201);
    const r = await as(token(data.clientA)).post("/api/orders", orderBody);
    expect(r.status).toBe(201);
    expect(r.data).toMatchObject({
      ok: true,
      data: {
        estado: "Pendiente",
        total: 5000,
        productos: [{ nombre: "Serum API", cantidad: 2, precio: 2500 }],
      },
    });
    expect(
      (await Cart.findOne({ usuario: data.clientA._id })).items,
    ).toHaveLength(0);
    expect((await Product.findById(data.available._id)).stock).toBe(3);
  });
  it("24 rechaza una orden con carrito vacío", async () => {
    errorIs(
      await as(token(data.clientA)).post("/api/orders", orderBody),
      400,
      "El carrito está vacío",
    );
  });
  it("25 exige dirección para crear una orden", async () => {
    expect((await addAvailable()).status).toBe(201);
    errorIs(
      await as(token(data.clientA)).post("/api/orders", {
        telefono: "88889999",
      }),
      400,
      "telefono y direccion son requeridos",
    );
  });
  it("26 limita el listado de órdenes a las del cliente", async () => {
    const r = await as(token(data.clientA)).get("/api/orders");
    expect(r.status).toBe(200);
    expect(r.data.ok).toBe(true);
    expect(r.data.data.map((o) => o.numero)).toContain("TEST-A");
    expect(r.data.data.map((o) => o.numero)).not.toContain("TEST-B");
  });
  it("27 impide consultar el historial de otro cliente", async () => {
    errorIs(
      await as(token(data.clientA)).get(`/api/orders/user/${data.clientB.id}`),
      403,
      "Permisos insuficientes",
    );
  });
  it("28 impide consultar el detalle de una orden ajena", async () => {
    errorIs(
      await as(token(data.clientA)).get(`/api/orders/${data.orderB.id}`),
      403,
      "Permisos insuficientes",
    );
  });
  it("29 impide a un cliente cambiar el estado de una orden", async () => {
    errorIs(
      await as(token(data.clientA)).patch(
        `/api/orders/${data.orderA.id}/status`,
        { estado: "En camino" },
      ),
      403,
      "Permisos insuficientes",
    );
    expect((await Order.findById(data.orderA._id)).estado).toBe("Pendiente");
  });
  it("30 permite al administrador cambiar el estado de una orden", async () => {
    const r = await as(token(data.admin)).patch(
      `/api/orders/${data.orderA.id}/status`,
      { estado: "En camino" },
    );
    expect(r.status).toBe(200);
    expect(r.data).toMatchObject({ ok: true, data: { estado: "En camino" } });
  });
});
