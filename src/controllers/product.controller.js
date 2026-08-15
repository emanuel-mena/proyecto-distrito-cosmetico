const Product = require("../models/Product");
const Category = require("../models/Category");
const mongoose = require("mongoose");

const identifierQuery = (value) => {
  if (/^\d+$/.test(String(value))) return { id: Number(value) };
  if (mongoose.isValidObjectId(value)) return { _id: value };
  return { _id: null };
};

exports.list = async (req, res, next) => {
  try {
    const q = {};
    if (req.query.categoria) q.categoria = req.query.categoria;
    if (req.query.search)
      q.nombre = { $regex: req.query.search, $options: "i" };
    const data = await Product.find(q).sort({ id: 1 });
    res.json({ ok: true, data });
  } catch (e) {
    next(e);
  }
};

exports.get = async (req, res, next) => {
  try {
    const p = await Product.findOne(identifierQuery(req.params.id));
    if (!p)
      return res
        .status(404)
        .json({ ok: false, error: "Producto no encontrado" });
    res.json({ ok: true, data: p });
  } catch (e) {
    next(e);
  }
};

exports.create = async (req, res, next) => {
  try {
    const data = {
      ...req.body,
      id:
        req.body.id ||
        ((await Product.findOne().sort({ id: -1 }))?.id || 0) + 1,
    };
    if (data.categoria) {
      const category = await Category.findOne({ nombre: data.categoria, activa: true });
      if (!category)
        return res.status(400).json({ ok: false, error: "Categoría no válida" });
      data.categoriaRef = category._id;
    }
    const p = await Product.create(data);
    res.status(201).json({ ok: true, data: p });
  } catch (e) {
    next(e);
  }
};

exports.update = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (data.categoria) {
      const category = await Category.findOne({ nombre: data.categoria, activa: true });
      if (!category)
        return res.status(400).json({ ok: false, error: "Categoría no válida" });
      data.categoriaRef = category._id;
    }
    const p = await Product.findOneAndUpdate(
      identifierQuery(req.params.id),
      data,
      { new: true, runValidators: true },
    );
    if (!p)
      return res
        .status(404)
        .json({ ok: false, error: "Producto no encontrado" });
    res.json({ ok: true, data: p });
  } catch (e) {
    next(e);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const p = await Product.findOneAndDelete(identifierQuery(req.params.id));
    if (!p)
      return res
        .status(404)
        .json({ ok: false, error: "Producto no encontrado" });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
};
