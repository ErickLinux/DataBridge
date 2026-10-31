const express =
    require('express');

const router =
    express.Router();

const verificarToken =
    require(
        '../middleware/authMiddleware'
    );

const {
    ejecutarMigracion
} = require(
    '../controllers/migrationController'
);


router.post(
    '/ejecutar',
    verificarToken,
    ejecutarMigracion
);


module.exports = router;