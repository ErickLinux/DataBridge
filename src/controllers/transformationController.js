const {
    buildTransformationProposal
} = require(
    '../services/migration/transformationService'
);


function generateTransformation(
    req,
    res
) {

    try {

        const {
            schemaData,
            selectedTables
        } = req.body;


        if (!schemaData) {

            return res.status(400).json({
                success: false,
                message:
                    'El esquema PostgreSQL es obligatorio.'
            });

        }


        if (
            !Array.isArray(selectedTables) ||
            selectedTables.length === 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    'Debe seleccionar al menos una tabla.'
            });

        }


        const result =
            buildTransformationProposal(
                schemaData,
                selectedTables
            );


        return res.json({

            success: true,

            message:
                'Propuesta de transformación generada correctamente.',

            data:
                result

        });


    } catch (error) {

        console.error(
            'Error al generar transformación:',
            error
        );


        return res.status(400).json({

            success: false,

            message:
                'No fue posible generar la propuesta de transformación.',

            detail:
                error.message

        });

    }

}


module.exports = {
    generateTransformation
};