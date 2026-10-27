import { expect } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const sign = require("../src/utils/jwt");

export let api, as;
let data;

export function setApi(client) {
  ({ api, as } = client);
}

export function setData(fixture) {
  data = fixture;
}

export function getData() {
  return data;
}

export const token = (user) => sign(user);

export function errorIs(response, status, message) {
  expect(response.status).toBe(status);
  expect(response.data).toMatchObject({ ok: false, error: message });
}

export const orderBody = { telefono: "88889999", direccion: "Cartago" };

export const addAvailable = () =>
  as(token(data.clientA)).post("/api/cart/items", {
    productId: data.available.id,
    cantidad: 2,
  });
