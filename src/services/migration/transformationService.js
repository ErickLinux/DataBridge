function mapPostgreSQLType(column) {

    const type =
        String(column.dataType || '')
            .toLowerCase();

    const udt =
        String(column.udtName || '')
            .toLowerCase();


    if (
        type === 'smallint' ||
        type === 'integer'
    ) {
        return {
            mongoType: 'Number',
            strategy: 'number'
        };
    }


    if (type === 'bigint') {
        return {
            mongoType: 'Long',
            strategy: 'long'
        };
    }


    if (
        type === 'numeric' ||
        type === 'decimal'
    ) {
        return {
            mongoType: 'Decimal128',
            strategy: 'decimal128'
        };
    }


    if (
        type === 'real' ||
        type === 'double precision'
    ) {
        return {
            mongoType: 'Number',
            strategy: 'number'
        };
    }


    if (
        type === 'character varying' ||
        type === 'character' ||
        type === 'text'
    ) {
        return {
            mongoType: 'String',
            strategy: 'string'
        };
    }


    if (type === 'boolean') {
        return {
            mongoType: 'Boolean',
            strategy: 'boolean'
        };
    }


    if (
        type === 'date' ||
        type.includes('timestamp')
    ) {
        return {
            mongoType: 'Date',
            strategy: 'date'
        };
    }


    if (type.includes('time')) {
        return {
            mongoType: 'String',
            strategy: 'string'
        };
    }


    if (type === 'uuid') {
        return {
            mongoType: 'String',
            strategy: 'string'
        };
    }


    if (
        type === 'json' ||
        type === 'jsonb'
    ) {
        return {
            mongoType: 'Object',
            strategy: 'object'
        };
    }


    if (
        type === 'array' ||
        udt.startsWith('_')
    ) {
        return {
            mongoType: 'Array',
            strategy: 'array'
        };
    }


    return {
        mongoType: 'String',
        strategy: 'string',
        warning:
            `El tipo PostgreSQL "${column.dataType}" ` +
            'no tiene una regla específica y será tratado como String.'
    };
}


function buildTransformationProposal(
    schemaData,
    selectedTables
) {

    if (
        !schemaData ||
        !Array.isArray(schemaData.tables)
    ) {
        throw new Error(
            'El esquema PostgreSQL no es válido.'
        );
    }


    if (
        !Array.isArray(selectedTables) ||
        selectedTables.length === 0
    ) {
        throw new Error(
            'Debe seleccionar al menos una tabla.'
        );
    }


    const availableTables =
        new Map(
            schemaData.tables.map(
                table => [
                    table.name,
                    table
                ]
            )
        );


    const transformations = [];


    for (const tableName of selectedTables) {

        const table =
            availableTables.get(tableName);


        if (!table) {

            throw new Error(
                `La tabla "${tableName}" no existe ` +
                'en el esquema analizado.'
            );

        }


        const fields =
            table.columns.map(
                column => {

                    const mapping =
                        mapPostgreSQLType(column);


                    return {

                        sourceColumn:
                            column.name,

                        sourceType:
                            column.dataType,

                        destinationField:
                            column.name,

                        mongoType:
                            mapping.mongoType,

                        conversionStrategy:
                            mapping.strategy,

                        nullable:
                            column.nullable,

                        primaryKey:
                            column.primaryKey,

                        foreignKey:
                            column.foreignKey,

                        warning:
                            mapping.warning || null

                    };

                }
            );


        const relationships =
            table.columns
                .filter(
                    column =>
                        column.foreignKey
                )
                .map(
                    column => {

                        const targetSelected =
                            selectedTables.includes(
                                column.foreignKey
                                    .referencedTable
                            );


                        return {

                            sourceColumn:
                                column.name,

                            referencedTable:
                                column.foreignKey
                                    .referencedTable,

                            referencedColumn:
                                column.foreignKey
                                    .referencedColumn,

                            constraint:
                                column.foreignKey
                                    .constraint,

                            targetSelected,

                            strategy:
                                'reference'

                        };

                    }
                );


        transformations.push({

            sourceTable:
                table.name,

            destinationCollection:
                table.name,

            fields,

            relationships

        });

    }


    return {

        totalTables:
            transformations.length,

        transformations

    };

}


module.exports = {
    mapPostgreSQLType,
    buildTransformationProposal
};