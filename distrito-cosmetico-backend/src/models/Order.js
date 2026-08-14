const mongoose = require("mongoose");

const item = new mongoose.Schema(
  {
    producto: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    nombre: String,
    cantidad: { type: Number, min: 1 },
    precio: { type: Number, min: 0 },
  },
  { _id: false },
);

const schema = new mongoose.Schema(
  {
    numero: { type: String, unique: true },
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    cliente: String,
    correo: String,
    telefono: String,
    direccion: String,
    fecha: { type: Date, default: Date.now },
    productos: [item],
    total: { type: Number, min: 0 },
    estado: {
      type: String,
      enum: ["Pendiente", "En preparación", "En camino", "Entregado"],
      default: "Pendiente",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Order", schema);
