const r = require("express").Router();
const c = require("../controllers/auth.controller");
const a = require("../utils/asyncHandler");
const { rateLimit } = require("express-rate-limit");
const authLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: "draft-8", legacyHeaders: false,
  message: { ok: false, error: "Demasiados intentos. Intente más tarde." } });
r.post("/register", authLimit, a(c.register));
r.post("/login", authLimit, a(c.login));
module.exports = r;
