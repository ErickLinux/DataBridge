
const { Client } = require('pg');
const { MongoClient } = require('mongodb');

/*
  Proteger los nombres de tablas SQL.
*/
function quoteIdentifier(identifier) {
    if (
        typeof identifier !== 'string' ||
        identifier.trim() === ''
    ) {
        throw new Error(
            'Se recibió un identificador SQL inválido.'
        );
    }

    return `"${identifier.replaceAll('"', '""')}"`;
}

/*
  VALIDACIÓN DE CANTIDAD DE REGISTROS
*/
async function validateRecordCounts({
    postgresql,
    mongodb,
    transformationConfig
}) {
    let pgClient;
    let mongoClient;

    const results = [];

    try {
        if (
            !postgresql?.host ||
            !postgresql?.database ||
            !postgresql?.user ||
            !postgresql?.password
        ) {
            throw new Error(
                'Configuración de PostgreSQL incompleta.'
            );
        }

        if (
            !mongodb?.uri ||
            !mongodb?.database
        ) {
            throw new Error(
                'Configuración de MongoDB incompleta.'
            );
        }

        const transformations =
            transformationConfig?.transformations;

        if (
            !Array.isArray(transformations) ||
            transformations.length === 0
        ) {
            throw new Error(
                'No existen tablas para validar.'
            );
        }

        pgClient = new Client({
            host: postgresql.host,
            port: Number(postgresql.port),
            database: postgresql.database,
            user: postgresql.user,
            password: postgresql.password,
            ssl: String(postgresql.host || '').trim().toLowerCase().endsWith('.neon.tech')
                ? { rejectUnauthorized: true }
                : false,
            connectionTimeoutMillis: 5000
        });

        await pgClient.connect();

        mongoClient = new MongoClient(
            mongodb.uri,
            {
                serverSelectionTimeoutMS: 5000
            }
        );

        await mongoClient.connect();

        const mongoDb = mongoClient.db(
            mongodb.database
        );

        let totalSource = 0;
        let totalDestination = 0;
        let correctTables = 0;

        for (const transformation of transformations) {
            const table = transformation.sourceTable;
            const collection =
                transformation.destinationCollection;

            if (
                typeof collection !== 'string' ||
                !collection.trim()
            ) {
                throw new Error(
                    'Nombre de colección inválido.'
                );
            }

            const query = `
                SELECT COUNT(*) AS total
                FROM public.${quoteIdentifier(table)}
            `;

            const pgResult = await pgClient.query(query);

            const sourceCount = Number(
                pgResult.rows[0].total
            );

            const destinationCount =
                await mongoDb
                    .collection(collection)
                    .countDocuments({});

            const matches =
                sourceCount === destinationCount;

            if (matches) {
                correctTables++;
            }

            totalSource += sourceCount;
            totalDestination += destinationCount;

            results.push({
                table,
                collection,
                sourceCount,
                destinationCount,
                difference:
                    sourceCount - destinationCount,
                status: matches
                    ? 'CORRECTO'
                    : 'INCONSISTENTE'
            });
        }

        return {
            success: true,
            validationType: 'record_count',
            totalTables: transformations.length,
            correctTables,
            totalSource,
            totalDestination,
            countValidationPassed:
                correctTables === transformations.length,
            results
        };

    } catch (error) {
        throw new Error(
            `Error durante la validación: ${error.message}`
        );

    } finally {
        if (pgClient) {
            await pgClient.end();
        }

        if (mongoClient) {
            await mongoClient.close();
        }
    }
}


/* =========================================
   VALIDACIÓN DE CONTENIDO
========================================= */

const {
    transformRow,
    applyRelationships
} = require('../migration/migrationService');

function normalizeValue(value) {
    if (value === null || value === undefined) {
        return null;
    }

    if (value instanceof Date) {
        return { type: 'Date', value: value.toISOString() };
    }

    if (value._bsontype === 'Decimal128') {
        return { type: 'Decimal128', value: value.toString() };
    }

    if (value._bsontype === 'Long') {
        return { type: 'Long', value: value.toString() };
    }

    if (Array.isArray(value)) {
        return value.map(normalizeValue);
    }

    if (typeof value === 'object') {
        const normalized = {};

        for (const key of Object.keys(value).sort()) {
            if (key !== '_id') {
                normalized[key] = normalizeValue(value[key]);
            }
        }

        return normalized;
    }

    return value;
}

function compareDocuments(expected, actual, path = '') {
    const differences = [];

    for (const field of Object.keys(expected)) {
        const fieldPath = path ? `${path}.${field}` : field;

        if (!Object.prototype.hasOwnProperty.call(actual, field)) {
            differences.push({
                field: fieldPath,
                type: 'MISSING_FIELD'
            });
            continue;
        }

        const expectedValue = normalizeValue(expected[field]);
        const actualValue = normalizeValue(actual[field]);

        if (JSON.stringify(expectedValue) !== JSON.stringify(actualValue)) {
            differences.push({
                field: fieldPath,
                type: 'VALUE_MISMATCH',
                expected: expectedValue,
                actual: actualValue
            });
        }
    }

    for (const field of Object.keys(actual)) {
        if (
            field !== '_id' &&
            !Object.prototype.hasOwnProperty.call(expected, field)
        ) {
            differences.push({
                field: path ? `${path}.${field}` : field,
                type: 'EXTRA_FIELD'
            });
        }
    }

    return differences;
}

