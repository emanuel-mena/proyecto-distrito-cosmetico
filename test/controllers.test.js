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

test("una categoría requiere nombre antes de generar el slug", async () => {
  const res = response();
  await categoryController.create({ body: {} }, res, assert.fail);
  assert.equal(res.state.status, 400);
  assert.match(res.state.body.error, /nombre/);
});

test("una orden guarda sus productos y descuenta el stock", async () => {
  const Cart = require("../src/models/Cart");
  const Order = require("../src/models/Order");
  const originalCartFindOne = Cart.findOne;
  const originalCartUpdate = Cart.findByIdAndUpdate;
  const originalProductUpdate = Product.findOneAndUpdate;
  const originalOrderCreate = Order.create;
  let created;
  let cleared = false;
  const product = {
    _id: "507f1f77bcf86cd799439012",
    nombre: "Labial",
    precio: 2500,
  };
  Cart.findOne = () => ({
    populate: async () => ({
      _id: "507f1f77bcf86cd799439013",
      items: [{ producto: product, cantidad: 2 }],
    }),
  });
  Product.findOneAndUpdate = async () => product;
  Order.create = async (input) => {
    created = input;
    return { _id: "507f1f77bcf86cd799439014", ...input };
  };
  Cart.findByIdAndUpdate = async () => {
    cleared = true;
  };
  try {
    const res = response();
    await orderController.create(
      {
        body: { telefono: "8888-8888", direccion: "San José" },
        user: {
          _id: "507f1f77bcf86cd799439015",
          nombre: "Cliente",
          correo: "cliente@example.com",
        },
      },
      res,
      assert.fail,
    );
    assert.equal(res.state.status, 201);
    assert.equal(created.productos.length, 1);
    assert.equal(created.productos[0].nombre, "Labial");
    assert.equal(created.total, 5000);
    assert.equal(cleared, true);
  } finally {
    Cart.findOne = originalCartFindOne;
    Cart.findByIdAndUpdate = originalCartUpdate;
    Product.findOneAndUpdate = originalProductUpdate;
    Order.create = originalOrderCreate;
  }
});

test("una orden rechaza productos eliminados sin modificar el stock", async () => {
  const Cart = require("../src/models/Cart");
  const originalCartFindOne = Cart.findOne;
  const originalProductUpdate = Product.findOneAndUpdate;
  let stockUpdates = 0;
  Cart.findOne = () => ({
    populate: async () => ({
      items: [{ producto: null, cantidad: 1 }],
    }),
  });
  Product.findOneAndUpdate = async () => {
    stockUpdates += 1;
  };
  try {
    const res = response();
    let error;
    await orderController.create(
      {
        body: { telefono: "8888-8888", direccion: "San José" },
        user: {},
      },
      res,
      (cause) => {
        error = cause;
      },
    );
    assert.equal(error.status, 409);
    assert.match(error.message, /ya no existe/);
    assert.equal(stockUpdates, 0);
  } finally {
    Cart.findOne = originalCartFindOne;
    Product.findOneAndUpdate = originalProductUpdate;
  }
});

test("el stock se restaura cuando no se puede crear la orden", async () => {
  const Cart = require("../src/models/Cart");
  const Order = require("../src/models/Order");
  const originalCartFindOne = Cart.findOne;
  const originalProductConditionalUpdate = Product.findOneAndUpdate;
  const originalProductUpdate = Product.findByIdAndUpdate;
  const originalOrderCreate = Order.create;
  let rollback;
  const product = {
    _id: "507f1f77bcf86cd799439012",
    nombre: "Labial",
    precio: 2500,
  };
  Cart.findOne = () => ({
    populate: async () => ({
      items: [{ producto: product, cantidad: 2 }],
    }),
  });
  Product.findOneAndUpdate = async () => product;
  Product.findByIdAndUpdate = async (id, update) => {
    rollback = { id, update };
  };
  Order.create = async () => {
    throw new Error("No se pudo guardar la orden");
  };
  try {
    const res = response();
    let error;
    await orderController.create(
      {
        body: { telefono: "8888-8888", direccion: "San José" },
        user: {},
      },
      res,
      (cause) => {
        error = cause;
      },
    );
    assert.match(error.message, /No se pudo guardar/);
    assert.equal(String(rollback.id), product._id);
    assert.deepEqual(rollback.update, { $inc: { stock: 2 } });
  } finally {
    Cart.findOne = originalCartFindOne;
    Product.findOneAndUpdate = originalProductConditionalUpdate;
    Product.findByIdAndUpdate = originalProductUpdate;
    Order.create = originalOrderCreate;
  }
});
