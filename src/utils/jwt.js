const jwt = require('jsonwebtoken');

const jwtSecret = () => {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
        throw new Error('JWT_SECRET debe tener al menos 32 caracteres');
    return process.env.JWT_SECRET;
};

const generateToken = (user) =>
    jwt.sign(
        { id: user._id, rol: user.rol },
        jwtSecret(),
        { expiresIn: '7d', algorithm: 'HS256' }
    );

module.exports = generateToken;
module.exports.jwtSecret = jwtSecret;
