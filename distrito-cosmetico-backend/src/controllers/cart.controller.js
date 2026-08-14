const Cart = require("../models/Cart");
const Product = require("../models/Product");
const mongoose = require("mongoose");

const productQuery = (value) => {
  if (/^\d+$/.test(String(value))) return { id: Number(value) };
  if (mongoose.isValidObjectId(value)) return { _id: value };
  return { _id: null };
};

const view = async (c) => {
  await c.populate("items.producto");
  return c;
};

exports.get = async (req, res, next) => {
  try {
    let c =
      (await Cart.findOne({ usuario: req.user._id })) ||
      (await Cart.create({ usuario: req.user._id, items: [] }));
    res.json({ ok: true, data: await view(c) });
  } catch (e) {
    next(e);
  }
};

exports.add = async (req, res, next) => {
  try {
    const p = await Product.findOne(productQuery(req.body.productId));
    const qty = Number(req.body.cantidad || 1);
    if (!p)
      return res
        .status(404)
        .json({ ok: false, error: "Producto no encontrado" });
    if (!p.disponible)
      return res
        .status(409)
        .json({ ok: false, error: "El producto no está disponible" });
    if (qty < 1 || qty > p.stock)
      return res
        .status(400)
        .json({ ok: false, error: "Cantidad no disponible" });
    let c =
      (await Cart.findOne({ usuario: req.user._id })) ||
      new Cart({ usuario: req.user._id, items: [] });
    const item = c.items.find((i) => String(i.producto) === String(p._id));
    if (item) item.cantidad = qty;
    else c.items.push({ producto: p._id, cantidad: qty });
    await c.save();
    res.status(201).json({ ok: true, data: await view(c) });
  } catch (e) {
    next(e);
  }
};

exports.update = async (req, res, next) => {
  req.body.productId = req.params.productId;
  return exports.add(req, res, next);
};

exports.remove = async (req, res, next) => {
  try {
    const c = await Cart.findOne({ usuario: req.user._id });
    if (c) {
      const product = await Product.findOne(productQuery(req.params.productId));
      const productId = product?._id || req.params.productId;
      c.items = c.items.filter(
        (i) => String(i.producto) !== String(productId),
      );
      await c.save();
    }
    res.json({ ok: true, data: c ? await view(c) : { items: [] } });
  } catch (e) {
    next(e);
  }
};

exports.clear = async (req, res, next) => {
  try {
    await Cart.findOneAndUpdate(
      { usuario: req.user._id },
      { items: [] },
      { upsert: true },
    );
    res.status(204).send();
  } catch (e) {
    next(e);
  }
};
