const express =
    require('express');

const verificarToken =
    require('../middleware/authMiddleware');

const {
    generateTransformation
} = require(
    '../controllers/transformationController'
);


const router =
    express.Router();


router.post(
    '/generar',
    verificarToken,
    generateTransformation
);


module.exports =
    router;