async function validateRecordContent({
    postgresql,
    mongodb,
    transformationConfig
}) {
    let pgClient;
    let mongoClient;

    const results = [];
    let totalVerified = 0;
    let totalCorrect = 0;
    let totalInconsistent = 0;
    let totalMissing = 0;
    let totalUnverified = 0;

    try {
        if (
            !postgresql?.host ||
            !postgresql?.database ||
            !postgresql?.user ||
            !postgresql?.password ||
            !mongodb?.uri ||
            !mongodb?.database ||
            !Array.isArray(transformationConfig?.transformations) ||
            transformationConfig.transformations.length === 0
        ) {
            throw new Error('Configuración de validación incompleta.');
        }

        pgClient = new Client({
            host: postgresql.host,
            port: Number(postgresql.port),
            database: postgresql.database,
            user: postgresql.user,
            password: postgresql.password,
            ssl: String(postgresql.host || '').trim().toLowerCase().endsWith('.neon.tech')
                ? { rejectUnauthorized: true }
                : false,
            connectionTimeoutMillis: 5000
        });

        await pgClient.connect();

        mongoClient = new MongoClient(mongodb.uri, {
            serverSelectionTimeoutMS: 5000
        });

        await mongoClient.connect();

        const mongoDb = mongoClient.db(mongodb.database);

        for (const transformation of transformationConfig.transformations) {
            const tableName = transformation.sourceTable;
            const collectionName = transformation.destinationCollection;

            const tableResult = {
                table: tableName,
                collection: collectionName,
                verified: 0,
                correct: 0,
                inconsistent: 0,
                missing: 0,
                unverified: 0,
                errors: [],
                status: 'PENDING'
            };

            results.push(tableResult);

            const primaryKeys = transformation.fields.filter(
                field => field.primaryKey === true
            );

            if (primaryKeys.length === 0) {
                tableResult.status = 'NOT_VERIFIABLE';
                tableResult.reason = 'La tabla no tiene clave primaria configurada.';
                continue;
            }

            const quotedTable = `"${String(tableName).replaceAll('"', '""')}"`;

            const source = await pgClient.query(
                `SELECT * FROM public.${quotedTable}`
            );

            const collection = mongoDb.collection(collectionName);

            for (const row of source.rows) {
                const key = {};
                const keyDescription = {};

                for (const field of primaryKeys) {
                    const convertedKey = transformRow(row, {
                        fields: [field]
                    });

                    key[field.destinationField] =
                        convertedKey[field.destinationField];

                    keyDescription[field.sourceColumn] =
                        String(row[field.sourceColumn]);
                }

                const expected = transformRow(row, transformation);

                await applyRelationships(
                    pgClient,
                    expected,
                    row,
                    transformation,
                    transformationConfig
                );

                const matches = await collection
                    .find(key)
                    .limit(2)
                    .toArray();

                tableResult.verified++;
                totalVerified++;

                if (matches.length === 0) {
                    tableResult.missing++;
                    totalMissing++;

                    if (tableResult.errors.length < 50) {
                        tableResult.errors.push({
                            key: keyDescription,
                            type: 'MISSING_RECORD'
                        });
                    }

                    continue;
                }

                if (matches.length > 1) {
                    tableResult.inconsistent++;
                    totalInconsistent++;

                    if (tableResult.errors.length < 50) {
                        tableResult.errors.push({
                            key: keyDescription,
                            type: 'DUPLICATE_KEY'
                        });
                    }

                    continue;
                }

                const differences = compareDocuments(
                    expected,
                    matches[0]
                );

                if (differences.length === 0) {
                    tableResult.correct++;
                    totalCorrect++;
                } else {
                    tableResult.inconsistent++;
                    totalInconsistent++;

                    if (tableResult.errors.length < 50) {
                        tableResult.errors.push({
                            key: keyDescription,
                            type: 'CONTENT_MISMATCH',
                            differences
                        });
                    }
                }
            }

            tableResult.status =
                tableResult.missing === 0 &&
                tableResult.inconsistent === 0
                    ? 'CORRECTO'
                    : 'INCONSISTENTE';
        }

        const unverifiedTables = results.filter(
            item => item.status === 'NOT_VERIFIABLE'
        ).length;

        const percentage = totalVerified > 0
            ? Number(
                ((totalCorrect / totalVerified) * 100).toFixed(2)
            )
            : null;

        return {
            success: true,
            validationType: 'record_content',
            totalVerified,
            totalCorrect,
            totalInconsistent,
            totalMissing,
            totalUnverified,
            unverifiedTables,
            integrityPercentage: percentage,
            contentValidationPassed:
                totalInconsistent === 0 &&
                totalMissing === 0 &&
                unverifiedTables === 0,
            results
        };

    } finally {
        if (pgClient) {
            await pgClient.end();
        }

        if (mongoClient) {
            await mongoClient.close();
        }
    }
}


module.exports = {
    validateRecordCounts,
    validateRecordContent
};
