import { describe, expect, it } from "vitest";
import { Cart, Product, Order } from "../../../data/data.mjs";
import { as, token, errorIs, addAvailable, orderBody, getData } from "../../utils/context.mjs";

export function registerOrderTests() {
  describe("Órdenes", () => {
    it("23 Positiva: crea una orden, vacía el carrito y descuenta stock (201)", async () => {
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
    it("24 Negativa: orden con carrito vacío devuelve 400", async () => {
      errorIs(
        await as(token(getData().clientA)).post("/api/orders", orderBody),
        400,
        "El carrito está vacío",
      );
    });
    it("25 Negativa: orden sin dirección devuelve 400", async () => {
      expect((await addAvailable()).status).toBe(201);
      errorIs(
        await as(token(getData().clientA)).post("/api/orders", {
          telefono: "88889999",
        }),
        400,
        "telefono y direccion son requeridos",
      );
    });
    it("26 Positiva: lista solo las órdenes del cliente (200)", async () => {
      const r = await as(token(getData().clientA)).get("/api/orders");
      expect(r.status).toBe(200);
      expect(r.data.ok).toBe(true);
      expect(r.data.data.map((o) => o.numero)).toContain("TEST-A");
      expect(r.data.data.map((o) => o.numero)).not.toContain("TEST-B");
    });
    it("27 Negativa: un cliente no puede consultar el historial de otro (403)", async () => {
      errorIs(
        await as(token(getData().clientA)).get(`/api/orders/user/${getData().clientB.id}`),
        403,
        "Permisos insuficientes",
      );
    });
    it("28 Negativa: un cliente no puede ver el detalle de una orden ajena (403)", async () => {
      errorIs(
        await as(token(getData().clientA)).get(`/api/orders/${getData().orderB.id}`),
        403,
        "Permisos insuficientes",
      );
    });
    it("29 Negativa: un cliente no puede cambiar el estado de una orden (403)", async () => {
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
    it("30 Positiva: el administrador cambia el estado de una orden (200)", async () => {
      const r = await as(token(getData().admin)).patch(
        `/api/orders/${getData().orderA.id}/status`,
        { estado: "En camino" },
      );
      expect(r.status).toBe(200);
      expect(r.data).toMatchObject({ ok: true, data: { estado: "En camino" } });
    });
  });
}
