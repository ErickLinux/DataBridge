const {
    executeMigration
} = require(
    '../services/migration/migrationService'
);

// Servicio para registrar el historial de migraciones
const {
    registrarMigracion
} = require('../services/historialService');


async function ejecutarMigracion(req, res) {

    try {

        const {
            postgresql,
            mongodb,
            transformationConfig
        } = req.body;


        /* =========================================
           VALIDAR POSTGRESQL
        ========================================= */

        if (
            !postgresql ||
            !postgresql.host ||
            !postgresql.port ||
            !postgresql.database ||
            !postgresql.user ||
            !postgresql.password
        ) {

            return res.status(400).json({
                success: false,
                message:
                    'La configuración de PostgreSQL está incompleta.'
            });

        }


        /* =========================================
           VALIDAR MONGODB
        ========================================= */

        if (
            !mongodb ||
            !mongodb.uri ||
            !mongodb.database
        ) {

            return res.status(400).json({
                success: false,
                message:
                    'La configuración de MongoDB está incompleta.'
            });

        }


        /* =========================================
           VALIDAR TRANSFORMACIÓN
        ========================================= */

        if (
            !transformationConfig ||
            !Array.isArray(
                transformationConfig.transformations
            ) ||
            transformationConfig
                .transformations
                .length === 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    'No existe una configuración de transformación válida.'
            });

        }


        /* =========================================
           EJECUTAR MIGRACIÓN
        ========================================= */

        const result =
            await executeMigration({

                postgresql,

                mongodb,

                transformationConfig

            });
            // REGISTRAR RESULTADO DE LA MIGRACIÓN EN EL HISTORIAL
            let historialId = null;
try {

    const datosMigracion = result.data || {};

    const historialGuardado = await registrarMigracion({

        usuarioId: req.usuario?.id ?? null,

        baseOrigen: postgresql.database,

        baseDestino: mongodb.database,

        fechaInicio: datosMigracion.startedAt || new Date(),

        totalRegistros: datosMigracion.migratedRecords ?? 0,

        estado: result.success
            ? 'COMPLETADA'
            : 'CON_ERRORES',

        observaciones: result.success
            ? 'Migración ejecutada sin errores de procesamiento. Pendiente de validación de integridad.'
            : JSON.stringify({
                mensaje: result.error || 'Migración con errores',
                errores: datosMigracion.errors || []
            })

    });historialId = historialGuardado.id;

} catch (historialError) {

    console.error(
        'No fue posible guardar el historial de migración:',
        historialError.message
    );

}


        if (!result.success) {

            return res.status(422).json({

                success: false,
                historialId: historialId,

                message:
                    result.error ||
                    'La migración finalizó con errores.',

                data:
                    result.data

            });

        }


        return res.status(200).json({

    success: true,

    message:
        'Migración ejecutada correctamente.',

    historialId: historialId,

    data: result.data

});


    } catch (error) {

        console.error(
            'Error al ejecutar migración:',
            error
        );


        return res.status(500).json({

            success: false,

            message:
                'Ocurrió un error interno durante la migración.',

            detail:
                error.message

        });

    }

}


module.exports = {
    ejecutarMigracion
};