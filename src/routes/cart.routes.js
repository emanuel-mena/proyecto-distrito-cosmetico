const r = require("express").Router();
const c = require("../controllers/cart.controller");
const a = require("../utils/asyncHandler");
const { protect } = require("../middlewares/auth");

r.use(protect);
r.get("/", a(c.get));
r.post("/items", a(c.add));
r.put("/items/:productId", a(c.update));
r.delete("/items/:productId", a(c.remove));
r.delete("/", a(c.clear));

module.exports = r;
