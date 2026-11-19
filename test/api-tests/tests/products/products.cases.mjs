import { describe, expect, it } from "vitest";
import { Product } from "../../../data/data.mjs";
import { api, as, token, errorIs, getData } from "../../utils/context.mjs";

export function registerProductTests() {
  describe("Productos", () => {
    it("07 Positiva: lista los productos (200)", async () => {
      const r = await api.get("/api/products");
      expect(r.status).toBe(200);
      expect(r.data.ok).toBe(true);
      expect(r.data.data.map((p) => p.id)).toContain(101);
    });
    it("08 Positiva: filtra productos por categoría (200)", async () => {
      const r = await api.get("/api/products", {
        params: { categoria: getData().category.nombre },
      });
      expect(r.status).toBe(200);
      expect(r.data.ok).toBe(true);
      expect(r.data.data.length).toBeGreaterThan(0);
      expect(r.data.data.every((p) => p.categoria === getData().category.nombre)).toBe(
        true,
      );
    });
    it("09 Positiva: obtiene un producto existente (200)", async () => {
      const r = await api.get("/api/products/101");
      expect(r.status).toBe(200);
      expect(r.data).toMatchObject({
        ok: true,
        data: { id: 101, nombre: "Serum API" },
      });
    });
    it("10 Negativa: producto inexistente devuelve 404", async () => {
      errorIs(
        await api.get("/api/products/999999"),
        404,
        "Producto no encontrado",
      );
    });
    it("11 Positiva: el administrador crea un producto (201)", async () => {
      const r = await as(token(getData().admin)).post("/api/products", {
        nombre: "Tónico API",
        categoria: getData().category.nombre,
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
          categoria: getData().category.nombre,
        },
      });
    });
    it("12 Negativa: un cliente no puede crear productos (403)", async () => {
      const r = await as(token(getData().clientA)).post("/api/products", {
        nombre: "Prohibido API",
        categoria: getData().category.nombre,
        precio: 100,
      });
      errorIs(r, 403, "Permisos insuficientes");
      expect(await Product.exists({ nombre: "Prohibido API" })).toBeNull();
    });
    it("31 Negativa: una categoría con operadores MongoDB se rechaza al crear (400)", async () => {
      const r = await as(token(getData().admin)).post("/api/products", {
        nombre: "Inyección API",
        categoria: { $ne: null },
        precio: 100,
      });
      errorIs(r, 400, "Categoría no válida");
      expect(await Product.exists({ nombre: "Inyección API" })).toBeNull();
    });
    it("32 Negativa: una categoría con operadores MongoDB se rechaza al actualizar (400)", async () => {
      const r = await as(token(getData().admin)).put("/api/products/101", {
        categoria: { $ne: null },
      });
      errorIs(r, 400, "Categoría no válida");
    });
    it("33 Negativa: el cliente no puede fijar id, _id ni categoriaRef (201)", async () => {
      const forgedId = "507f1f77bcf86cd799439099";
      const forgedRef = "507f1f77bcf86cd799439098";
      const r = await as(token(getData().admin)).post("/api/products", {
        _id: forgedId,
        id: 5000,
        categoriaRef: forgedRef,
        nombre: "Asignación API",
        categoria: getData().category.nombre,
        precio: 900,
      });
      expect(r.status).toBe(201);
      expect(r.data.data._id).not.toBe(forgedId);
      expect(r.data.data.id).not.toBe(5000);
      expect(r.data.data.categoriaRef).toBe(String(getData().category._id));
    });
    it("34 Negativa: actualizar no permite reescribir categoriaRef ni id (200)", async () => {
      const r = await as(token(getData().admin)).put("/api/products/101", {
        id: 7000,
        categoriaRef: "507f1f77bcf86cd799439098",
        precio: 2600,
      });
      expect(r.status).toBe(200);
      expect(r.data.data).toMatchObject({ id: 101, precio: 2600 });
      expect(r.data.data.categoriaRef).toBe(String(getData().category._id));
    });
    it("35 Positiva: el filtro por categoría solo devuelve esa categoría (200)", async () => {
      await Product.create({
        id: 103,
        nombre: "Perfume API",
        categoria: "Fragancias",
        precio: 4000,
      });
      const r = await api.get("/api/products", {
        params: { categoria: getData().category.nombre },
      });
      expect(r.status).toBe(200);
      expect(r.data.data.map((p) => p.id).sort()).toEqual([101, 102]);
    });
  });
}
