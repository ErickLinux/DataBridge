const { pool } = require('../config/database');
async function obtenerHistorial() {
    const resultado = await pool.query(`
        SELECT *
        FROM historial_migraciones
        ORDER BY fecha_inicio DESC, id DESC
    `);

    return resultado.rows;
}

// Registrar una migración en el historial
async function registrarMigracion(datos) {

    const consulta = `
        INSERT INTO historial_migraciones (
            usuario_id,
            base_origen,
            base_destino,
            fecha_inicio,
            fecha_fin,
            total_registros,
            estado,
            observaciones
        )
        VALUES (
            $1, $2, $3, $4, CURRENT_TIMESTAMP,
            $5, $6, $7
        )
        RETURNING id
    `;

    const valores = [
        datos.usuarioId ?? null,
        datos.baseOrigen,
        datos.baseDestino,
        datos.fechaInicio,
        datos.totalRegistros ?? 0,
        datos.estado,
        datos.observaciones ?? null
    ];

    const resultado = await pool.query(
        consulta,
        valores
    );

    return resultado.rows[0];
}

// Guardar los resultados de validación de una migración
async function actualizarValidacionMigracion(
    idMigracion,
    validacion,
    usuarioId,
    baseOrigen,
    baseDestino
) {

    const contenido = validacion.contentValidation;

    if (!contenido) {
        throw new Error(
            'No se recibieron resultados de integridad.'
        );
    }

    const consulta = `
        UPDATE historial_migraciones
        SET
            fecha_validacion = CURRENT_TIMESTAMP,
            registros_correctos = $1,
            registros_inconsistentes = $2,
            registros_faltantes = $3,
            porcentaje_integridad = $4,
            detalle_validacion = $5::jsonb
        WHERE id = $6
  AND usuario_id = $7
  AND base_origen = $8
  AND base_destino = $9
RETURNING id, porcentaje_integridad, fecha_validacion
    `;

    const valores = [
        contenido.totalCorrect ?? 0,
        contenido.totalInconsistent ?? 0,
        contenido.totalMissing ?? 0,
        contenido.integrityPercentage ?? null,
        JSON.stringify(validacion),
idMigracion,
usuarioId,
baseOrigen,
baseDestino
    ];

    const resultado = await pool.query(consulta, valores);

    if (resultado.rowCount === 0) {
        throw new Error(
            'No se encontró la migración en el historial.'
        );
    }

    return resultado.rows[0];
}
// Cada validación independiente se almacena como un registro nuevo.
// No altera las colecciones de MongoDB ni actualiza reportes anteriores.
async function registrarValidacionIndependiente(usuarioId, baseOrigen, baseDestino, validacion) {
    const contenido = validacion.contentValidation;
    if (!contenido) throw new Error('No se recibieron resultados de integridad.');

    const consulta = `
        INSERT INTO historial_migraciones (
            usuario_id, base_origen, base_destino,
            fecha_inicio, fecha_fin, total_registros, estado, observaciones,
            fecha_validacion, registros_correctos, registros_inconsistentes,
            registros_faltantes, porcentaje_integridad, detalle_validacion
        ) VALUES (
            $1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $4,
            'VALIDACION_INDEPENDIENTE', $5,
            CURRENT_TIMESTAMP, $6, $7, $8, $9, $10::jsonb
        ) RETURNING id, fecha_validacion
    `;
    const valores = [
        usuarioId, baseOrigen, baseDestino,
        validacion.totalSource ?? (Number(contenido.totalCorrect || 0) + Number(contenido.totalInconsistent || 0) + Number(contenido.totalMissing || 0)),
        'Validación independiente; no se ejecutó una migración.',
        contenido.totalCorrect ?? 0,
        contenido.totalInconsistent ?? 0,
        contenido.totalMissing ?? 0,
        contenido.integrityPercentage ?? null,
        JSON.stringify(validacion)
    ];
    const resultado = await pool.query(consulta, valores);
    return resultado.rows[0];
}

module.exports = {
    obtenerHistorial,
    registrarMigracion,
    actualizarValidacionMigracion,
    registrarValidacionIndependiente
};