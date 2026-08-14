const r = require("express").Router();
const c = require("../controllers/order.controller");
const a = require("../utils/asyncHandler");
const { protect, adminOnly } = require("../middlewares/auth");

r.use(protect);
r.get("/", a(c.list));
r.get("/user/:userId", a(c.byUser));
r.get("/:id", a(c.get));
r.post("/", a(c.create));
r.patch("/:id/status", adminOnly, a(c.status));

module.exports = r;
