const express = require('express');
const verificarToken = require('../middleware/authMiddleware');

const historialController = require('../controllers/historialController');

const router = express.Router();

// Consultar historial de migraciones
// Solo usuarios autenticados
router.get(
    '/',
    verificarToken,
    historialController.obtenerHistorial
);

module.exports = router;