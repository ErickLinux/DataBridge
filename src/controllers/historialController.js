const historialService = require('../services/historialService');

// Obtener historial de migraciones
async function obtenerHistorial(req, res) {
    try {

        const historial = await historialService.obtenerHistorial();

        return res.status(200).json({
            success: true,
            message: 'Historial obtenido correctamente',
            total: historial.length,
            data: historial
        });

    } catch (error) {

        console.error(
            'Error al obtener historial de migraciones:',
            error.message
        );

        return res.status(500).json({
            success: false,
            message: 'No fue posible obtener el historial de migraciones'
        });

    }
}

module.exports = {
    obtenerHistorial
};