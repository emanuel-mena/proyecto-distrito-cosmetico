const mongoose = require("mongoose");

// Normaliza un identificador recibido del cliente (id numérico u ObjectId)
// a una consulta segura: cualquier valor que no sea cadena o número
// (por ejemplo { $ne: null }) se descarta antes de llegar a MongoDB.
const identifierQuery = (value) => {
  const text =
    typeof value === "string" || typeof value === "number" ? String(value) : "";
  if (/^\d+$/.test(text)) return { id: Number(text) };
  if (mongoose.isValidObjectId(text)) return { _id: { $eq: text } };
  return { _id: null };
};

module.exports = identifierQuery;
