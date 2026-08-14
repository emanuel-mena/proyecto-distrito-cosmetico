const Product = require("../models/Product");
const Category = require("../models/Category");

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
    const p = await Product.findOne({
      $or: [{ _id: req.params.id }, { id: Number(req.params.id) }],
    });
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
    if (data.categoria)
      data.categoriaRef = (
        await Category.findOne({ nombre: data.categoria })
      )?._id;
    const p = await Product.create(data);
    res.status(201).json({ ok: true, data: p });
  } catch (e) {
    next(e);
  }
};

exports.update = async (req, res, next) => {
  try {
    const p = await Product.findOneAndUpdate(
      { $or: [{ _id: req.params.id }, { id: Number(req.params.id) }] },
      req.body,
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
    const p = await Product.findOneAndDelete({
      $or: [{ _id: req.params.id }, { id: Number(req.params.id) }],
    });
    if (!p)
      return res
        .status(404)
        .json({ ok: false, error: "Producto no encontrado" });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
};
