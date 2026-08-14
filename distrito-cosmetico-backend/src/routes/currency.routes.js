const r = require("express").Router();
const c = require("../controllers/currency.controller");
const a = require("../utils/asyncHandler");

r.get("/convert", a(c.convert));

module.exports = r;
