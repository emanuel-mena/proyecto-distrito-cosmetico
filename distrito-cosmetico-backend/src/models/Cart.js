const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      required: true,
    },
    items: [
      {
        producto: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        cantidad: { type: Number, min: 1, required: true },
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Cart", schema);
