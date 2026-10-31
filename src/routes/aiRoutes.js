
const express = require('express');
const router = express.Router();

const { analizarValidacion } = require('../controllers/aiController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/estado', (req, res) => {
    res.json({
        success: true,
        message: 'Módulo de inteligencia artificial disponible'
    });
});

// Análisis de IA: requiere usuario autenticado
router.post('/analizar', authMiddleware, analizarValidacion);

module.exports = router;
