const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {
    const authorization = req.headers.authorization;

    // Verificar que exista el encabezado Authorization
    if (!authorization || !authorization.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Token de autenticación requerido.'
        });
    }

    // Extraer el token
    const token = authorization.split(' ')[1];

    try {
        // Verificar que el token sea válido
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Guardar los datos del usuario en la petición
        req.usuario = decoded;

        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Token inválido o expirado.'
        });
    }
}

module.exports = verificarToken;