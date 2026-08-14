const r = require("express").Router();
const c = require("../controllers/auth.controller");
const a = require("../utils/asyncHandler");
r.post("/register", a(c.register));
r.post("/login", a(c.login));
module.exports = r;
