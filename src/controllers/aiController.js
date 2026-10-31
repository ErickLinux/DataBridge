const { analizarInconsistencias } = require('../services/aiService');

// Aceptar solamente metadatos técnicos; nunca valores de registros ni credenciales.
function textoSeguro(valor, maximo = 120) {
    return typeof valor === 'string' ? valor.slice(0, maximo) : '';
}
function numeroSeguro(valor) {
    const numero = Number(valor);
    return Number.isFinite(numero) && numero >= 0 ? numero : 0;
}

async function analizarValidacion(req, res) {
    try {
        const { validacion } = req.body || {};
        if (!validacion || typeof validacion !== 'object' || Array.isArray(validacion)) {
            return res.status(400).json({ success: false, message: 'Debes proporcionar los resultados de validación.' });
        }
        const contenido = validacion.contentValidation;
        if (!contenido || typeof contenido !== 'object' || Array.isArray(contenido)) {
            return res.status(400).json({ success: false, message: 'No se encontraron resultados de integridad.' });
        }

        const tablas = Array.isArray(contenido.results) ? contenido.results.slice(0, 30) : [];
        const resumen = {
            registrosCorrectos: numeroSeguro(contenido.totalCorrect),
            registrosInconsistentes: numeroSeguro(contenido.totalInconsistent),
            registrosFaltantes: numeroSeguro(contenido.totalMissing),
            porcentajeIntegridad: contenido.integrityPercentage == null ? null : numeroSeguro(contenido.integrityPercentage),
            tablas: tablas.map(tabla => ({
                tabla: textoSeguro(tabla.table),
                estado: textoSeguro(tabla.status, 40),
                verificados: numeroSeguro(tabla.verified),
                correctos: numeroSeguro(tabla.correct),
                errores: (Array.isArray(tabla.errors) ? tabla.errors : []).slice(0, 15).map(error => ({
                    tipo: textoSeguro(error.type, 40),
                    diferencias: (Array.isArray(error.differences) ? error.differences : []).slice(0, 15).map(diferencia => ({
                        campo: textoSeguro(diferencia.field),
                        tipo: textoSeguro(diferencia.type, 40)
                    }))
                }))
            }))
        };
        const analisis = await analizarInconsistencias(resumen);
        return res.status(200).json({ success: true, message: 'Análisis generado correctamente.', data: { analisis } });
    } catch (error) {
        console.error('Error al generar análisis de IA:', error.message);
        return res.status(500).json({ success: false, message: 'No fue posible generar el análisis con IA.' });
    }
}

module.exports = { analizarValidacion };
