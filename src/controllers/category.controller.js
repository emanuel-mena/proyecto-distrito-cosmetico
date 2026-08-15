const Category = require("../models/Category");
const Product = require("../models/Product");
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
    const nombre = String(req.body.nombre || "").trim();
    if (!nombre)
      return res
        .status(400)
        .json({ ok: false, error: "nombre es requerido" });
    const c = await Category.create({
      nombre,
      slug: req.body.slug || slugify(nombre),
    });
    res.status(201).json({ ok: true, data: c });
  } catch (e) {
    next(e);
  }
};

exports.update = async (req, res, next) => {
  try {
    const previous = await Category.findById(req.params.id);
    if (!previous)
      return res.status(404).json({ ok: false, error: "Categoría no encontrada" });
    const data = { ...req.body };
    if (data.nombre && !data.slug) data.slug = slugify(data.nombre);
    const c = await Category.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    });
    if (c.nombre !== previous.nombre) {
      await Product.updateMany(
        { categoriaRef: c._id },
        { categoria: c.nombre },
      );
    }
    res.json({ ok: true, data: c });
  } catch (e) {
    next(e);
  }
};

exports.remove = async (req, res, next) => {
  try {
    if (await Product.exists({ categoriaRef: req.params.id }))
      return res.status(409).json({
        ok: false,
        error: "No se puede eliminar una categoría que tiene productos",
      });
    if (await Category.findByIdAndDelete(req.params.id))
      return res.status(204).send();
    res.status(404).json({ ok: false, error: "Categoría no encontrada" });
  } catch (e) {
    next(e);
  }
};
