const {
    validateRecordCounts,
    validateRecordContent
} = require('../services/validation/validationService');

const {
    actualizarValidacionMigracion,
    registrarValidacionIndependiente
} = require('../services/historialService');

const { pool } = require('../config/database');

async function ejecutarValidacion(req, res) {
    try {
        const {
    postgresql,
    mongodb,
    transformationConfig,
    historialId
} = req.body;

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
                message: 'Configuración PostgreSQL incompleta.'
            });
        }

        if (
            !mongodb ||
            !mongodb.uri ||
            !mongodb.database
        ) {
            return res.status(400).json({
                success: false,
                message: 'Configuración MongoDB incompleta.'
            });
        }

        if (
            !Array.isArray(transformationConfig?.transformations) ||
            transformationConfig.transformations.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message: 'Configuración de transformación inválida.'
            });
        }

        // La validación independiente no envía historialId.
        const guardarEnHistorial = historialId !== undefined &&
            historialId !== null && historialId !== '';

        let idValidado = null;

        if (guardarEnHistorial) {
            const id = Number(historialId);
            if (!Number.isSafeInteger(id) || id <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Identificador de historial inválido.'
                });
            }

            const usuarioId = req.usuario?.id;
            if (!usuarioId) {
                return res.status(403).json({
                    success: false,
                    message: 'No se pudo identificar al usuario del historial.'
                });
            }

            // Comprobar pertenencia y bases de datos antes de asociar resultados.
            const historial = await pool.query(`
                SELECT id
                FROM historial_migraciones
                WHERE id = $1
                  AND usuario_id = $2
                  AND base_origen = $3
                  AND base_destino = $4
                LIMIT 1
            `, [id, usuarioId, postgresql.database, mongodb.database]);

            if (historial.rowCount === 0) {
                return res.status(403).json({
                    success: false,
                    message: 'El historial no corresponde al usuario y bases indicados.'
                });
            }

            idValidado = id;
        }

        const resultado = await validateRecordCounts({
            postgresql,
            mongodb,
            transformationConfig
        });

        const contenido = await validateRecordContent({
            postgresql,
            mongodb,
            transformationConfig
        });
        const validacion = {
            ...resultado,
            contentValidation: contenido
        };

        let historialActualizado = false;
        let reporteId = null;
        if (idValidado !== null) {
            await actualizarValidacionMigracion(
                idValidado,
                validacion,
                req.usuario.id,
                postgresql.database,
                mongodb.database
            );
            historialActualizado = true;
        } else {
            const usuarioId = req.usuario?.id;
            if (!usuarioId) {
                return res.status(403).json({ success: false, message: 'Sesión sin usuario válido.' });
            }
            const guardado = await registrarValidacionIndependiente(
                usuarioId, postgresql.database, mongodb.database, validacion
            );
            reporteId = guardado.id;
            historialActualizado = true;
        }

        return res.status(200).json({
            success: true,
            message: 'Validación de cantidades y contenido finalizada.',
            historialActualizado,
            reporteId,
            data: validacion
        });

    } catch (error) {
        console.error('Error de validación:', error);
        return res.status(500).json({
            success: false,
            message: 'No fue posible completar la validación.'
        });
    }
}

module.exports = {
    ejecutarValidacion
};
