const Category = require("../models/Category");
const slugify = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

    exports.list = async (req, res, next) => {
  try {
    res.json({ ok: true, data: await Category.find().sort({ nombre: 1 }) });
  } catch (e) {
    next(e);
  }
};

exports.create = async (req, res, next) => {
  try {
    const c = await Category.create({
      nombre: req.body.nombre,
      slug: req.body.slug || slugify(req.body.nombre),
    });
    res.status(201).json({ ok: true, data: c });
  } catch (e) {
    next(e);
  }
};

exports.update = async (req, res, next) => {
  try {
    const c = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!c)
      return res
        .status(404)
        .json({ ok: false, error: "Categoría no encontrada" });
    res.json({ ok: true, data: c });
  } catch (e) {
    next(e);
  }
};

exports.remove = async (req, res, next) => {
  try {
    if (await Category.findByIdAndDelete(req.params.id))
      return res.status(204).send();
    res.status(404).json({ ok: false, error: "Categoría no encontrada" });
  } catch (e) {
    next(e);
  }
};
