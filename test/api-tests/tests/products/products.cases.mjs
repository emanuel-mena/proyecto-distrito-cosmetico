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
  });
}
