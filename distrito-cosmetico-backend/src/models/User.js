const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    correo: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 6 },
    rol: { type: String, enum: ["cliente", "admin"], default: "cliente" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", schema);
