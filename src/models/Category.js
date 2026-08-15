const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true },
    activa: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Category", schema);
