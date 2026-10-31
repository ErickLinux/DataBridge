const {
    testPostgreSQLConnection
} = require('../services/postgresql/connectionService');

const {
    testMongoDBConnection
} = require('../services/mongodb/connectionService');

const {
    analyzePostgreSQLSchema
} = require('../services/postgresql/schemaService');


/* ========================================
   POSTGRESQL
======================================== */

async function testPostgreSQL(req, res) {

    try {

        const {
            host,
            port,
            database,
            user,
            password
        } = req.body;


        if (
            !host ||
            !port ||
            !database ||
            !user ||
            password === undefined
        ) {

            return res.status(400).json({
                success: false,
                message:
                    'Todos los datos de conexión PostgreSQL son obligatorios.'
            });

        }


        const result =
            await testPostgreSQLConnection({
                host,
                port,
                database,
                user,
                password
            });


        if (!result.success) {

            return res.status(400).json({
                success: false,
                message:
                    'No fue posible establecer conexión con PostgreSQL.',
                detail: result.error
            });

        }


        return res.json({
            success: true,
            message:
                'Conexión con PostgreSQL establecida correctamente.',
            info: result.info
        });


    } catch (error) {

        console.error(
            'Error al probar PostgreSQL:',
            error
        );


        return res.status(500).json({
            success: false,
            message:
                'Error interno al probar la conexión PostgreSQL.'
        });

    }

}


/* ========================================
   MONGODB
======================================== */

async function testMongoDB(req, res) {

    try {

        const {
            uri,
            database
        } = req.body;


        if (!uri || !database) {

            return res.status(400).json({
                success: false,
                message:
                    'La URI y la base de datos MongoDB son obligatorias.'
            });

        }


        const result =
            await testMongoDBConnection({
                uri,
                database
            });


        if (!result.success) {

            return res.status(400).json({
                success: false,
                message:
                    'No fue posible establecer conexión con MongoDB.',
                detail: result.error
            });

        }


        return res.json({
            success: true,
            message:
                'Conexión con MongoDB establecida correctamente.',
            info: result.info
        });


    } catch (error) {

        console.error(
            'Error al probar MongoDB:',
            error
        );


        return res.status(500).json({
            success: false,
            message:
                'Error interno al probar la conexión MongoDB.'
        });

    }

}


async function analyzePostgreSQL(req, res) {

    try {

        const {
            host,
            port,
            database,
            user,
            password
        } = req.body;


        if (
            !host ||
            !port ||
            !database ||
            !user ||
            password === undefined
        ) {

            return res.status(400).json({
                success: false,
                message:
                    'Los datos de conexión PostgreSQL son obligatorios.'
            });

        }


        const result =
            await analyzePostgreSQLSchema({
                host,
                port,
                database,
                user,
                password
            });


        if (!result.success) {

            return res.status(400).json({
                success: false,
                message:
                    'No fue posible analizar el esquema PostgreSQL.',
                detail: result.error
            });

        }


        return res.json({
            success: true,
            message:
                'Esquema PostgreSQL analizado correctamente.',
            data: result
        });


    } catch (error) {

        console.error(
            'Error al analizar esquema PostgreSQL:',
            error
        );


        return res.status(500).json({
            success: false,
            message:
                'Error interno al analizar el esquema PostgreSQL.'
        });

    }

}

module.exports = {
    testPostgreSQL,
    testMongoDB,
    analyzePostgreSQL
};