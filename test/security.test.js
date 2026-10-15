const test = require("node:test");
const assert = require("node:assert/strict");

process.env.JWT_SECRET = "test-secret-with-at-least-thirty-two-characters";
const { app } = require("../src/server");
const User = require("../src/models/User");
const Product = require("../src/models/Product");
const sign = require("../src/utils/jwt");

test("las credenciales con operadores MongoDB se rechazan", async () => {
  const server = app.listen(0);
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correo: { $ne: null }, password: "x" }),
    });
    assert.equal(response.status, 400);
  } finally {
    server.close();
  }
});

test("la búsqueda trata expresiones regulares como texto literal", async () => {
  const original = Product.find;
  let query;
  Product.find = (value) => {
    query = value;
    return { sort: async () => [] };
  };
  const server = app.listen(0);
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/products?search=%2E%2A`);
    assert.equal(response.status, 200);
    assert.equal(query.nombre.$regex, "\\.\\*");
  } finally {
    server.close();
    Product.find = original;
  }
});

test("el secreto JWT es obligatorio y el token usa HS256", () => {
  const previous = process.env.JWT_SECRET;
  try {
    delete process.env.JWT_SECRET;
    assert.throws(() => sign({ _id: "507f1f77bcf86cd799439011", rol: "cliente" }), /JWT_SECRET/);
    process.env.JWT_SECRET = previous;
    const token = sign({ _id: "507f1f77bcf86cd799439011", rol: "cliente" });
    assert.equal(JSON.parse(Buffer.from(token.split(".")[0], "base64url")).alg, "HS256");
  } finally {
    process.env.JWT_SECRET = previous;
  }
});

test("las solicitudes de otro origen no reciben permiso CORS", async () => {
  const server = app.listen(0);
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/health`, {
      headers: { Origin: "https://example.invalid" },
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("access-control-allow-origin"), null);
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  } finally {
    server.close();
  }
});

test("errores inesperados no exponen detalles internos", async () => {
  const original = User.findOne;
  User.findOne = async () => { throw new Error("dato interno secreto"); };
  const server = app.listen(0);
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correo: "a@example.com", password: "password123" }),
    });
    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), { ok: false, error: "Error interno del servidor" });
  } finally {
    server.close();
    User.findOne = original;
  }
});
