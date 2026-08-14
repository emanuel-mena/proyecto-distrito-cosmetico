const Cart = require("../models/Cart");
const Product = require("../models/Product");

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
    const p = await Product.findOne({
      $or: [{ id: Number(req.body.productId) }, { _id: req.body.productId }],
    });
    const qty = Number(req.body.cantidad || 1);
    if (!p)
      return res
        .status(404)
        .json({ ok: false, error: "Producto no encontrado" });
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
      c.items = c.items.filter(
        (i) => String(i.producto) !== req.params.productId,
      );
      await c.save();
    }
    res.json({ ok: true, data: c || { items: [] } });
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
