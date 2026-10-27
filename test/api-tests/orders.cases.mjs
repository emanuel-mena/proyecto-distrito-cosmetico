import { describe, expect, it } from "vitest";
import { Cart, Product, Order } from "./data.mjs";
import { as, token, errorIs, addAvailable, orderBody, getData } from "./context.mjs";

export function registerOrderTests() {
  describe("Órdenes", () => {
    it("23 crea una orden, vacía el carrito y descuenta stock", async () => {
      expect((await addAvailable()).status).toBe(201);
      const r = await as(token(getData().clientA)).post("/api/orders", orderBody);
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
        (await Cart.findOne({ usuario: getData().clientA._id })).items,
      ).toHaveLength(0);
      expect((await Product.findById(getData().available._id)).stock).toBe(3);
    });
    it("24 rechaza una orden con carrito vacío", async () => {
      errorIs(
        await as(token(getData().clientA)).post("/api/orders", orderBody),
        400,
        "El carrito está vacío",
      );
    });
    it("25 exige dirección para crear una orden", async () => {
      expect((await addAvailable()).status).toBe(201);
      errorIs(
        await as(token(getData().clientA)).post("/api/orders", {
          telefono: "88889999",
        }),
        400,
        "telefono y direccion son requeridos",
      );
    });
    it("26 limita el listado de órdenes a las del cliente", async () => {
      const r = await as(token(getData().clientA)).get("/api/orders");
      expect(r.status).toBe(200);
      expect(r.data.ok).toBe(true);
      expect(r.data.data.map((o) => o.numero)).toContain("TEST-A");
      expect(r.data.data.map((o) => o.numero)).not.toContain("TEST-B");
    });
    it("27 impide consultar el historial de otro cliente", async () => {
      errorIs(
        await as(token(getData().clientA)).get(`/api/orders/user/${getData().clientB.id}`),
        403,
        "Permisos insuficientes",
      );
    });
    it("28 impide consultar el detalle de una orden ajena", async () => {
      errorIs(
        await as(token(getData().clientA)).get(`/api/orders/${getData().orderB.id}`),
        403,
        "Permisos insuficientes",
      );
    });
    it("29 impide a un cliente cambiar el estado de una orden", async () => {
      errorIs(
        await as(token(getData().clientA)).patch(
          `/api/orders/${getData().orderA.id}/status`,
          { estado: "En camino" },
        ),
        403,
        "Permisos insuficientes",
      );
      expect((await Order.findById(getData().orderA._id)).estado).toBe("Pendiente");
    });
    it("30 permite al administrador cambiar el estado de una orden", async () => {
      const r = await as(token(getData().admin)).patch(
        `/api/orders/${getData().orderA.id}/status`,
        { estado: "En camino" },
      );
      expect(r.status).toBe(200);
      expect(r.data).toMatchObject({ ok: true, data: { estado: "En camino" } });
    });
  });
}
