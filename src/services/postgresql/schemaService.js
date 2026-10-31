const { Client } = require('pg');

async function analyzePostgreSQLSchema(config) {

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

        /* =====================================
           TABLAS
        ===================================== */

        const tablesResult = await client.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        `);


        /* =====================================
           COLUMNAS
        ===================================== */

        const columnsResult = await client.query(`
            SELECT
                table_name,
                column_name,
                data_type,
                udt_name,
                is_nullable,
                column_default,
                ordinal_position
            FROM information_schema.columns
            WHERE table_schema = 'public'
            ORDER BY table_name, ordinal_position;
        `);


        /* =====================================
           CLAVES PRIMARIAS
        ===================================== */

        const primaryKeysResult = await client.query(`
            SELECT
                tc.table_name,
                kcu.column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
            WHERE tc.constraint_type = 'PRIMARY KEY'
              AND tc.table_schema = 'public'
            ORDER BY tc.table_name, kcu.ordinal_position;
        `);


        /* =====================================
           CLAVES FORÁNEAS
        ===================================== */

        const foreignKeysResult = await client.query(`
            SELECT
                tc.constraint_name,
                tc.table_name,
                kcu.column_name,
                ccu.table_name AS referenced_table,
                ccu.column_name AS referenced_column
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage ccu
                ON tc.constraint_name = ccu.constraint_name
                AND tc.table_schema = ccu.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY'
              AND tc.table_schema = 'public'
            ORDER BY tc.table_name, kcu.column_name;
        `);


        /* =====================================
           ORGANIZAR ESTRUCTURA
        ===================================== */

        const tables = tablesResult.rows.map(
            table => {

                const tableName =
                    table.table_name;


                const columns =
                    columnsResult.rows
                        .filter(
                            column =>
                                column.table_name ===
                                tableName
                        )
                        .map(
                            column => {

                                const isPrimaryKey =
                                    primaryKeysResult.rows.some(
                                        pk =>
                                            pk.table_name ===
                                                tableName &&
                                            pk.column_name ===
                                                column.column_name
                                    );


                                const foreignKey =
                                    foreignKeysResult.rows.find(
                                        fk =>
                                            fk.table_name ===
                                                tableName &&
                                            fk.column_name ===
                                                column.column_name
                                    );


                                return {

                                    name:
                                        column.column_name,

                                    dataType:
                                        column.data_type,

                                    udtName:
                                        column.udt_name,

                                    nullable:
                                        column.is_nullable ===
                                        'YES',

                                    defaultValue:
                                        column.column_default,

                                    primaryKey:
                                        isPrimaryKey,

                                    foreignKey:
                                        foreignKey
                                            ? {
                                                constraint:
                                                    foreignKey.constraint_name,

                                                referencedTable:
                                                    foreignKey.referenced_table,

                                                referencedColumn:
                                                    foreignKey.referenced_column
                                            }
                                            : null

                                };

                            }
                        );


                return {
                    name: tableName,
                    columns
                };

            }
        );


        return {

            success: true,

            schema: 'public',

            database:
                config.database,

            totalTables:
                tables.length,

            tables

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
            // La conexión pudo no establecerse.
        }

    }

}


module.exports = {
    analyzePostgreSQLSchema
};