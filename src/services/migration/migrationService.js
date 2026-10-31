const { Client } = require('pg');
const {
    MongoClient,
    Decimal128,
    Long
} = require('mongodb');


/* =========================================
   VALIDAR IDENTIFICADORES
========================================= */

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


/* =========================================
   CONVERTIR VALORES POSTGRESQL → MONGODB
========================================= */

function convertValue(value, strategy) {

    if (
        value === null ||
        value === undefined
    ) {
        return null;
    }


    switch (strategy) {

        case 'number': {

            const converted = Number(value);

            if (!Number.isFinite(converted)) {
                throw new Error(
                    `No fue posible convertir "${value}" a Number.`
                );
            }

            return converted;
        }


        case 'long':

            try {

                return Long.fromString(
                    String(value)
                );

            } catch (error) {

                throw new Error(
                    `No fue posible convertir "${value}" a Long.`
                );
            }


        case 'decimal128':

            try {

                return Decimal128.fromString(
                    String(value)
                );

            } catch (error) {

                throw new Error(
                    `No fue posible convertir "${value}" a Decimal128.`
                );
            }


        case 'boolean':

            return Boolean(value);


        case 'date': {

            const converted = new Date(value);

            if (
                Number.isNaN(
                    converted.getTime()
                )
            ) {
                throw new Error(
                    `No fue posible convertir "${value}" a Date.`
                );
            }

            return converted;
        }


        case 'object':

            if (typeof value === 'object') {
                return value;
            }

            try {

                return JSON.parse(value);

            } catch (error) {

                return value;
            }


        case 'array':

            return Array.isArray(value)
                ? value
                : [value];


        case 'string':
        default:

            return String(value);
    }
}


/* =========================================
   TRANSFORMAR REGISTRO
========================================= */

function transformRow(
    row,
    transformation
) {

    const document = {};


    transformation.fields.forEach(
        field => {

            const value =
                row[field.sourceColumn];


            document[field.destinationField] =
                convertValue(
                    value,
                    field.conversionStrategy
                );

        }
    );


    return document;
}

/* =========================================
   OBTENER TRANSFORMACIÓN DE UNA TABLA
========================================= */

function findTransformation(
    transformationConfig,
    tableName
) {

    return transformationConfig
        .transformations
        .find(
            transformation =>
                transformation.sourceTable ===
                tableName
        );

}


/* =========================================
   OBTENER REGISTRO RELACIONADO
========================================= */

async function getRelatedRow(
    pgClient,
    relationship,
    value
) {

    if (
        value === null ||
        value === undefined
    ) {
        return null;
    }


    const table =
        quoteIdentifier(
            relationship.referencedTable
        );


    const column =
        quoteIdentifier(
            relationship.referencedColumn
        );


    const query = `
        SELECT *
        FROM public.${table}
        WHERE ${column} = $1
        LIMIT 1
    `;


    const result =
        await pgClient.query(
            query,
            [value]
        );


    if (result.rows.length === 0) {
        return null;
    }


    return result.rows[0];
}


/* =========================================
   GENERAR NOMBRE DEL CAMPO EMBEBIDO
========================================= */

function getEmbeddedFieldName(
    relationship
) {

    /*
        categoria_id -> categoria
        cliente_id   -> cliente
        pedido_id    -> pedido
        producto_id  -> producto
    */

    if (
        relationship.sourceColumn
            .toLowerCase()
            .endsWith('_id')
    ) {

        return relationship
            .sourceColumn
            .slice(0, -3);

    }


    return (
        relationship.referencedTable +
        '_embedded'
    );
}


/* =========================================
   APLICAR RELACIONES
========================================= */

async function applyRelationships(
    pgClient,
    document,
    sourceRow,
    transformation,
    transformationConfig
) {

    if (
        !Array.isArray(
            transformation.relationships
        ) ||
        transformation.relationships.length === 0
    ) {

        return document;

    }


    for (
        const relationship
        of transformation.relationships
    ) {

        /*
            REFERENCIA

            La FK ya fue copiada por
            transformRow(), por lo que
            no necesitamos hacer nada más.
        */

        if (
            relationship.strategy ===
            'reference'
        ) {

            continue;

        }


        /*
            EMBEBIDO
        */

        if (
            relationship.strategy ===
            'embedded'
        ) {

            const foreignKeyValue =
                sourceRow[
                    relationship.sourceColumn
                ];


            if (
                foreignKeyValue === null ||
                foreignKeyValue === undefined
            ) {

                continue;

            }


            const referencedTransformation =
                findTransformation(
                    transformationConfig,
                    relationship.referencedTable
                );


            if (!referencedTransformation) {

                throw new Error(
                    `No existe configuración de transformación para ` +
                    `"${relationship.referencedTable}".`
                );

            }


            const relatedRow =
                await getRelatedRow(
                    pgClient,
                    relationship,
                    foreignKeyValue
                );


            if (!relatedRow) {

                throw new Error(
                    `No fue posible resolver la relación ` +
                    `${transformation.sourceTable}.` +
                    `${relationship.sourceColumn} → ` +
                    `${relationship.referencedTable}.` +
                    `${relationship.referencedColumn} ` +
                    `para el valor "${foreignKeyValue}".`
                );

            }


            /*
                Transformamos solamente los campos
                del registro relacionado.

                NO llamamos nuevamente a
                applyRelationships().

                De esta forma el embebido
                queda limitado a un nivel.
            */

            const embeddedDocument =
                transformRow(
                    relatedRow,
                    referencedTransformation
                );


            const embeddedField =
                getEmbeddedFieldName(
                    relationship
                );


            document[embeddedField] =
                embeddedDocument;

        }

    }


    return document;
}


