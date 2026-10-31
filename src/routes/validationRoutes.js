
const express = require('express');
const router = express.Router();

const verificarToken = require('../middleware/authMiddleware');

const {
    ejecutarValidacion
} = require('../controllers/validationController');

router.post(
    '/ejecutar',
    verificarToken,
    ejecutarValidacion
);

module.exports = router;
