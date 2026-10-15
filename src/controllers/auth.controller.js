const bcrypt = require("bcryptjs");
const User = require("../models/User");
const sign = require("../utils/jwt");

exports.register = async (req, res, next) => {
  try {
    const { nombre, correo, password } = req.body || {};
    if (typeof nombre !== "string" || typeof correo !== "string" || typeof password !== "string" ||
        !nombre.trim() || nombre.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo) || correo.length > 254 ||
        password.length < 8 || password.length > 128)
      return res
        .status(400)
        .json({ ok: false, error: "Datos de registro inválidos" });
    const normalizedEmail = correo.trim().toLowerCase();
    if (await User.findOne({ correo: normalizedEmail }))
      return res
        .status(409)
        .json({ ok: false, error: "El correo ya está registrado" });
    const user = await User.create({
      nombre: nombre.trim(),
      correo: normalizedEmail,
      password: await bcrypt.hash(password, 10),
      rol: "cliente",
    });
    res
      .status(201)
      .json({
        ok: true,
        user: {
          id: user._id,
          nombre: user.nombre,
          correo: user.correo,
          rol: user.rol,
        },
        token: sign(user),
      });
  } catch (e) {
    next(e);
  }
};

exports.login = async (req, res, next) => {
  try {
    if (typeof req.body?.correo !== "string" || typeof req.body?.password !== "string" ||
        req.body.correo.length > 254 || req.body.password.length > 128)
      return res.status(400).json({ ok: false, error: "Credenciales inválidas" });
    const user = await User.findOne({ correo: req.body.correo.trim().toLowerCase() });
    if (
      !user ||
      !(await bcrypt.compare(req.body.password || "", user.password))
    )
      return res
        .status(401)
        .json({ ok: false, error: "Correo o contraseña incorrectos" });
    res.json({
      ok: true,
      user: {
        id: user._id,
        nombre: user.nombre,
        correo: user.correo,
        rol: user.rol,
      },
      token: sign(user),
    });
  } catch (e) {
    next(e);
  }
};
