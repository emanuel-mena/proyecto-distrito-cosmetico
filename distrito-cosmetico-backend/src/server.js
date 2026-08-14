require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
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

app.get("/api/health", (req, res) =>
  res.json({ ok: true, service: "distrito-cosmetico-backend" }),
);
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/currency", currencyRoutes);

app.use("/api", notFound);

const publicDir = path.resolve(__dirname, "../public");
const indexFile = path.join(publicDir, "index.html");
if (fs.existsSync(indexFile)) {
  app.use(express.static(publicDir));
  app.use((req, res, next) => {
    if (req.method === "GET" && req.accepts("html")) {
      return res.sendFile(indexFile);
    }
    next();
  });
}

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en puerto ${PORT}`);
  });
};

if (require.main === module) start();

module.exports = { app, start };
