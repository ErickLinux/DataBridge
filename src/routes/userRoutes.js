const express = require('express');
const verificarToken = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/perfil', verificarToken, (req, res) => {
    res.json({
        success: true,
        message: 'Acceso autorizado.',
        usuario: req.usuario
    });
});

module.exports = router;