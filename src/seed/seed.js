require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");
const User = require("../models/User");
const Category = require("../models/Category");
const Product = require("../models/Product");
const Order = require("../models/Order");
const root = path.resolve(
  __dirname,
  "../../distrito-cosmetico-frontend/src/data",
);

const read = (n) => JSON.parse(fs.readFileSync(path.join(root, n), "utf8"));

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const adminEmail = process.env.ADMIN_EMAIL || "admin@distritocosmetico.com";
  const adminPass = process.env.ADMIN_PASSWORD || "Admin123456";
  await User.updateOne(
    { correo: adminEmail },
    {
      $setOnInsert: {
        nombre: "Administrador",
        correo: adminEmail,
        password: await bcrypt.hash(adminPass, 10),
        rol: "admin",
      },
    },
    { upsert: true },
  );
  const products = read("productos.json");
  const names = [...new Set(products.map((p) => p.categoria))];
  const cats = {};
  for (const nombre of names) {
    const c = await Category.findOneAndUpdate(
      { nombre },
      { nombre, slug: nombre.toLowerCase().replace(/\s+/g, "-") },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    cats[nombre] = c._id;
  }
  for (const p of products)
    await Product.updateOne(
      { id: p.id },
      { $set: { ...p, categoriaRef: cats[p.categoria] } },
      { upsert: true },
    );
  const orders = read("ordenes.json");
  for (const source of orders) {
    const customer = await User.findOneAndUpdate(
      { correo: source.correo },
      {
        $setOnInsert: {
          nombre: source.cliente,
          correo: source.correo,
          password: await bcrypt.hash("Cliente123456", 10),
          rol: "cliente",
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    const items = source.productos.map((i) => ({
      nombre: i.nombre,
      cantidad: i.cantidad,
      precio: i.precio,
    }));
    await Order.updateOne(
      { numero: String(source.id) },
      {
        $set: {
          numero: String(source.id),
          usuario: customer._id,
          cliente: source.cliente,
          correo: source.correo,
          telefono: source.telefono,
          direccion: source.direccion,
          fecha: new Date(source.fecha),
          productos: items,
          total: source.total,
          estado: source.estado,
        },
      },
      { upsert: true },
    );
  }
  console.log(
    `Seed completado: ${products.length} productos y ${orders.length} órdenes`,
  );
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
