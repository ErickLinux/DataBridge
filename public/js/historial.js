document.addEventListener('DOMContentLoaded', () => {

    const tablaHistorial = document.getElementById('tablaHistorial');

    async function cargarHistorial() {

        const token = sessionStorage.getItem('token')
            || localStorage.getItem('token');

        if (!token) {
            window.location.href = '/login.html';
            return;
        }

        tablaHistorial.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    Cargando historial...
                </td>
            </tr>
        `;

        try {

            const respuesta = await fetch('/api/historial', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (respuesta.status === 401 || respuesta.status === 403) {
                sessionStorage.removeItem('token');
                localStorage.removeItem('token');
                window.location.href = '/login.html';
                return;
            }

            if (!respuesta.ok) {
                throw new Error('No fue posible consultar el historial.');
            }

            const resultado = await respuesta.json();

            if (!resultado.success) {
                throw new Error(resultado.message || 'Error al cargar historial.');
            }

            const migraciones = resultado.data;
            // ACTUALIZAR INDICADORES DEL HISTORIAL
if (Array.isArray(migraciones)) {

    const total = migraciones.length;

    const completadas = migraciones.filter(
        migracion => migracion.estado === 'COMPLETADA'
    ).length;

    const conErrores = migraciones.filter(
        migracion => migracion.estado === 'CON_ERRORES'
    ).length;

    document.getElementById('totalMigraciones').textContent =
        total;

    document.getElementById('migracionesCompletadas').textContent =
        completadas;

    document.getElementById('migracionesErrores').textContent =
        conErrores;

}

            if (!Array.isArray(migraciones) || migraciones.length === 0) {
                tablaHistorial.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center text-secondary py-5">
                            <i class="bi bi-clock-history fs-2 d-block mb-2"></i>
                            No hay migraciones registradas.
                        </td>
                    </tr>
                `;
                return;
            }

            tablaHistorial.innerHTML = '';

            migraciones.forEach(migracion => {

                const fila = document.createElement('tr');

                const fecha = migracion.fecha_inicio
                    ? new Date(migracion.fecha_inicio).toLocaleString('es-GT')
                    : 'Sin fecha';

                const valores = [
                    migracion.id,
                    fecha,
                    migracion.base_origen ?? 'No disponible',
                    migracion.base_destino ?? 'No disponible',
                    migracion.total_registros ?? 0,
                    migracion.estado ?? 'Sin estado',
                    'Próximamente'
                ];

                valores.forEach((valor, indice) => {

    const celda = document.createElement('td');

    // Columna Estado
    if (indice === 5) {

        const etiqueta = document.createElement('span');

        etiqueta.classList.add('badge', 'rounded-pill');

        switch (valor) {

            case 'COMPLETADA':
                etiqueta.classList.add('bg-success');
                etiqueta.textContent = 'Completada';
                break;

            case 'CON_ERRORES':
                etiqueta.classList.add('bg-danger');
                etiqueta.textContent = 'Con errores';
                break;

            case 'INICIADA':
                etiqueta.classList.add('bg-warning', 'text-dark');
                etiqueta.textContent = 'Iniciada';
                break;

            default:
                etiqueta.classList.add('bg-secondary');
                etiqueta.textContent = String(valor);
        }

        celda.appendChild(etiqueta);

    } else if (indice === 6) {

    // BOTÓN PARA CONSULTAR DETALLES
    const boton = document.createElement('button');

    boton.type = 'button';
    boton.className = 'btn btn-sm btn-outline-primary';

    const icono = document.createElement('i');
    icono.className = 'bi bi-eye me-1';

    boton.appendChild(icono);
    boton.appendChild(document.createTextNode('Ver detalles'));

    boton.addEventListener('click', () => {

    // MOSTRAR INFORMACIÓN DE LA MIGRACIÓN
    document.getElementById('detalleId').textContent =
        migracion.id;

    document.getElementById('detalleFecha').textContent =
        migracion.fecha_inicio
            ? new Date(migracion.fecha_inicio).toLocaleString('es-GT')
            : 'Sin fecha';

    document.getElementById('detalleOrigen').textContent =
        migracion.base_origen ?? 'No disponible';

    document.getElementById('detalleDestino').textContent =
        migracion.base_destino ?? 'No disponible';

    document.getElementById('detalleRegistros').textContent =
        migracion.total_registros ?? 0;

    document.getElementById('detalleEstado').textContent =
        migracion.estado ?? 'Sin estado';

    document.getElementById('detalleObservaciones').textContent =
        migracion.observaciones ?? 'Sin observaciones';

    // ABRIR VENTANA DE BOOTSTRAP
    const elementoModal =
        document.getElementById('modalDetalleMigracion');

    const modal = bootstrap.Modal.getOrCreateInstance(elementoModal);

    modal.show();

});

    celda.appendChild(boton);

} else {

    celda.textContent = String(valor);

}

fila.appendChild(celda);

});

                tablaHistorial.appendChild(fila);

            });

        } catch (error) {

            console.error('Error al cargar historial:', error);

            tablaHistorial.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-danger py-4">
                        No fue posible cargar el historial.
                    </td>
                </tr>
            `;

        }
    }

    cargarHistorial();

});