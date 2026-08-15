const r = require("express").Router();
const c = require("../controllers/product.controller");
const a = require("../utils/asyncHandler");
const { protect, adminOnly } = require("../middlewares/auth");

r.get("/", a(c.list));
r.get("/:id", a(c.get));
r.post("/", protect, adminOnly, a(c.create));
r.put("/:id", protect, adminOnly, a(c.update));
r.delete("/:id", protect, adminOnly, a(c.remove));

module.exports = r;
