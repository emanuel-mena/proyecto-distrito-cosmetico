require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("node:path");
const fs = require("node:fs");
const { jwtSecret } = require("./utils/jwt");
const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middlewares/error");
const authRoutes = require("./routes/auth.routes");
const productRoutes = require("./routes/product.routes");
const categoryRoutes = require("./routes/category.routes");
const cartRoutes = require("./routes/cart.routes");
const orderRoutes = require("./routes/order.routes");
const currencyRoutes = require("./routes/currency.routes");

const app = express();

app.disable("x-powered-by");

app.use(express.json({ limit: "32kb" }));
const allowedOrigins = (process.env.CORS_ORIGIN || "").split(",").map((s) => s.trim()).filter(Boolean);
app.use(cors({ origin: allowedOrigins }));
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "DENY");
  next();
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
  jwtSecret();
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
  });
};

if (require.main === module) start();

module.exports = { app, start };
