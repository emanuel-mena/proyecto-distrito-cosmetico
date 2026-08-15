const jwt = require('jsonwebtoken');
module.exports = (user) => jwt.sign({ id: user._id, rol: user.rol }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
