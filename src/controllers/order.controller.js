const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");

const httpError = (status, message) => Object.assign(new Error(message), { status });

exports.list = async (req, res, next) => {
  try {
    const q = req.user.rol === "admin" ? {} : { usuario: req.user._id };
    res.json({
      ok: true,
      data: await Order.find(q)
        .populate("productos.producto")
        .sort({ fecha: -1 }),
    });
  } catch (e) {
    next(e);
  }
};
exports.byUser = async (req, res, next) => {
  try {
    if (req.user.rol !== "admin" && String(req.user._id) !== req.params.userId)
      return res
        .status(403)
        .json({ ok: false, error: "Permisos insuficientes" });
    res.json({
      ok: true,
      data: await Order.find({ usuario: req.params.userId }).sort({
        fecha: -1,
      }),
    });
  } catch (e) {
    next(e);
  }
};
exports.get = async (req, res, next) => {
  try {
    const o = await Order.findById(req.params.id);
    if (!o)
      return res.status(404).json({ ok: false, error: "Orden no encontrada" });
    if (req.user.rol !== "admin" && String(o.usuario) !== String(req.user._id))
      return res
        .status(403)
        .json({ ok: false, error: "Permisos insuficientes" });
    res.json({ ok: true, data: o });
  } catch (e) {
    next(e);
  }
};
exports.create = async (req, res, next) => {
  const decremented = [];
  let order;
  try {
    if (!String(req.body.telefono || "").trim() || !String(req.body.direccion || "").trim())
      return res.status(400).json({
        ok: false,
        error: "telefono y direccion son requeridos",
      });
    const cart = await Cart.findOne({ usuario: req.user._id }).populate(
      "items.producto",
    );
    if (!cart?.items.length)
      return res
        .status(400)
        .json({ ok: false, error: "El carrito está vacío" });
    const products = [];
    let total = 0;
    for (const i of cart.items) {
      if (!i.producto?._id)
        throw httpError(
          409,
          "Uno de los productos del carrito ya no existe",
        );
      const p = await Product.findOneAndUpdate(
        {
          _id: i.producto._id,
          disponible: true,
          stock: { $gte: i.cantidad },
        },
        { $inc: { stock: -i.cantidad } },
        { new: true },
      );
      if (!p)
        throw httpError(
          409,
          `Stock insuficiente para ${i.producto.nombre}`,
        );
      decremented.push({ id: p._id, cantidad: i.cantidad });
      products.push({
        producto: p._id,
        nombre: p.nombre,
        cantidad: i.cantidad,
        precio: p.precio,
      });
      total += p.precio * i.cantidad;
    }
    order = await Order.create({
      numero: `PED-${Date.now()}`,
      usuario: req.user._id,
      cliente: req.body.cliente || req.user.nombre,
      correo: req.body.correo || req.user.correo,
      telefono: req.body.telefono,
      direccion: req.body.direccion,
      productos: products,
      total,
      estado: "Pendiente",
    });
    await Cart.findByIdAndUpdate(cart._id, { items: [] });
    res.status(201).json({ ok: true, data: order });
  } catch (e) {
    if (order?._id) {
      await Order.findByIdAndDelete(order._id).catch(() => {});
    }
    await Promise.all(
      decremented.map(({ id, cantidad }) =>
        Product.findByIdAndUpdate(id, { $inc: { stock: cantidad } }),
      ),
    ).catch(() => {});
    next(e);
  }
};
exports.status = async (req, res, next) => {
  try {
    const o = await Order.findByIdAndUpdate(
      req.params.id,
      { estado: req.body.estado },
      { new: true, runValidators: true },
    );
    if (!o)
      return res.status(404).json({ ok: false, error: "Orden no encontrada" });
    res.json({ ok: true, data: o });
  } catch (e) {
    next(e);
  }
};
