import bcrypt from "bcryptjs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const User = require("../src/models/User");
const Category = require("../src/models/Category");
const Product = require("../src/models/Product");
const Order = require("../src/models/Order");
const Cart = require("../src/models/Cart");

export const password = "Password123!";
let hashedPassword;

export async function resetData() {
  hashedPassword ??= await bcrypt.hash(password, 4);
  await Promise.all([
    Cart.deleteMany({}),
    Order.deleteMany({}),
    Product.deleteMany({}),
    Category.deleteMany({}),
    User.deleteMany({}),
  ]);

  const [admin, clientA, clientB] = await User.create([
    {
      nombre: "Admin API",
      correo: "admin@test.local",
      password: hashedPassword,
      rol: "admin",
    },
    {
      nombre: "Cliente A",
      correo: "a@test.local",
      password: hashedPassword,
      rol: "cliente",
    },
    {
      nombre: "Cliente B",
      correo: "b@test.local",
      password: hashedPassword,
      rol: "cliente",
    },
  ]);
  const category = await Category.create({
    nombre: "Cuidado Facial",
    slug: "cuidado-facial",
  });
  const [available, unavailable] = await Product.create([
    {
      id: 101,
      nombre: "Serum API",
      categoria: category.nombre,
      categoriaRef: category._id,
      precio: 2500,
      disponible: true,
      stock: 5,
    },
    {
      id: 102,
      nombre: "Crema API",
      categoria: category.nombre,
      categoriaRef: category._id,
      precio: 3000,
      disponible: false,
      stock: 5,
    },
  ]);
  const [orderA, orderB] = await Order.create([
    {
      numero: "TEST-A",
      usuario: clientA._id,
      cliente: clientA.nombre,
      correo: clientA.correo,
      telefono: "88880001",
      direccion: "San José",
      productos: [],
      total: 0,
      estado: "Pendiente",
    },
    {
      numero: "TEST-B",
      usuario: clientB._id,
      cliente: clientB.nombre,
      correo: clientB.correo,
      telefono: "88880002",
      direccion: "Heredia",
      productos: [],
      total: 0,
      estado: "Pendiente",
    },
  ]);
  return {
    admin,
    clientA,
    clientB,
    category,
    available,
    unavailable,
    orderA,
    orderB,
  };
}

export { Cart, Product, Category, Order };
