const Product = require("../models/Product");
const Category = require("../models/Category");
const identifierQuery = require("../utils/identifierQuery");

// Campos que el cliente puede fijar. `id`, `_id` y `categoriaRef` los calcula el servidor.
const FIELDS = [
  "nombre",
  "categoria",
  "precio",
  "descripcion",
  "imagen",
  "disponible",
  "seccion",
  "promocion",
  "stock",
];

const pick = (body) =>
  Object.fromEntries(
    FIELDS.filter((key) => Object.hasOwn(body || {}, key)).map((key) => [key, body[key]]),
  );

class InvalidCategoryError extends Error {}

// Resuelve la categoría por nombre exacto; rechaza valores que no sean cadenas
// para impedir operadores MongoDB como { $ne: null }.
const resolveCategory = async (nombre) => {
  if (typeof nombre !== "string" || !nombre.trim() || nombre.length > 100)
    throw new InvalidCategoryError();
  const category = await Category.findOne({ nombre: { $eq: nombre }, activa: true });
  if (!category) throw new InvalidCategoryError();
  return category;
};

const categoryError = (res) =>
  res.status(400).json({ ok: false, error: "Categoría no válida" });

exports.list = async (req, res, next) => {
  try {
    const q = {};
    if (req.query.categoria) {
      if (typeof req.query.categoria !== "string" || req.query.categoria.length > 100)
        return res.status(400).json({ ok: false, error: "Categoría inválida" });
      q.categoria = { $eq: req.query.categoria };
    }
    if (req.query.search) {
      if (typeof req.query.search !== "string" || req.query.search.length > 100)
        return res.status(400).json({ ok: false, error: "Búsqueda inválida" });
      q.nombre = { $regex: req.query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
    }
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
    const data = pick(req.body);
    if (data.categoria !== undefined)
      data.categoriaRef = (await resolveCategory(data.categoria))._id;
    data.id = ((await Product.findOne().sort({ id: -1 }))?.id || 0) + 1;
    const p = await Product.create(data);
    res.status(201).json({ ok: true, data: p });
  } catch (e) {
    if (e instanceof InvalidCategoryError) return categoryError(res);
    next(e);
  }
};

exports.update = async (req, res, next) => {
  try {
    const data = pick(req.body);
    if (data.categoria !== undefined)
      data.categoriaRef = (await resolveCategory(data.categoria))._id;
    const p = await Product.findOneAndUpdate(
      identifierQuery(req.params.id),
      { $set: data },
      { new: true, runValidators: true },
    );
    if (!p)
      return res
        .status(404)
        .json({ ok: false, error: "Producto no encontrado" });
    res.json({ ok: true, data: p });
  } catch (e) {
    if (e instanceof InvalidCategoryError) return categoryError(res);
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
