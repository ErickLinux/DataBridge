const { MongoClient } = require('mongodb');


async function testMongoDBConnection(config) {

    let client;

    try {

        const uri = config.uri.trim();
        const database = config.database.trim();

        client = new MongoClient(uri, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000
        });


        // Intentar conexión
        await client.connect();


        // Seleccionar base de datos
        const db = client.db(database);


        // Verificar comunicación con MongoDB
        await db.command({
            ping: 1
        });


        return {
            success: true,
            info: {
                database: database
            }
        };


    } catch (error) {

        return {
            success: false,
            error: error.message
        };


    } finally {

        if (client) {

            try {
                await client.close();
            } catch (error) {
                // Ignorar error al cerrar conexión
            }

        }

    }

}


module.exports = {
    testMongoDBConnection
};