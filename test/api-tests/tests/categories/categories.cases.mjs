import { describe, expect, it } from "vitest";
import { Category } from "../../../data/data.mjs";
import { api, as, token, errorIs, getData } from "../../utils/context.mjs";

export function registerCategoryTests() {
  describe("Categorías", () => {
    it("13 Positiva: lista las categorías (200)", async () => {
      const r = await api.get("/api/categories");
      expect(r.status).toBe(200);
      expect(r.data.ok).toBe(true);
      expect(r.data.data.map((c) => c.nombre)).toContain(getData().category.nombre);
    });
    it("14 Positiva: crea una categoría y genera su slug (201)", async () => {
      const r = await as(token(getData().admin)).post("/api/categories", {
        nombre: "Protección Solar",
      });
      expect(r.status).toBe(201);
      expect(r.data).toMatchObject({
        ok: true,
        data: { nombre: "Protección Solar", slug: "proteccion-solar" },
      });
    });
    it("15 Negativa: categoría sin nombre devuelve 400", async () => {
      errorIs(
        await as(token(getData().admin)).post("/api/categories", {}),
        400,
        "nombre es requerido",
      );
    });
    it("16 Negativa: no se elimina una categoría con productos (409)", async () => {
      errorIs(
        await as(token(getData().admin)).delete(`/api/categories/${getData().category.id}`),
        409,
        "No se puede eliminar una categoría que tiene productos",
      );
      expect(await Category.exists({ _id: getData().category._id })).toBeTruthy();
    });
  });
}