/* =========================================
   EJECUTAR MIGRACIÓN
========================================= */

async function executeMigration({
    postgresql,
    mongodb,
    transformationConfig
}) {

    let pgClient;
    let mongoClient;


    const result = {

        startedAt: new Date(),
        finishedAt: null,

        totalTables: 0,
        totalRecords: 0,

        migratedRecords: 0,
        errors: [],

        collections: []

    };


    try {

        /* ===============================
           CONECTAR POSTGRESQL
        =============================== */

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


        /* ===============================
           CONECTAR MONGODB
        =============================== */

        mongoClient =
            new MongoClient(
                mongodb.uri,
                {
                    serverSelectionTimeoutMS: 5000,
                    connectTimeoutMS: 5000
                }
            );


        await mongoClient.connect();


        const mongoDatabase =
            mongoClient.db(
                mongodb.database
            );


        /* ===============================
           VALIDAR CONFIGURACIÓN
        =============================== */

        if (
            !transformationConfig ||
            !Array.isArray(
                transformationConfig.transformations
            )
        ) {

            throw new Error(
                'La configuración de transformación es inválida.'
            );

        }


        result.totalTables =
            transformationConfig
                .transformations
                .length;


        /* ===============================
           PROCESAR TABLAS
        =============================== */

        for (
            const transformation
            of transformationConfig.transformations
        ) {

            const tableName =
                transformation.sourceTable;

            const collectionName =
                transformation.destinationCollection;


            const tableResult = {

                sourceTable: tableName,
                destinationCollection:
                    collectionName,

                sourceRecords: 0,
                migratedRecords: 0,

                status: 'pending'

            };


            try {

                /* ===========================
                   LEER POSTGRESQL
                =========================== */

                const query = `
                    SELECT *
                    FROM public.${quoteIdentifier(
                        tableName
                    )}
                `;


                const pgResult =
                    await pgClient.query(query);


                tableResult.sourceRecords =
                    pgResult.rows.length;


                result.totalRecords +=
                    pgResult.rows.length;


                /* ===========================
                   TRANSFORMAR
                =========================== */

                const documents = [];


                        for (
                            const row
                            of pgResult.rows
                        ) {

                            const document =
                                transformRow(
                                    row,
                                    transformation
                                );


                            await applyRelationships(
                                pgClient,
                                document,
                                row,
                                transformation,
                                transformationConfig
                            );


                            documents.push(
                                document
                            );

                        }


                /* ===========================
                   INSERTAR EN MONGODB
                =========================== */

                const collection =
                    mongoDatabase.collection(
                        collectionName
                    );


                /*
                    Para esta primera versión,
                    limpiamos la colección destino
                    antes de insertar nuevamente.
                */

                await collection.deleteMany({});


                if (documents.length > 0) {

                    const insertResult =
                        await collection.insertMany(
                            documents,
                            {
                                ordered: true
                            }
                        );


                    tableResult.migratedRecords =
                        insertResult.insertedCount;


                    result.migratedRecords +=
                        insertResult.insertedCount;

                }


                tableResult.status =
                    'completed';


            } catch (error) {

                tableResult.status =
                    'error';


                result.errors.push({

                    table: tableName,

                    message:
                        error.message

                });

            }


            result.collections.push(
                tableResult
            );

        }


        result.finishedAt =
            new Date();


        return {

            success:
                result.errors.length === 0,

            data:
                result

        };


    } catch (error) {

        result.finishedAt =
            new Date();


        return {

            success: false,

            error:
                error.message,

            data:
                result

        };


    } finally {

        if (pgClient) {

            try {
                await pgClient.end();
            } catch (error) {}

        }


        if (mongoClient) {

            try {
                await mongoClient.close();
            } catch (error) {}

        }

    }

}



module.exports = {
    executeMigration,
    convertValue,
    transformRow,
    applyRelationships
};
