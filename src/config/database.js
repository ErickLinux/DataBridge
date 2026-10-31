
const { Pool } = require('pg');

const usarSSL = process.env.APP_DB_SSL === 'true';

const pool = new Pool({
    host: process.env.APP_DB_HOST,
    port: Number(process.env.APP_DB_PORT || 5432),
    database: process.env.APP_DB_NAME,
    user: process.env.APP_DB_USER,
    password: process.env.APP_DB_PASSWORD,

    ssl: usarSSL
        ? { rejectUnauthorized: true }
        : false
});

async function connectDatabase() {
    let client;

    try {
        client = await pool.connect();

        const result = await client.query(
            'SELECT current_database() AS database, NOW() AS fecha'
        );

        console.log(
            `PostgreSQL conectado correctamente: ${result.rows[0].database}`
        );

    } catch (error) {
        console.error('Error al conectar con PostgreSQL:');
        console.error(error.message);
        throw error;

    } finally {
        if (client) {
            client.release();
        }
    }
}

module.exports = {
    pool,
    connectDatabase
};
