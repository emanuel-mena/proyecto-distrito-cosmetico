const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true },
    nombre: { type: String, required: true },
    categoria: { type: String, required: true },
    categoriaRef: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    precio: { type: Number, min: 0, required: true },
    descripcion: String,
    imagen: String,
    disponible: Boolean,
    seccion: String,
    promocion: Boolean,
    stock: { type: Number, min: 0, default: 0 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Product", schema);
