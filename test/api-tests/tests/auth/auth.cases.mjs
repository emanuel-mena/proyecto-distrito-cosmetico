import { describe, expect, it } from "vitest";
import { password } from "../../../data/data.mjs";
import { api, errorIs, getData } from "../../utils/context.mjs";

export function registerAuthTests() {
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
          correo: getData().clientA.correo,
          password,
        }),
        409,
        "El correo ya está registrado",
      );
    });
    it("05 inicia sesión con credenciales correctas", async () => {
      const r = await api.post("/api/auth/login", {
        correo: getData().clientA.correo,
        password,
      });
      expect(r.status).toBe(200);
      expect(r.data).toMatchObject({
        ok: true,
        user: { correo: getData().clientA.correo, rol: "cliente" },
      });
      expect(r.data.token).toEqual(expect.any(String));
    });
    it("06 rechaza una contraseña incorrecta", async () => {
      errorIs(
        await api.post("/api/auth/login", {
          correo: getData().clientA.correo,
          password: "incorrecta",
        }),
        401,
        "Correo o contraseña incorrectos",
      );
    });
  });
}
