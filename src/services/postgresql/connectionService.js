const { Client } = require('pg');

async function testPostgreSQLConnection(config) {

    const client = new Client({
        host: config.host,
        port: Number(config.port),
        database: config.database,
        user: config.user,
        password: config.password,
        connectionTimeoutMillis: 5000
    });

    try {

        await client.connect();

        const result = await client.query(`
            SELECT
                current_database() AS database,
                current_user AS usuario,
                version() AS version
        `);

        return {
            success: true,
            info: result.rows[0]
        };

    } catch (error) {

        return {
            success: false,
            error: error.message
        };

    } finally {

        try {
            await client.end();
        } catch (error) {
            // La conexión pudo no haberse establecido.
        }

    }
}

module.exports = {
    testPostgreSQLConnection
};