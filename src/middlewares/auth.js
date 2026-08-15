const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    if (!token) return res.status(401).json({ ok: false, error: 'Token requerido' });
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    req.user = await User.findById(payload.id).select('-password');
    if (!req.user) return res.status(401).json({ ok: false, error: 'Usuario no encontrado' });
    next();
  } catch { res.status(401).json({ ok: false, error: 'Token inválido o expirado' }); }
};

const adminOnly = (req, res, next) => {
  if (req.user?.rol !== 'admin') return res.status(403).json({ ok: false, error: 'Permisos insuficientes' });
  next();
};

module.exports = { protect, adminOnly };
