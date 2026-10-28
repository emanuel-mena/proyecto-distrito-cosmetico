import { describe, expect, it } from "vitest";
import { password } from "../../../data/data.mjs";
import { api, errorIs, getData } from "../../utils/context.mjs";

export function registerAuthTests() {
  describe("Autenticación", () => {
    it("01 Positiva: registra un cliente con datos válidos (201)", async () => {
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
    it("02 Positiva: el registro público no concede rol administrador (201)", async () => {
      const r = await api.post("/api/auth/register", {
        nombre: "Nuevo",
        correo: "nuevo@test.local",
        password,
        rol: "admin",
      });
      expect(r.status).toBe(201);
      expect(r.data).toMatchObject({ ok: true, user: { rol: "cliente" } });
    });
    it("03 Negativa: correo de registro inválido devuelve 400", async () => {
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
    it("04 Negativa: correo duplicado devuelve 409", async () => {
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
    it("05 Positiva: inicia sesión con credenciales correctas (200)", async () => {
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
    it("06 Negativa: contraseña incorrecta devuelve 401", async () => {
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
