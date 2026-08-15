const test = require("node:test");
const assert = require("node:assert/strict");

const authController = require("../src/controllers/auth.controller");
const cartController = require("../src/controllers/cart.controller");
const categoryController = require("../src/controllers/category.controller");
const orderController = require("../src/controllers/order.controller");
const productController = require("../src/controllers/product.controller");
const User = require("../src/models/User");
const Product = require("../src/models/Product");
const Category = require("../src/models/Category");

const response = () => {
  const state = { status: 200, body: null };
  return {
    state,
    status(code) {
      state.status = code;
      return this;
    },
    json(body) {
      state.body = body;
      return this;
    },
    send() {
      return this;
    },
  };
};

test("el registro público siempre crea clientes", async () => {
  const originalFindOne = User.findOne;
  const originalCreate = User.create;
  let created;
  User.findOne = async () => null;
  User.create = async (input) => {
    created = input;
    return { _id: "507f1f77bcf86cd799439011", ...input };
  };
  try {
    const res = response();
    await authController.register(
      {
        body: {
          nombre: "Cliente",
          correo: "cliente@example.com",
          password: "Password123",
          rol: "admin",
        },
      },
      res,
      assert.fail,
    );
    assert.equal(res.state.status, 201);
    assert.equal(created.rol, "cliente");
    assert.equal(res.state.body.user.rol, "cliente");
  } finally {
    User.findOne = originalFindOne;
    User.create = originalCreate;
  }
});

test("los identificadores numéricos de producto no se convierten a ObjectId", async () => {
  const original = Product.findOne;
  let query;
  Product.findOne = async (value) => {
    query = value;
    return { id: 12 };
  };
  try {
    const res = response();
    await productController.get({ params: { id: "12" } }, res, assert.fail);
    assert.deepEqual(query, { id: 12 });
    assert.equal(res.state.status, 200);
  } finally {
    Product.findOne = original;
  }
});

test("el carrito rechaza productos no disponibles", async () => {
  const original = Product.findOne;
  Product.findOne = async () => ({ disponible: false, stock: 10 });
  try {
    const res = response();
    await cartController.add({ body: { productId: 1, cantidad: 1 } }, res, assert.fail);
    assert.equal(res.state.status, 409);
  } finally {
    Product.findOne = original;
  }
});

test("no se eliminan categorías con productos", async () => {
  const originalExists = Product.exists;
  const originalDelete = Category.findByIdAndDelete;
  let deleted = false;
  Product.exists = async () => true;
  Category.findByIdAndDelete = async () => {
    deleted = true;
  };
  try {
    const res = response();
    await categoryController.remove({ params: { id: "category" } }, res, assert.fail);
    assert.equal(res.state.status, 409);
    assert.equal(deleted, false);
  } finally {
    Product.exists = originalExists;
    Category.findByIdAndDelete = originalDelete;
  }
});

test("una orden requiere teléfono y dirección", async () => {
  const res = response();
  await orderController.create({ body: {}, user: {} }, res, assert.fail);
  assert.equal(res.state.status, 400);
  assert.match(res.state.body.error, /telefono y direccion/);
});
