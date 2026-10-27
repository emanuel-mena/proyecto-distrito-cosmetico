import { describe, expect, it } from "vitest";
import { api, as, token, errorIs, addAvailable, getData } from "./context.mjs";

export function registerCartTests() {
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
        await as(token(getData().clientA)).post("/api/cart/items", {
          productId: 102,
          cantidad: 1,
        }),
        409,
        "El producto no está disponible",
      );
    });
    it("20 rechaza una cantidad superior al stock", async () => {
      errorIs(
        await as(token(getData().clientA)).post("/api/cart/items", {
          productId: 101,
          cantidad: 6,
        }),
        400,
        "Cantidad no disponible",
      );
    });
    it("21 actualiza la cantidad de un producto", async () => {
      expect((await addAvailable()).status).toBe(201);
      const r = await as(token(getData().clientA)).put("/api/cart/items/101", {
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
      const r = await as(token(getData().clientA)).delete("/api/cart/items/101");
      expect(r.status).toBe(200);
      expect(r.data).toMatchObject({ ok: true, data: { items: [] } });
    });
  });
}
