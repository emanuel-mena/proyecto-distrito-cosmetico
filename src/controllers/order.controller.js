const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
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
      const p = await Product.findById(i.producto._id);
      if (!p || !p.disponible || p.stock < i.cantidad)
        return res
          .status(409)
          .json({
            ok: false,
            error: `Stock insuficiente para ${i.producto.nombre}`,
          });
      products.push({
        producto: p._id,
        nombre: p.nombre,
        cantidad: i.cantidad,
        precio: p.precio,
      });
      total += p.precio * i.cantidad;
    }
    for (const i of cart.items)
      await Product.findByIdAndUpdate(i.producto._id, {
        $inc: { stock: -i.cantidad },
      });
    const o = await Order.create({
      numero: `PED-${Date.now()}`,
      usuario: req.user._id,
      cliente: req.body.cliente || req.user.nombre,
      correo: req.body.correo || req.user.correo,
      telefono: req.body.telefono,
      direccion: req.body.direccion,
      productos,
      total,
      estado: "Pendiente",
    });
    await Cart.findByIdAndUpdate(cart._id, { items: [] });
    res.status(201).json({ ok: true, data: o });
  } catch (e) {
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
