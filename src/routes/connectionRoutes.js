const express = require('express');

const verificarToken =
    require('../middleware/authMiddleware');

const {
    testPostgreSQL,
    testMongoDB,
    analyzePostgreSQL
} = require('../controllers/connectionController');


const router = express.Router();


router.post(
    '/postgresql/probar',
    verificarToken,
    testPostgreSQL
);


router.post(
    '/mongodb/probar',
    verificarToken,
    testMongoDB
);

router.post(
    '/postgresql/esquema',
    verificarToken,
    analyzePostgreSQL
);


module.exports = router;