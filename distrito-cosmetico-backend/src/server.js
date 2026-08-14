require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middlewares/error");
const authRoutes = require("./routes/auth.routes");
const productRoutes = require("./routes/product.routes");
const categoryRoutes = require("./routes/category.routes");
const cartRoutes = require("./routes/cart.routes");
const orderRoutes = require("./routes/order.routes");
const currencyRoutes = require("./routes/currency.routes");

const app = express();

app.use(express.json());
app.use(cors({ origin: process.env.CORS_ORIGIN || true }));

// Conectar a MongoDB
connectDB();

app.get("/", (req, res) => {
  res.json({
    msj: "API funcionando correctamente",
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en puerto ${PORT}`);
});

app.get("/api/health", (req, res) =>
  res.json({ ok: true, service: "distrito-cosmetico-backend" }),
);
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/currency", currencyRoutes);

app.use(notFound);
app.use(errorHandler);
