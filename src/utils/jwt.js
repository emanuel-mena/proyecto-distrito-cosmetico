const jwt = require('jsonwebtoken');

const generateToken = (user) =>
    jwt.sign(
        { id: user._id, rol: user.rol },
        process.env.JWT_SECRET || 'dev-secret',
        { expiresIn: '7d' }
    );

module.exports = generateToken;