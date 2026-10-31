const token = localStorage.getItem('token');
const usuarioGuardado = localStorage.getItem('usuario');

const postgresForm =
    document.getElementById('postgresForm');

const mongoForm =
    document.getElementById('mongoForm');

const estadoPostgreSQL =
    document.getElementById('estadoPostgreSQL');

const estadoMongoDB =
    document.getElementById('estadoMongoDB');

const mensajePostgreSQL =
    document.getElementById('mensajePostgreSQL');

const mensajeMongoDB =
    document.getElementById('mensajeMongoDB');

const btnProbarPostgreSQL =
    document.getElementById('btnProbarPostgreSQL');

const btnProbarMongoDB =
    document.getElementById('btnProbarMongoDB');

const btnContinuar =
    document.getElementById('btnContinuar');
    const btnVolver =
    document.getElementById('btnVolver');

const pasoConexiones =
    document.getElementById('pasoConexiones');

const pasoEsquema =
    document.getElementById('pasoEsquema');

const contenedorTablas =
    document.getElementById('contenedorTablas');

const mensajeEsquema =
    document.getElementById('mensajeEsquema');

const totalTablasDetectadas =
    document.getElementById('totalTablasDetectadas');

const totalTablasSeleccionadas =
    document.getElementById('totalTablasSeleccionadas');

const nombreBaseOrigen =
    document.getElementById('nombreBaseOrigen');

const btnSeleccionarTodas =
    document.getElementById('btnSeleccionarTodas');

const btnDeseleccionarTodas =
    document.getElementById('btnDeseleccionarTodas');
    const pasoTransformacion =
    document.getElementById(
        'pasoTransformacion'
    );

const contenedorTransformaciones =
    document.getElementById(
        'contenedorTransformaciones'
    );

const totalColecciones =
    document.getElementById(
        'totalColecciones'
    );

const totalRelaciones =
    document.getElementById(
        'totalRelaciones'
    );

const nombreBaseDestino =
    document.getElementById(
        'nombreBaseDestino'
    );
const pasoMigracion =
    document.getElementById(
        'pasoMigracion'
    );
    const pasoValidacion =
    document.getElementById('pasoValidacion');

const estadoMigracion =
    document.getElementById(
        'estadoMigracion'
    );

const resumenBaseOrigen =
    document.getElementById(
        'resumenBaseOrigen'
    );

const resumenBaseDestino =
    document.getElementById(
        'resumenBaseDestino'
    );

const resumenTotalTablas =
    document.getElementById(
        'resumenTotalTablas'
    );

const resumenTotalRelaciones =
    document.getElementById(
        'resumenTotalRelaciones'
    );

const listaMigracion =
    document.getElementById(
        'listaMigracion'
    );

const btnEjecutarMigracion =
    document.getElementById(
        'btnEjecutarMigracion'
    );
const btnValidarIntegridad =
    document.getElementById(
        'btnValidarIntegridad'
    );

const resultadoMigracion =
    document.getElementById(
        'resultadoMigracion'
    );



let postgresqlVerificado = false;
let mongodbVerificado = false;

let pasoActual = 1;
let esquemaPostgreSQL = null;
let tablasSeleccionadas = new Set();
let propuestaTransformacion = null;

/* Invalidar resultados temporales cuando cambia la operación actual.
   No modifica el historial ni los datos en las bases de datos. */
function limpiarValidacionAnterior() {
    const reporte = document.getElementById('resultadoValidacionIndependiente');
    if (reporte) reporte.replaceChildren();

    const contenedorFinal = document.getElementById('contenedorResultadosValidacion');
    if (contenedorFinal) contenedorFinal.replaceChildren();

    sessionStorage.removeItem('ultimoReporteValidacion');

    // Impedir avanzar a la etapa 5 con resultados de otra operación.
    if (pasoActual === 4) {
        btnContinuar.disabled = true;
    }
}

/* ========================================
   NOTIFICACIONES VISUALES DATABRIDGE
   No requiere modificar el HTML.
======================================== */
function notificarDataBridge(tipo, titulo, mensaje) {
    const estilos = {
        success: { color: '#198754', icono: 'bi-check-circle-fill' },
        warning: { color: '#b77900', icono: 'bi-exclamation-triangle-fill' },
        error: { color: '#dc3545', icono: 'bi-x-circle-fill' },
        info: { color: '#0d6efd', icono: 'bi-info-circle-fill' }
    };
    const estilo = estilos[tipo] || estilos.info;
    let contenedor = document.getElementById('notificacionesDataBridge');
    if (!contenedor) {
        contenedor = document.createElement('div');
        contenedor.id = 'notificacionesDataBridge';
        contenedor.setAttribute('aria-live', 'polite');
        Object.assign(contenedor.style, {
            position: 'fixed', top: '20px', right: '20px',
            zIndex: '11000', width: 'min(390px, calc(100vw - 32px))',
            display: 'flex', flexDirection: 'column', gap: '10px',
            pointerEvents: 'none'
        });
        document.body.appendChild(contenedor);
    }
    // Sustituir el aviso anterior para evitar notificaciones repetidas.
    contenedor.replaceChildren();
    const aviso = document.createElement('div');
    aviso.setAttribute('role', tipo === 'error' || tipo === 'warning' ? 'alert' : 'status');
    Object.assign(aviso.style, {
        background: '#fff', color: '#212529', border: '1px solid #dee2e6',
        borderLeft: `5px solid ${estilo.color}`, borderRadius: '10px',
        boxShadow: '0 6px 24px rgba(0,0,0,.16)', padding: '14px',
        display: 'flex', alignItems: 'flex-start', gap: '10px',
        pointerEvents: 'auto', overflowWrap: 'anywhere'
    });
    const icono = document.createElement('i');
    icono.className = `bi ${estilo.icono}`;
    icono.style.color = estilo.color;
    const texto = document.createElement('div');
    texto.style.flex = '1';
    const encabezado = document.createElement('strong');
    encabezado.textContent = titulo;
    const detalle = document.createElement('div');
    detalle.textContent = mensaje;
    detalle.style.fontSize = '0.9rem';
    detalle.style.marginTop = '4px';
    texto.append(encabezado, detalle);
    const cerrar = document.createElement('button');
    cerrar.type = 'button';
    cerrar.setAttribute('aria-label', 'Cerrar notificación');
    cerrar.textContent = '×';
    Object.assign(cerrar.style, {
        border: '0', background: 'transparent', color: '#6c757d',
        fontSize: '22px', lineHeight: '1', cursor: 'pointer'
    });
    cerrar.addEventListener('click', () => aviso.remove());
    aviso.append(icono, texto, cerrar);
    contenedor.appendChild(aviso);
    // Los errores permanecen hasta que el usuario los cierre.
    if (tipo === 'success' || tipo === 'info') {
        setTimeout(() => { if (aviso.isConnected) aviso.remove(); }, 6500);
    }
}

/* ========================================
   SESIÓN
======================================== */

if (!token) {

    window.location.replace('/login.html');

} else {

    validarSesion();

}


if (usuarioGuardado) {

    try {

        const usuario =
            JSON.parse(usuarioGuardado);

        document
            .getElementById('nombreUsuario')
            .textContent = usuario.nombre;

    } catch (error) {

        console.error(
            'No fue posible leer los datos del usuario.'
        );

    }

}


async function validarSesion() {

    try {

        const response = await fetch(
            '/api/usuarios/perfil',
            {
                headers: {
                    Authorization:
                        `Bearer ${token}`
                }
            }
        );


        if (!response.ok) {

            cerrarSesion();

        }

    } catch (error) {

        console.error(
            'Error al validar la sesión:',
            error
        );

    }

}


/* ========================================
   POSTGRESQL
======================================== */

postgresForm.addEventListener(
    'submit',
    async (event) => {

        event.preventDefault();

        limpiarMensaje(
            mensajePostgreSQL
        );


        const configuracion = {

            host:
                document
                    .getElementById('pgHost')
                    .value
                    .trim(),

            port:
                Number(
                    document
                        .getElementById('pgPort')
                        .value
                ),

            database:
                document
                    .getElementById('pgDatabase')
                    .value
                    .trim(),

            user:
                document
                    .getElementById('pgUser')
                    .value
                    .trim(),

            password:
                document
                    .getElementById('pgPassword')
                    .value
        };


        cambiarEstadoBoton(
            btnProbarPostgreSQL,
            true,
            'PostgreSQL'
        );


        try {

            const response = await fetch(
                '/api/conexiones/postgresql/probar',
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json',

                        Authorization:
                            `Bearer ${token}`
                    },

                    body:
                        JSON.stringify(configuracion)
                }
            );


            const data =
                await response.json();


            if (response.status === 401) {

                cerrarSesion();

                return;
            }


            if (!response.ok) {

                postgresqlVerificado = false;

                mostrarResultado(
                    estadoPostgreSQL,
                    mensajePostgreSQL,
                    false,
                    data.detail ||
                    data.message ||
                    'No fue posible establecer la conexión.'
                );

                actualizarContinuar();

                return;
            }


            postgresqlVerificado = true;


            mostrarResultado(
                estadoPostgreSQL,
                mensajePostgreSQL,
                true,
                data.message
            );


            actualizarContinuar();


        } catch (error) {

            console.error(error);

            postgresqlVerificado = false;

            mostrarResultado(
                estadoPostgreSQL,
                mensajePostgreSQL,
                false,
                'No fue posible comunicarse con el servidor.'
            );

            actualizarContinuar();


        } finally {

            cambiarEstadoBoton(
                btnProbarPostgreSQL,
                false,
                'PostgreSQL'
            );

        }

    }
);


/* ========================================
   MONGODB
======================================== */

mongoForm.addEventListener(
    'submit',
    async (event) => {

        event.preventDefault();

        limpiarMensaje(
            mensajeMongoDB
        );


        const configuracion = {

            uri:
                document
                    .getElementById('mongoUri')
                    .value
                    .trim(),

            database:
                document
                    .getElementById('mongoDatabase')
                    .value
                    .trim()

        };


        cambiarEstadoBoton(
            btnProbarMongoDB,
            true,
            'MongoDB'
        );


        try {

            const response = await fetch(
                '/api/conexiones/mongodb/probar',
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json',

                        Authorization:
                            `Bearer ${token}`
                    },

                    body:
                        JSON.stringify(configuracion)
                }
            );


            const data =
                await response.json();


            if (response.status === 401) {

                cerrarSesion();

                return;
            }


            if (!response.ok) {

                mongodbVerificado = false;

                mostrarResultado(
                    estadoMongoDB,
                    mensajeMongoDB,
                    false,
                    data.detail ||
                    data.message ||
                    'No fue posible establecer la conexión.'
                );

                actualizarContinuar();

                return;
            }


            mongodbVerificado = true;


            mostrarResultado(
                estadoMongoDB,
                mensajeMongoDB,
                true,
                data.message
            );


            actualizarContinuar();


        } catch (error) {

            console.error(error);

            mongodbVerificado = false;

            mostrarResultado(
                estadoMongoDB,
                mensajeMongoDB,
                false,
                'No fue posible comunicarse con el servidor.'
            );

            actualizarContinuar();


        } finally {

            cambiarEstadoBoton(
                btnProbarMongoDB,
                false,
                'MongoDB'
            );

        }

    }
);


/* ========================================
   INVALIDAR POSTGRESQL AL MODIFICAR
======================================== */

[
    'pgHost',
    'pgPort',
    'pgDatabase',
    'pgUser',
    'pgPassword'

].forEach((id) => {

    document
        .getElementById(id)
        .addEventListener(
            'input',
            () => {

                limpiarValidacionAnterior();

                if (postgresqlVerificado) {

                    postgresqlVerificado = false;

                    restaurarEstado(
                        estadoPostgreSQL,
                        mensajePostgreSQL
                    );

                    actualizarContinuar();

                }

            }
        );

});


/* ========================================
   INVALIDAR MONGODB AL MODIFICAR
======================================== */

[
    'mongoUri',
    'mongoDatabase'

].forEach((id) => {

    document
        .getElementById(id)
        .addEventListener(
            'input',
            () => {

                limpiarValidacionAnterior();

                if (mongodbVerificado) {

                    mongodbVerificado = false;

                    restaurarEstado(
                        estadoMongoDB,
                        mensajeMongoDB
                    );

                    actualizarContinuar();

                }

            }
        );

});


/* ========================================
   MOSTRAR CONTRASEÑA POSTGRESQL
======================================== */

document
    .getElementById('togglePgPassword')
    .addEventListener(
        'click',
        () => {

            const input =
                document.getElementById(
                    'pgPassword'
                );

            const icon =
                document.querySelector(
                    '#togglePgPassword i'
                );


            if (input.type === 'password') {

                input.type = 'text';

                icon.className =
                    'bi bi-eye-slash';

            } else {

                input.type = 'password';

                icon.className =
                    'bi bi-eye';

            }

        }
    );


/* ========================================
   FUNCIONES GENERALES
======================================== */

function mostrarResultado(
    estado,
    mensajeElemento,
    exitoso,
    mensaje
) {

    if (exitoso) {

        estado.className =
            'connection-status success';

        estado.innerHTML = `
            <span></span>
            Conectado
        `;


        mensajeElemento.className =
            'connection-message success';

        mensajeElemento.innerHTML = `
            <i class="bi bi-check-circle me-1"></i>
            ${mensaje}
        `;

    } else {

        estado.className =
            'connection-status error';

        estado.innerHTML = `
            <span></span>
            Error
        `;


        mensajeElemento.className =
            'connection-message error';

        mensajeElemento.innerHTML = `
            <i class="bi bi-exclamation-circle me-1"></i>
            ${mensaje}
        `;

    }

}


function restaurarEstado(
    estado,
    mensaje
) {

    estado.className =
        'connection-status neutral';

    estado.innerHTML = `
        <span></span>
        Sin verificar
    `;

    mensaje.className =
        'connection-message d-none';

}


function limpiarMensaje(elemento) {

    elemento.className =
        'connection-message d-none';

}


function cambiarEstadoBoton(
    boton,
    cargando,
    motor
) {

    if (cargando) {

        boton.disabled = true;

        boton.innerHTML = `
            <span
                class="spinner-border
                       spinner-border-sm">
            </span>

            Verificando...
        `;

    } else {

        boton.disabled = false;

        boton.innerHTML = `
            <i class="bi bi-plug"></i>
            Probar conexión
        `;

    }

}


btnContinuar.addEventListener(
    'click',
    async () => {

        // PASO 1: CONEXIONES
        if (pasoActual === 1) {

            if (
                !postgresqlVerificado ||
                !mongodbVerificado
            ) {
                return;
            }

            await cargarEsquemaPostgreSQL();

            return;
        }

        // PASO 2: ESQUEMA
        if (pasoActual === 2) {

            if (
                tablasSeleccionadas.size === 0
            ) {
                return;
            }

            await generarPropuestaTransformacion();

            return;
        }

        // PASO 3: TRANSFORMACIÓN
        if (pasoActual === 3) {

            validarTransformacion();

            if (btnContinuar.disabled) {
                return;
            }

            console.log(
                'CONFIGURACIÓN FINAL DE TRANSFORMACIÓN:',
                propuestaTransformacion
            );

            mostrarPasoMigracion();

            return;
        }

        // PASO 4: MIGRACIÓN → VALIDACIÓN
        if (pasoActual === 4) {

            if (!pasoValidacion) {
                console.error(
                    'No se encontró la sección de validación.'
                );
                return;
            }

            if (btnContinuar.disabled) {
                return;
            }

            pasoMigracion.classList.add('d-none');
            pasoValidacion.classList.remove('d-none');
            // MOSTRAR RESULTADOS EN LA ETAPA 5
const contenedorResultados =
    document.getElementById('contenedorResultadosValidacion');

const reporteValidacion =
    document.getElementById('resultadoValidacionIndependiente');

if (contenedorResultados) {

    contenedorResultados.innerHTML = '';

    if (reporteValidacion && reporteValidacion.innerHTML.trim()) {

        const copiaReporte = reporteValidacion.cloneNode(true);

        copiaReporte.removeAttribute('id');
        copiaReporte.classList.remove('d-none');

        contenedorResultados.appendChild(copiaReporte);

    } else {

        contenedorResultados.innerHTML = `
            <div class="alert alert-warning">
                <i class="bi bi-exclamation-triangle"></i>
                No se encontraron resultados de validación.
                Regresa a Migración y ejecuta
                "Validar integridad".
            </div>
        `;
    }
}

            pasoActual = 5;
            // ACTUALIZAR MENSAJE INFORMATIVO DE LA ETAPA 5
const mensajeInformativo =
    document.getElementById('mensajeInformativo');

if (mensajeInformativo) {

    mensajeInformativo.innerHTML = `
        <i class="bi bi-shield-check"></i>

        <div>
            <strong>
                Validación de integridad
            </strong>

            <span>
                Se ha completado el análisis de los datos
                migrados desde PostgreSQL hacia MongoDB.
                Revisa los registros correctos, las
                inconsistencias detectadas y las
                recomendaciones de corrección.
            </span>
        </div>
    `;
}

            btnContinuar.classList.add('d-none');

            btnVolver.innerHTML = `
                <i class="bi bi-arrow-left"></i>
                Volver a migración
            `;

            document.querySelectorAll('.step').forEach(
                (step, index) => {

                    step.classList.toggle(
                        'active',
                        index === 4
                    );

                    step.classList.toggle(
                        'completed',
                        index < 4
                    );
                }
            );

            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });

            return;
        }

    }
);


function limpiarMensajeEsquema() {

    mensajeEsquema.className =
        'schema-message d-none';

    mensajeEsquema.innerHTML = '';

}


async function cargarEsquemaPostgreSQL() {

    limpiarMensajeEsquema();

    const configuracion = {

        host:
            document
                .getElementById('pgHost')
                .value
                .trim(),

        port:
            Number(
                document
                    .getElementById('pgPort')
                    .value
            ),

        database:
            document
                .getElementById('pgDatabase')
                .value
                .trim(),

        user:
            document
                .getElementById('pgUser')
                .value
                .trim(),

        password:
            document
                .getElementById('pgPassword')
                .value
    };


    btnContinuar.disabled = true;

    btnContinuar.innerHTML = `
        <span
            class="spinner-border
                   spinner-border-sm">
        </span>

        Analizando esquema...
    `;


    try {

        const response = await fetch(
            '/api/conexiones/postgresql/esquema',
            {
                method: 'POST',

                headers: {
                    'Content-Type':
                        'application/json',

                    Authorization:
                        `Bearer ${token}`
                },

                body:
                    JSON.stringify(configuracion)
            }
        );


        const data =
            await response.json();


        if (response.status === 401) {

            cerrarSesion();

            return;
        }


        if (!response.ok) {

            throw new Error(
                data.detail ||
                data.message ||
                'No fue posible analizar el esquema.'
            );
        }


        esquemaPostgreSQL =
            data.data;


        mostrarPasoEsquema();


    } catch (error) {

        console.error(
            'Error al analizar esquema:',
            error
        );


        mensajeEsquema.className =
            'schema-message error';

        mensajeEsquema.innerHTML = `
            <i class="bi bi-exclamation-circle me-1"></i>
            ${escapeHtml(error.message)}
        `;


    } finally {

        if (pasoActual === 1) {

            btnContinuar.innerHTML = `
                Continuar
                <i class="bi bi-arrow-right"></i>
            `;

            actualizarContinuar();

        }

    }

}


function mostrarPasoEsquema() {

    pasoActual = 2;

    pasoConexiones.classList.add('d-none');

    pasoEsquema.classList.remove('d-none');


    document.querySelectorAll(
        '.step'
    ).forEach(
        (step, index) => {

            step.classList.toggle(
                'active',
                index === 1
            );

        }
    );


    nombreBaseOrigen.textContent =
        esquemaPostgreSQL.database;


    totalTablasDetectadas.textContent =
        esquemaPostgreSQL.totalTables;


    tablasSeleccionadas.clear();


    renderizarTablas(
        esquemaPostgreSQL.tables
    );


    actualizarSeleccion();


    btnVolver.innerHTML = `
        <i class="bi bi-arrow-left"></i>
        Volver a conexiones
    `;

}



function renderizarTablas(tablas) {

    contenedorTablas.innerHTML = '';


    if (!tablas || tablas.length === 0) {

        contenedorTablas.innerHTML = `
            <div class="schema-loading">
                No se encontraron tablas
                en el esquema public.
            </div>
        `;

        return;
    }


    tablas.forEach((tabla) => {

        const primaryKeys =
            tabla.columns.filter(
                column =>
                    column.primaryKey
            );


        const foreignKeys =
            tabla.columns.filter(
                column =>
                    column.foreignKey
            );


        const card =
            document.createElement('div');


        card.className =
            'schema-table-card';


        card.dataset.table =
            tabla.name;


        card.innerHTML = `

            <div class="schema-table-header">

                <input
                    type="checkbox"
                    class="schema-table-check"
                    data-table="${escapeHtml(tabla.name)}"
                >

                <div class="schema-table-info">

                    <strong>
                        ${escapeHtml(tabla.name)}
                    </strong>

                    <span>
                        ${tabla.columns.length}
                        columnas
                    </span>

                </div>


                <div class="schema-table-badges">

                    ${
                        primaryKeys.length > 0
                            ? `
                                <span
                                    class="schema-badge">

                                    PK:
                                    ${escapeHtml(
                                        primaryKeys
                                            .map(pk => pk.name)
                                            .join(', ')
                                    )}

                                </span>
                            `
                            : ''
                    }


                    ${
                        foreignKeys.length > 0
                            ? `
                                <span
                                    class="schema-badge relation">

                                    ${foreignKeys.length}
                                    ${
                                        foreignKeys.length === 1
                                            ? 'relación'
                                            : 'relaciones'
                                    }

                                </span>
                            `
                            : ''
                    }

                </div>


                <button
                    type="button"
                    class="schema-expand"
                    title="Ver columnas">

                    <i class="bi bi-chevron-down"></i>

                </button>

            </div>


            <div class="schema-columns">

                ${
                    tabla.columns
                        .map(
                            column =>
                                crearColumnaHTML(
                                    column
                                )
                        )
                        .join('')
                }

            </div>
        `;


        contenedorTablas.appendChild(
            card
        );

    });


    configurarEventosTablas();

}



function crearColumnaHTML(column) {

    let propiedades = '';


    if (column.primaryKey) {

        propiedades += `
            <span
                class="column-property pk">
                PK
            </span>
        `;

    }


    if (column.foreignKey) {

        propiedades += `
            <span
                class="column-property fk"
                title="${escapeHtml(
                    column.foreignKey
                        .referencedTable
                )}.${escapeHtml(
                    column.foreignKey
                        .referencedColumn
                )}">
                FK
            </span>
        `;

    }


    if (!column.nullable) {

        propiedades += `
            <span class="column-property">
                NOT NULL
            </span>
        `;

    }


    return `

        <div class="schema-column">

            <span class="schema-column-name">
                ${escapeHtml(column.name)}
            </span>

            <span class="schema-column-type">
                ${escapeHtml(column.dataType)}
            </span>

            <div class="schema-column-properties">
                ${propiedades}
            </div>

        </div>
    `;

}



function configurarEventosTablas() {

    document
        .querySelectorAll(
            '.schema-table-check'
        )
        .forEach(
            checkbox => {

                checkbox.addEventListener(
                    'change',
                    () => {

                        const tableName =
                            checkbox.dataset.table;

                        limpiarValidacionAnterior();

                        if (checkbox.checked) {

                            tablasSeleccionadas.add(
                                tableName
                            );

                        } else {

                            tablasSeleccionadas.delete(
                                tableName
                            );

                        }


                        const card =
                            checkbox.closest(
                                '.schema-table-card'
                            );


                        card.classList.toggle(
                            'selected',
                            checkbox.checked
                        );


                        actualizarSeleccion();

                    }
                );

            }
        );


    document
        .querySelectorAll(
            '.schema-expand'
        )
        .forEach(
            button => {

                button.addEventListener(
                    'click',
                    () => {

                        const card =
                            button.closest(
                                '.schema-table-card'
                            );


                        card.classList.toggle(
                            'expanded'
                        );


                        const icon =
                            button.querySelector('i');


                        icon.className =
                            card.classList.contains(
                                'expanded'
                            )
                                ? 'bi bi-chevron-up'
                                : 'bi bi-chevron-down';

                    }
                );

            }
        );

}




btnSeleccionarTodas.addEventListener(
    'click',
    () => {

        if (document.querySelector('.schema-table-check:not(:checked)')) {
            limpiarValidacionAnterior();
        }

        document
            .querySelectorAll(
                '.schema-table-check'
            )
            .forEach(
                checkbox => {

                    checkbox.checked = true;

                    tablasSeleccionadas.add(
                        checkbox.dataset.table
                    );


                    checkbox
                        .closest(
                            '.schema-table-card'
                        )
                        .classList
                        .add('selected');

                }
            );


        actualizarSeleccion();

    }
);


btnDeseleccionarTodas.addEventListener(
    'click',
    () => {

        if (tablasSeleccionadas.size > 0) {
            limpiarValidacionAnterior();
        }

        document
            .querySelectorAll(
                '.schema-table-check'
            )
            .forEach(
                checkbox => {

                    checkbox.checked = false;

                    checkbox
                        .closest(
                            '.schema-table-card'
                        )
                        .classList
                        .remove('selected');

                }
            );


        tablasSeleccionadas.clear();


        actualizarSeleccion();

    }
);


function actualizarSeleccion() {

    totalTablasSeleccionadas.textContent =
        tablasSeleccionadas.size;


    if (pasoActual === 2) {

        btnContinuar.disabled =
            tablasSeleccionadas.size === 0;


        btnContinuar.innerHTML = `
            Continuar a transformación
            <i class="bi bi-arrow-right"></i>
        `;

    }

}


btnVolver.addEventListener(
    'click',
    () => {

        if (pasoActual === 1) {

            window.location.href =
                '/dashboard.html';

            return;
        }


        if (pasoActual === 2) {

            pasoActual = 1;

            pasoEsquema.classList.add(
                'd-none'
            );

            pasoConexiones.classList.remove(
                'd-none'
            );


            document.querySelectorAll(
                '.step'
            ).forEach(
                (step, index) => {

                    step.classList.toggle(
                        'active',
                        index === 0
                    );

                }
            );


            btnVolver.innerHTML = `
                <i class="bi bi-arrow-left"></i>
                Volver al dashboard
            `;


            actualizarContinuar();

        }
        if (pasoActual === 3) {

    pasoActual = 2;

    pasoTransformacion.classList.add(
        'd-none'
    );

    pasoEsquema.classList.remove(
        'd-none'
    );

    document
        .querySelectorAll('.step')
        .forEach(
            (step, index) => {

                step.classList.toggle(
                    'active',
                    index === 1
                );

            }
        );

    btnVolver.innerHTML = `
        <i class="bi bi-arrow-left"></i>
        Volver a conexiones
    `;

    actualizarSeleccion();

    return;
}if (pasoActual === 4) {

    pasoActual = 3;


    pasoMigracion.classList.add(
        'd-none'
    );

    pasoTransformacion.classList.remove(
        'd-none'
    );


    document
        .querySelectorAll('.step')
        .forEach(
            (step, index) => {

                step.classList.toggle(
                    'active',
                    index === 2
                );

            }
        );


    btnVolver.innerHTML = `
        <i class="bi bi-arrow-left"></i>
        Volver al esquema
    `;


    btnContinuar.classList.remove(
        'd-none'
    );


    btnContinuar.innerHTML = `
        Continuar a migración
        <i class="bi bi-arrow-right"></i>
    `;


    validarTransformacion();

    return;
}

// PASO 5: VALIDACIÓN → MIGRACIÓN
if (pasoActual === 5) {

    pasoActual = 4;

    // Ocultar validación y mostrar migración
    pasoValidacion.classList.add('d-none');
    pasoMigracion.classList.remove('d-none');
    // RESTAURAR MENSAJE INFORMATIVO DE MIGRACIÓN
const mensajeInformativo =
    document.getElementById('mensajeInformativo');

if (mensajeInformativo) {

    mensajeInformativo.innerHTML = `
        <i class="bi bi-info-circle"></i>

        <div>
            <strong>
                Ejecución de migración
            </strong>

            <span>
                Consulta el resultado de la transferencia
                de datos y utiliza la validación independiente
                para comprobar su integridad antes de continuar.
            </span>
        </div>
    `;
}

    // Actualizar indicador de etapas
    document.querySelectorAll('.step').forEach(
        (step, index) => {

            step.classList.toggle(
                'active',
                index === 3
            );

            step.classList.toggle(
                'completed',
                index < 3
            );
        }
    );

    // Restaurar botones
    btnVolver.innerHTML = `
        <i class="bi bi-arrow-left"></i>
        Volver a transformación
    `;

    btnContinuar.classList.remove('d-none');
    btnContinuar.disabled = false;

    btnContinuar.innerHTML = `
        Continuar a validación
        <i class="bi bi-arrow-right"></i>
    `;

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });

    return;
}


    }
);


function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return '';
    }


    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');

}

async function generarPropuestaTransformacion() {

    if (
        !esquemaPostgreSQL ||
        tablasSeleccionadas.size === 0
    ) {
        return;
    }

    const textoOriginal = btnContinuar.innerHTML;

    btnContinuar.disabled = true;

    btnContinuar.innerHTML = `
        <span
            class="spinner-border spinner-border-sm"
            role="status">
        </span>
        Generando transformación...
    `;

    try {

        const response = await fetch(
            '/api/transformacion/generar',
            {
                method: 'POST',

                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },

                body: JSON.stringify({
                    schemaData: esquemaPostgreSQL,
                    selectedTables:
                        Array.from(tablasSeleccionadas)
                })
            }
        );

        const data = await response.json();


        if (response.status === 401) {
            cerrarSesion();
            return;
        }


        if (!response.ok) {

            throw new Error(
                data.detail ||
                data.message ||
                'No fue posible generar la transformación.'
            );

        }
        propuestaTransformacion = data.data;

console.log(
    '======================================'
);

console.log(
    'PROPUESTA DE TRANSFORMACIÓN'
);

console.log(
    '======================================'
);

console.log(data.data);

console.table(
    data.data.transformations.map(
        transformation => ({
            tabla:
                transformation.sourceTable,

            coleccion:
                transformation.destinationCollection,

            campos:
                transformation.fields.length,

            relaciones:
                transformation.relationships.length
        })
    )
);


        mostrarPasoTransformacion();


    } catch (error) {

        console.error(
            'Error al generar transformación:',
            error
        );


        alert(
            'No fue posible generar la propuesta de transformación.\n\n' +
            error.message
        );


    } finally {

        btnContinuar.disabled = false;

        btnContinuar.innerHTML = textoOriginal;

        actualizarSeleccion();

    }

}


/* ========================================
   PASO 3 - TRANSFORMACIÓN
======================================== */

function mostrarPasoTransformacion() {

    if (
        !propuestaTransformacion ||
        !Array.isArray(
            propuestaTransformacion.transformations
        )
    ) {
        return;
    }


    pasoActual = 3;

    pasoEsquema.classList.add('d-none');

    pasoTransformacion.classList.remove(
        'd-none'
    );


    document
        .querySelectorAll('.step')
        .forEach(
            (step, index) => {

                step.classList.toggle(
                    'active',
                    index === 2
                );

            }
        );


    totalColecciones.textContent =
        propuestaTransformacion.totalTables;


    const relaciones =
        propuestaTransformacion
            .transformations
            .reduce(
                (total, transformation) =>
                    total +
                    transformation
                        .relationships
                        .length,
                0
            );


    totalRelaciones.textContent =
        relaciones;


    nombreBaseDestino.textContent =
        document
            .getElementById(
                'mongoDatabase'
            )
            .value
            .trim();


    renderizarTransformaciones(
        propuestaTransformacion
            .transformations
    );


    btnVolver.innerHTML = `
        <i class="bi bi-arrow-left"></i>
        Volver al esquema
    `;


    btnContinuar.disabled = false;

    btnContinuar.innerHTML = `
        Continuar a migración
        <i class="bi bi-arrow-right"></i>
    `;

}

function renderizarTransformaciones(
    transformations
) {

    contenedorTransformaciones.innerHTML =
        '';


    transformations.forEach(
        transformation => {

            const card =
                document.createElement('div');


            card.className =
                'transformation-card';


            card.dataset.table =
                transformation.sourceTable;


            card.innerHTML = `

                <div class="transformation-card-header">

                    <div class="transformation-source">

                        <div class="transformation-icon postgres">
                            <i class="bi bi-table"></i>
                        </div>

                        <div>
                            <span>
                                TABLA POSTGRESQL
                            </span>

                            <strong>
                                ${escapeHtml(
                                    transformation
                                        .sourceTable
                                )}
                            </strong>
                        </div>

                    </div>


                    <i class="bi bi-arrow-right transformation-arrow"></i>


                    <div class="transformation-destination">

                        <div class="transformation-icon mongo">
                            <i class="bi bi-collection"></i>
                        </div>

                        <div>
                            <span>
                                COLECCIÓN MONGODB
                            </span>

                            <input
                                type="text"
                                class="collection-name-input"
                                value="${escapeHtml(
                                    transformation
                                        .destinationCollection
                                )}"
                                data-source-table="${escapeHtml(
                                    transformation
                                        .sourceTable
                                )}"
                            >
                        </div>

                    </div>


                    <button
                        type="button"
                        class="transformation-expand"
                        title="Ver transformación"
                    >
                        <i class="bi bi-chevron-up"></i>
                    </button>

                </div>


                <div class="transformation-body">

                    <div class="mapping-section">

                        <div class="mapping-title">
                            <i class="bi bi-arrow-left-right"></i>
                            Mapeo de campos
                        </div>


                        <div class="mapping-table">

                            <div class="mapping-row mapping-heading">

                                <span>
                                    PostgreSQL
                                </span>

                                <span>
                                    Tipo origen
                                </span>

                                <span>
                                    MongoDB
                                </span>

                                <span>
                                    Propiedades
                                </span>

                            </div>


                            ${transformation.fields
                                .map(
                                    field =>
                                        crearMapeoCampoHTML(
                                            field
                                        )
                                )
                                .join('')}

                        </div>

                    </div>


                    ${
                        crearRelacionesHTML(
                            transformation
                        )
                    }

                </div>
            `;


            contenedorTransformaciones
                .appendChild(card);

        }
    );


    configurarEventosTransformacion();

}


function crearMapeoCampoHTML(field) {

    let propiedades = '';


    if (field.primaryKey) {

        propiedades += `
            <span class="mapping-property pk">
                PK
            </span>
        `;

    }


    if (field.foreignKey) {

        propiedades += `
            <span class="mapping-property fk">
                FK
            </span>
        `;

    }


    if (!field.nullable) {

        propiedades += `
            <span class="mapping-property">
                NOT NULL
            </span>
        `;

    }


    return `

        <div class="mapping-row">

            <span class="mapping-field">
                ${escapeHtml(
                    field.sourceColumn
                )}
            </span>


            <span class="mapping-source-type">
                ${escapeHtml(
                    field.sourceType
                )}
            </span>


            <span class="mapping-mongo-type">

                <i class="bi bi-arrow-right"></i>

                ${escapeHtml(
                    field.mongoType
                )}

            </span>


            <div class="mapping-properties">
                ${propiedades}
            </div>

        </div>

    `;

}


function crearRelacionesHTML(
    transformation
) {

    if (
        !transformation.relationships ||
        transformation
            .relationships
            .length === 0
    ) {

        return `
            <div class="relationship-empty">

                <i class="bi bi-diagram-2"></i>

                Esta tabla no contiene
                relaciones foráneas.

            </div>
        `;

    }


    return `

        <div class="relationship-section">

            <div class="mapping-title">

                <i class="bi bi-diagram-3"></i>

                Relaciones detectadas

            </div>


            <div class="relationship-list">

                ${transformation
                    .relationships
                    .map(
                        relationship =>
                            crearRelacionHTML(
                                transformation,
                                relationship
                            )
                    )
                    .join('')}

            </div>

        </div>

    `;

}



function crearRelacionHTML(
    transformation,
    relationship
) {

    const id =
        (
            transformation.sourceTable +
            '_' +
            relationship.sourceColumn
        )
            .replaceAll(
                /[^a-zA-Z0-9_]/g,
                '_'
            );


    return `

        <div class="relationship-card">

            <div class="relationship-path">

                <div>
                    <span>
                        Campo origen
                    </span>

                    <strong>
                        ${escapeHtml(
                            transformation
                                .sourceTable
                        )}.${escapeHtml(
                            relationship
                                .sourceColumn
                        )}
                    </strong>
                </div>


                <i class="bi bi-arrow-right"></i>


                <div>
                    <span>
                        Referencia
                    </span>

                    <strong>
                        ${escapeHtml(
                            relationship
                                .referencedTable
                        )}.${escapeHtml(
                            relationship
                                .referencedColumn
                        )}
                    </strong>
                </div>

            </div>


            <div class="relationship-strategy">

                <span class="strategy-label">
                    Estrategia
                </span>


                <label>

                    <input
                        type="radio"
                        name="strategy_${id}"
                        value="reference"
                        data-table="${escapeHtml(
                            transformation
                                .sourceTable
                        )}"
                        data-column="${escapeHtml(
                            relationship
                                .sourceColumn
                        )}"
                        checked
                    >

                    <span>
                        <i class="bi bi-link-45deg"></i>

                        Referencia
                    </span>

                </label>


                <label>

                    <input
                        type="radio"
                        name="strategy_${id}"
                        value="embedded"
                        data-table="${escapeHtml(
                            transformation
                                .sourceTable
                        )}"
                        data-column="${escapeHtml(
                            relationship
                                .sourceColumn
                        )}"
                        ${relationship.targetSelected
                            ? ''
                            : 'disabled'}
                    >

                    <span>
                        <i class="bi bi-box"></i>

                        Embebido
                    </span>

                </label>

            </div>

        </div>

    `;

}


function configurarEventosTransformacion() {

    document
        .querySelectorAll(
            '.transformation-expand'
        )
        .forEach(
            button => {

                button.addEventListener(
                    'click',
                    () => {

                        const card =
                            button.closest(
                                '.transformation-card'
                            );


                        card.classList.toggle(
                            'collapsed'
                        );


                        const icon =
                            button.querySelector('i');


                        icon.className =
                            card.classList.contains(
                                'collapsed'
                            )
                                ? 'bi bi-chevron-down'
                                : 'bi bi-chevron-up';

                    }
                );

            }
        );


    document
        .querySelectorAll(
            '.collection-name-input'
        )
        .forEach(
            input => {

                input.addEventListener(
                    'input',
                    () => {

                        const transformation =
                            propuestaTransformacion
                                .transformations
                                .find(
                                    item =>
                                        item.sourceTable ===
                                        input.dataset
                                            .sourceTable
                                );


                        if (transformation) {

                            if (transformation.destinationCollection !== input.value.trim()) {
                                limpiarValidacionAnterior();
                            }
                            transformation
                                .destinationCollection =
                                input.value.trim();

                        }

                        validarTransformacion();

                    }
                );

            }
        );


    document
        .querySelectorAll(
            '.relationship-strategy input'
        )
        .forEach(
            radio => {

                radio.addEventListener(
                    'change',
                    () => {

                        if (!radio.checked) {
                            return;
                        }


                        const transformation =
                            propuestaTransformacion
                                .transformations
                                .find(
                                    item =>
                                        item.sourceTable ===
                                        radio.dataset.table
                                );


                        if (!transformation) {
                            return;
                        }


                        const relationship =
                            transformation
                                .relationships
                                .find(
                                    item =>
                                        item.sourceColumn ===
                                        radio.dataset.column
                                );


                        if (relationship) {

                            if (relationship.strategy !== radio.value) {
                                limpiarValidacionAnterior();
                            }
                            relationship.strategy =
                                radio.value;

                        }

                    }
                );

            }
        );


    validarTransformacion();

}

function validarTransformacion() {

    if (pasoActual !== 3) {
        return;
    }


    const nombres =
        propuestaTransformacion
            .transformations
            .map(
                transformation =>
                    transformation
                        .destinationCollection
                        .trim()
            );


    const existenVacios =
        nombres.some(
            nombre =>
                nombre.length === 0
        );


    const nombresNormalizados =
        nombres.map(
            nombre =>
                nombre.toLowerCase()
        );


    const existenDuplicados =
        new Set(
            nombresNormalizados
        ).size !==
        nombresNormalizados.length;


    btnContinuar.disabled =
        existenVacios ||
        existenDuplicados;

}

function mostrarPasoMigracion() {

    if (
        !propuestaTransformacion ||
        !Array.isArray(
            propuestaTransformacion.transformations
        ) ||
        propuestaTransformacion
            .transformations
            .length === 0
    ) {
        return;
    }


    pasoActual = 4;


    pasoTransformacion.classList.add(
        'd-none'
    );

    pasoMigracion.classList.remove(
        'd-none'
    );


    /* =====================================
       STEPPER
    ===================================== */

    document
        .querySelectorAll('.step')
        .forEach(
            (step, index) => {

                step.classList.toggle(
                    'active',
                    index === 3
                );

            }
        );


    /* =====================================
       RESUMEN
    ===================================== */

    resumenBaseOrigen.textContent =
        document
            .getElementById('pgDatabase')
            .value
            .trim();


    resumenBaseDestino.textContent =
        document
            .getElementById('mongoDatabase')
            .value
            .trim();


    resumenTotalTablas.textContent =
        propuestaTransformacion
            .transformations
            .length;


    const totalRelaciones =
        propuestaTransformacion
            .transformations
            .reduce(
                (total, transformation) =>
                    total +
                    transformation
                        .relationships
                        .length,
                0
            );


    resumenTotalRelaciones.textContent =
        totalRelaciones;


    /* =====================================
       ESTADO
    ===================================== */

    estadoMigracion.className =
        'migration-execution-status ready';

    estadoMigracion.innerHTML = `
        <i class="bi bi-clock"></i>
        Lista para ejecutar
    `;


    resultadoMigracion.className =
        'migration-result d-none';

    resultadoMigracion.innerHTML = '';
    btnValidarIntegridad.disabled = false;


    /* =====================================
       LISTA DE COLECCIONES
    ===================================== */

    renderizarResumenMigracion();


    /* =====================================
       BOTONES INFERIORES
    ===================================== */

    btnVolver.innerHTML = `
        <i class="bi bi-arrow-left"></i>
        Volver a transformación
    `;


    /*
        En el Paso 4 la migración se ejecutará
        mediante su propio botón.
    */

   btnContinuar.classList.remove('d-none');

btnContinuar.disabled = true;

btnContinuar.innerHTML = `
    Continuar a validación
    <i class="bi bi-arrow-right"></i>
`;

}


function renderizarResumenMigracion() {

    listaMigracion.innerHTML = '';


    propuestaTransformacion
        .transformations
        .forEach(
            transformation => {

                const relaciones =
                    transformation
                        .relationships || [];


                const referencias =
                    relaciones.filter(
                        relationship =>
                            relationship.strategy ===
                            'reference'
                    ).length;


                const embebidas =
                    relaciones.filter(
                        relationship =>
                            relationship.strategy ===
                            'embedded'
                    ).length;


                const item =
                    document.createElement('div');


                item.className =
                    'migration-execution-item';


                item.innerHTML = `

                    <div class="migration-item-route">

                        <div>
                            <span>
                                PostgreSQL
                            </span>

                            <strong>
                                ${escapeHtml(
                                    transformation
                                        .sourceTable
                                )}
                            </strong>
                        </div>


                        <i class="bi bi-arrow-right"></i>


                        <div>
                            <span>
                                MongoDB
                            </span>

                            <strong>
                                ${escapeHtml(
                                    transformation
                                        .destinationCollection
                                )}
                            </strong>
                        </div>

                    </div>


                    <div class="migration-item-info">

                        <span>
                            <i class="bi bi-list-columns"></i>

                            ${
                                transformation
                                    .fields
                                    .length
                            }

                            campos
                        </span>


                        <span>
                            <i class="bi bi-link-45deg"></i>

                            ${referencias}

                            referencia${
                                referencias === 1
                                    ? ''
                                    : 's'
                            }
                        </span>


                        <span>
                            <i class="bi bi-box"></i>

                            ${embebidas}

                            embebida${
                                embebidas === 1
                                    ? ''
                                    : 's'
                            }
                        </span>

                    </div>

                `;


                listaMigracion.appendChild(
                    item
                );

            }
        );

}
/* ========================================
   EJECUTAR MIGRACIÓN
======================================== */


async function ejecutarMigracion() {

    if (
        pasoActual !== 4 ||
        !propuestaTransformacion
    ) {
        return;
    }

    limpiarValidacionAnterior();

    const postgresql = {

        host:
            document
                .getElementById('pgHost')
                .value
                .trim(),

        port:
            Number(
                document
                    .getElementById('pgPort')
                    .value
            ),

        database:
            document
                .getElementById('pgDatabase')
                .value
                .trim(),

        user:
            document
                .getElementById('pgUser')
                .value
                .trim(),

        password:
            document
                .getElementById('pgPassword')
                .value
    };

    const mongodb = {

        uri:
            document
                .getElementById('mongoUri')
                .value
                .trim(),

        database:
            document
                .getElementById('mongoDatabase')
                .value
                .trim()

    };

    /* =====================================
       ESTADO: EJECUTANDO
    ===================================== */

    btnEjecutarMigracion.disabled = true;

    btnVolver.disabled = true;

    btnEjecutarMigracion.innerHTML = `
        <span
            class="spinner-border
                   spinner-border-sm"
            role="status">
        </span>

        Migrando datos...
    `;

    estadoMigracion.className =
        'migration-execution-status running';

    estadoMigracion.innerHTML = `
        <i class="bi bi-arrow-repeat"></i>
        Migración en proceso
    `;

    resultadoMigracion.className =
        'migration-result d-none';

    resultadoMigracion.innerHTML = '';

    try {

        const response = await fetch(
            '/api/migraciones/ejecutar',
            {
                method: 'POST',

                headers: {
                    'Content-Type':
                        'application/json',

                    Authorization:
                        `Bearer ${token}`
                },

                body: JSON.stringify({

                    postgresql,

                    mongodb,

                    transformationConfig:
                        propuestaTransformacion

                })
            }
        );

        const data =
            await response.json();

        /* =====================================
           IDENTIFICADOR DEL HISTORIAL
        ===================================== */

        const historialIdMigracion =
            data.historialId ?? null;

        if (response.status === 401) {

            cerrarSesion();

            return;
        }

        if (!response.ok) {

            mostrarErrorMigracion(data);

            return;
        }

        mostrarResultadoMigracion(
            data.data
        );

        /* =====================================
           VALIDACIÓN POSTERIOR A MIGRACIÓN
        ===================================== */

        estadoMigracion.innerHTML = `
            <i class="bi bi-hourglass-split"></i>
            Migración completada.
            Validando cantidad de registros...
        `;

        try {

            const validationResponse = await fetch(
                '/api/validacion/ejecutar',
                {
                    method: 'POST',

                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },

                    body: JSON.stringify({
                        postgresql,
                        mongodb,
                        transformationConfig:
                            propuestaTransformacion,

                        // Asociar esta validación con la migración registrada
                        historialId: historialIdMigracion
                    })
                }
            );

            if (validationResponse.status === 401) {
                cerrarSesion();
                return;
            }

            const validationData =
                await validationResponse.json();

            if (!validationResponse.ok) {
                throw new Error(
                    validationData.message ||
                    'No se pudo validar la migración.'
                );
            }

            const validationResult =
                validationData.data;

            const validationPanel =
                document.createElement('div');

            validationPanel.className =
                'alert alert-info mt-3';

            const title =
                document.createElement('h5');

            title.textContent =
                'Validación de cantidad de registros';

            validationPanel.appendChild(title);

            const summary =
                document.createElement('p');

            summary.textContent =
                `PostgreSQL: ${validationResult.totalSource} | ` +
                `MongoDB: ${validationResult.totalDestination} | ` +
                `Tablas correctas: ${validationResult.correctTables}` +
                `/${validationResult.totalTables}`;

            validationPanel.appendChild(summary);

            const list =
                document.createElement('ul');

            for (const item of validationResult.results) {

                const li =
                    document.createElement('li');

                li.textContent =
                    `${item.table} → ${item.collection}: ` +
                    `${item.sourceCount} / ${item.destinationCount} ` +
                    `(${item.status})`;

                list.appendChild(li);
            }

            validationPanel.appendChild(list);

            resultadoMigracion.appendChild(validationPanel);

            /* =========================================
               MOSTRAR VALIDACIÓN DE CONTENIDO
            ========================================= */

            const content =
                validationResult.contentValidation;

            console.log(
                'Resultado completo de validación:',
                validationResult
            );

            console.log(
                'Validación de contenido recibida:',
                content
            );

            if (content) {

                const contentPanel =
                    document.createElement('div');

                contentPanel.className =
                    'alert alert-light border mt-3';

                const heading =
                    document.createElement('h5');

                heading.textContent =
                    'Validación de integridad de datos';

                contentPanel.appendChild(heading);

                const summary =
                    document.createElement('p');

                summary.textContent =
                    `Integridad verificada: ` +
                    `${content.integrityPercentage ?? 'No calculable'}% | ` +
                    `Correctos: ${content.totalCorrect} | ` +
                    `Inconsistentes: ${content.totalInconsistent} | ` +
                    `Faltantes: ${content.totalMissing}`;

                contentPanel.appendChild(summary);

                const details =
                    document.createElement('ul');

                for (const table of content.results) {

                    const item =
                        document.createElement('li');

                    item.textContent =
                        `${table.table}: ` +
                        `${table.correct}/${table.verified} correctos ` +
                        `(${table.status})`;

                    details.appendChild(item);
                }

                contentPanel.appendChild(details);

                if (!content.contentValidationPassed) {

                    const warning =
                        document.createElement('p');

                    warning.className =
                        'text-danger fw-bold';

                    warning.textContent =
                        'Se detectaron diferencias o tablas no verificables.';

                    contentPanel.appendChild(warning);
                }

                resultadoMigracion.appendChild(contentPanel);
            }

            if (
                !validationResult.countValidationPassed ||
                validationResult.contentValidation
                    ?.contentValidationPassed !== true
            ) {

                notificarDataBridge(
                    'warning',
                    'Migración con diferencias',
                    'La validación detectó inconsistencias. Revisa el resultado.'
                );

            } else {

                notificarDataBridge(
                    'success',
                    'Migración validada',
                    'Los registros migrados superaron la validación de cantidad y contenido.'
                );
            }

            if (!validationResult.countValidationPassed) {

                estadoMigracion.className =
                    'migration-execution-status error';

                estadoMigracion.textContent =
                    'Migración ejecutada, pero se detectaron diferencias de cantidad.';
            }

        } catch (validationError) {

            console.error(
                'Error de validación:',
                validationError
            );

            notificarDataBridge(
                'error',
                'Error al validar la migración',
                validationError.message
            );

            const warning =
                document.createElement('div');

            warning.className =
                'alert alert-warning mt-3';

            warning.textContent =
                'La migración terminó, pero no fue posible ' +
                'completar la validación: ' +
                validationError.message;

            resultadoMigracion.appendChild(warning);
        }

    } catch (error) {

        console.error(
            'Error al ejecutar migración:',
            error
        );

        mostrarErrorMigracion({
            message:
                'No fue posible comunicarse con el servidor.',

            detail:
                error.message
        });

    } finally {

        btnEjecutarMigracion.disabled =
            false;

        btnVolver.disabled =
            false;

        btnEjecutarMigracion.innerHTML = `
            <i class="bi bi-arrow-repeat"></i>
            Ejecutar nuevamente
        `;
    }
}


function mostrarResultadoMigracion(
    resultado
) {

    estadoMigracion.className =
        'migration-execution-status success';

    estadoMigracion.innerHTML = `
        <i class="bi bi-check-circle"></i>
        Migración completada
    `;


    const duracion =
        (
            new Date(resultado.finishedAt) -
            new Date(resultado.startedAt)
        ) / 1000;


    resultadoMigracion.className =
        'migration-result success';


    resultadoMigracion.innerHTML = `

        <div class="migration-result-header">

            <i class="bi bi-check-circle-fill"></i>

            <div>
                <strong>
                    Migración completada correctamente
                </strong>

                <span>
                    Los datos fueron transferidos
                    hacia MongoDB.
                </span>
            </div>

        </div>


        <div class="migration-result-summary">

            <div>
                <span>
                    Tablas procesadas
                </span>

                <strong>
                    ${resultado.totalTables}
                </strong>
            </div>


            <div>
                <span>
                    Registros origen
                </span>

                <strong>
                    ${resultado.totalRecords}
                </strong>
            </div>


            <div>
                <span>
                    Registros migrados
                </span>

                <strong>
                    ${resultado.migratedRecords}
                </strong>
            </div>


            <div>
                <span>
                    Errores
                </span>

                <strong>
                    ${resultado.errors.length}
                </strong>
            </div>


            <div>
                <span>
                    Tiempo
                </span>

                <strong>
                    ${duracion.toFixed(2)} s
                </strong>
            </div>

        </div>

    `;

}


function mostrarErrorMigracion(
    data
) {

    notificarDataBridge('error', 'Migración con errores',
        data.message || data.detail || 'Revisa los detalles del resultado.');

    estadoMigracion.className =
        'migration-execution-status error';

    estadoMigracion.innerHTML = `
        <i class="bi bi-x-circle"></i>
        Migración con errores
    `;


    const resultado =
        data.data;


    let detalleErrores = '';


    if (
        resultado &&
        Array.isArray(resultado.errors) &&
        resultado.errors.length > 0
    ) {

        detalleErrores = `

            <div class="migration-error-list">

                ${resultado.errors
                    .map(
                        error => `

                            <div>
                                <strong>
                                    ${escapeHtml(
                                        error.table
                                    )}
                                </strong>

                                <span>
                                    ${escapeHtml(
                                        error.message
                                    )}
                                </span>
                            </div>

                        `
                    )
                    .join('')}

            </div>
        `;

    }


    resultadoMigracion.className =
        'migration-result error';


    resultadoMigracion.innerHTML = `

        <div class="migration-result-header">

            <i class="bi bi-x-circle-fill"></i>

            <div>

                <strong>
                    La migración no pudo completarse
                    correctamente
                </strong>

                <span>
                    ${escapeHtml(
                        data.message ||
                        data.detail ||
                        'Ocurrió un error durante la migración.'
                    )}
                </span>

            </div>

        </div>

        ${detalleErrores}

    `;

}

btnEjecutarMigracion.addEventListener(
    'click',
    ejecutarMigracion
);
/* ========================================
   VALIDACIÓN INDEPENDIENTE DE INTEGRIDAD
======================================== */

async function validarIntegridadIndependiente() {

    if (pasoActual !== 4 || !propuestaTransformacion) {
        return;
    }

    const postgresql = {
        host: document.getElementById('pgHost').value.trim(),
        port: Number(document.getElementById('pgPort').value),
        database: document.getElementById('pgDatabase').value.trim(),
        user: document.getElementById('pgUser').value.trim(),
        password: document.getElementById('pgPassword').value
    };

    const mongodb = {
        uri: document.getElementById('mongoUri').value.trim(),
        database: document.getElementById('mongoDatabase').value.trim()
    };

    if (
        !postgresql.host ||
        !postgresql.port ||
        !postgresql.database ||
        !postgresql.user ||
        !mongodb.uri ||
        !mongodb.database
    ) {
        alert('Completa los datos de conexión antes de validar.');
        return;
    }

    btnValidarIntegridad.disabled = true;
    btnEjecutarMigracion.disabled = true;

    btnValidarIntegridad.innerHTML = `
        <span class="spinner-border spinner-border-sm"></span>
        Validando...
    `;

    let contenedor = document.getElementById(
        'resultadoValidacionIndependiente'
    );

    if (!contenedor) {
        contenedor = document.createElement('div');
        contenedor.id = 'resultadoValidacionIndependiente';
        contenedor.className = 'mt-3';
        resultadoMigracion.after(contenedor);
    }

    contenedor.innerHTML = '';

    // Mostrar solo la validación independiente al pulsar «Validar integridad».
    // El reporte de migración se conserva en memoria y no se altera el historial.
    resultadoMigracion.classList.add('d-none');

    try {

        const response = await fetch(
            '/api/validacion/ejecutar',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    postgresql,
                    mongodb,
                    transformationConfig: propuestaTransformacion
                })
            }
        );

        if (response.status === 401) {
            cerrarSesion();
            return;
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                'No fue posible completar la validación.'
            );
        }

        const validacion = data.data;
        const contenido = validacion.contentValidation;
        // CONSERVAR EL RESULTADO PARA EL MÓDULO DE REPORTES
sessionStorage.setItem(
    'ultimoReporteValidacion',
    JSON.stringify({
        fecha: new Date().toISOString(),
        baseOrigen: postgresql.database,
        baseDestino: mongodb.database,
        resultado: validacion
    })
);
        

        const cantidadesCorrectas =
            validacion.countValidationPassed === true;

        const contenidoCorrecto =
            contenido?.contentValidationPassed === true;

        const aprobada =
            cantidadesCorrectas && contenidoCorrecto;

        if (aprobada) {
            notificarDataBridge('success', 'Integridad verificada',
                `${contenido.totalCorrect} registros correctos. Integridad: ${contenido.integrityPercentage}%.`);
        } else {
            const inconsistentes = contenido?.totalInconsistent ?? 0;
            const faltantes = contenido?.totalMissing ?? 0;
            notificarDataBridge('warning', 'Se detectaron diferencias',
                `${inconsistentes} inconsistentes, ${faltantes} faltantes. ` +
                'Revisa el detalle de validación para identificar los campos afectados.');
        }

        estadoMigracion.className =
            aprobada
                ? 'migration-execution-status success'
                : 'migration-execution-status error';

        estadoMigracion.textContent =
            aprobada
                ? 'Validación de integridad aprobada'
                : 'Validación finalizada: se detectaron diferencias';

        const panel = document.createElement('div');

        panel.className = aprobada
            ? 'alert alert-success'
            : 'alert alert-warning';

        const titulo = document.createElement('h5');

        titulo.textContent =
            'Resultado de validación independiente';

        panel.appendChild(titulo);

        const resumenCantidad = document.createElement('p');

        resumenCantidad.textContent =
            `Registros PostgreSQL: ${validacion.totalSource} | ` +
            `Registros MongoDB: ${validacion.totalDestination} | ` +
            `Tablas correctas: ${validacion.correctTables}/${validacion.totalTables}`;

        panel.appendChild(resumenCantidad);

        if (contenido) {

            // RESUMEN VISUAL DE INTEGRIDAD
const resumenIntegridad = document.createElement('div');

resumenIntegridad.className = 'row g-3 my-3';

const indicadores = [
    {
        titulo: 'Integridad',
        valor: `${contenido.integrityPercentage ?? 'No calculable'}%`,
        icono: 'bi-shield-check',
        color: 'primary'
    },
    {
        titulo: 'Registros correctos',
        valor: contenido.totalCorrect,
        icono: 'bi-check-circle',
        color: 'success'
    },
    {
        titulo: 'Inconsistencias',
        valor: contenido.totalInconsistent,
        icono: 'bi-exclamation-triangle',
        color: 'warning'
    },
    {
        titulo: 'Registros faltantes',
        valor: contenido.totalMissing,
        icono: 'bi-x-circle',
        color: 'danger'
    }
];

indicadores.forEach(indicador => {

    const columna = document.createElement('div');
    columna.className = 'col-6 col-lg-3';

    const tarjeta = document.createElement('div');
    tarjeta.className =
        'bg-white border rounded-3 p-3 h-100 text-center shadow-sm';

    const icono = document.createElement('i');
    icono.className =
        `bi ${indicador.icono} text-${indicador.color} fs-4`;

    const valor = document.createElement('div');
    valor.className = 'fs-4 fw-bold text-dark my-1';
    valor.textContent = indicador.valor;

    const titulo = document.createElement('div');
    titulo.className = 'small text-secondary';
    titulo.textContent = indicador.titulo;

    tarjeta.append(icono, valor, titulo);
    columna.appendChild(tarjeta);
    resumenIntegridad.appendChild(columna);

});

panel.appendChild(resumenIntegridad);

            // RESULTADOS DE VALIDACIÓN POR TABLA
const tituloTablas = document.createElement('h6');
tituloTablas.className = 'fw-bold mt-4 mb-3';
tituloTablas.textContent = 'Resultados por tabla';
panel.appendChild(tituloTablas);

const contenedorTabla = document.createElement('div');
contenedorTabla.className = 'table-responsive';

const tablaResultados = document.createElement('table');
tablaResultados.className =
    'table table-bordered table-hover align-middle bg-white';

tablaResultados.innerHTML = `
    <thead class="table-light">
        <tr>
            <th>Tabla PostgreSQL</th>
            <th class="text-center">Verificados</th>
            <th class="text-center">Correctos</th>
            <th class="text-center">Inconsistentes</th>
            <th class="text-center">Estado</th>
        </tr>
    </thead>
    <tbody></tbody>
`;

const cuerpoTabla = tablaResultados.querySelector('tbody');

for (const tabla of contenido.results) {

    const inconsistentes = Math.max(
        0,
        Number(tabla.verified || 0) -
        Number(tabla.correct || 0)
    );

    const correcta =
        tabla.status === 'CORRECTO';

    const fila = document.createElement('tr');

    const datos = [
        tabla.table,
        tabla.verified,
        tabla.correct,
        inconsistentes
    ];

    datos.forEach((dato, indice) => {

        const celda = document.createElement('td');

        celda.textContent = dato;

        if (indice > 0) {
            celda.className = 'text-center';
        } else {
            celda.className = 'fw-semibold';
        }

        fila.appendChild(celda);
    });

    const celdaEstado = document.createElement('td');
    celdaEstado.className = 'text-center';

    const estado = document.createElement('span');

    estado.className = correcta
        ? 'badge bg-success'
        : 'badge bg-warning text-dark';

    estado.textContent = correcta
        ? 'Correcto'
        : tabla.status || 'Revisar';

    celdaEstado.appendChild(estado);
    fila.appendChild(celdaEstado);

    cuerpoTabla.appendChild(fila);
}

contenedorTabla.appendChild(tablaResultados);
panel.appendChild(contenedorTabla);
            // Mostrar detalle de inconsistencias
for (const tabla of contenido.results) {

    if (!tabla.errors || tabla.errors.length === 0) {
        continue;
    }

    // ENCABEZADO DE INCONSISTENCIAS POR TABLA
const encabezadoErrores = document.createElement('div');

encabezadoErrores.className =
    'd-flex flex-wrap align-items-center gap-2 mt-4 mb-3';

const iconoErrores = document.createElement('i');

iconoErrores.className =
    'bi bi-exclamation-triangle-fill text-warning fs-5';

const tituloErrores = document.createElement('h6');

tituloErrores.className = 'fw-bold mb-0 text-dark';

tituloErrores.textContent =
    `Inconsistencias detectadas en ${tabla.table}`;

const contadorErrores = document.createElement('span');

contadorErrores.className =
    'badge bg-warning text-dark';

contadorErrores.textContent =
    `${tabla.errors.length} ${
        tabla.errors.length === 1 ? 'error' : 'errores'
    }`;

encabezadoErrores.append(
    iconoErrores,
    tituloErrores,
    contadorErrores
);

panel.appendChild(encabezadoErrores);

    for (const error of tabla.errors) {
        const detalle = document.createElement('div');
        detalle.className = 'border rounded-3 p-3 mb-3 bg-white text-dark';

        const tiposError = {
            CONTENT_MISMATCH: 'Contenido diferente',
            MISSING_RECORD: 'Registro faltante',
            DUPLICATE_KEY: 'Clave duplicada'
        };

        const encabezado = document.createElement('div');
        encabezado.className = 'd-flex flex-wrap justify-content-between align-items-center gap-2 mb-3';

        const registro = document.createElement('strong');
        registro.textContent = `Registro: ${JSON.stringify(error.key ?? {})}`;
        encabezado.appendChild(registro);

        const tipo = document.createElement('span');
        tipo.className = 'badge bg-danger-subtle text-danger border border-danger-subtle';
        tipo.textContent = tiposError[error.type] || error.type || 'Error de validación';
        encabezado.appendChild(tipo);
        detalle.appendChild(encabezado);

        const tiposDiferencia = {
            VALUE_MISMATCH: 'Valor diferente',
            MISSING_FIELD: 'Campo faltante',
            EXTRA_FIELD: 'Campo adicional'
        };
        const sugerencias = {
            VALUE_MISMATCH: 'Verifique el valor del campo en MongoDB y compárelo con PostgreSQL. Si corresponde, actualice el dato de destino.',
            MISSING_FIELD: 'Revise la transformación y compruebe que el campo exista en el documento de MongoDB.',
            EXTRA_FIELD: 'Revise si el campo adicional es necesario. Si no forma parte de la estructura esperada, considere eliminarlo.'
        };

        const agregarDato = (padre, etiqueta, valor) => {
            const bloque = document.createElement('div');
            bloque.className = 'mb-2';
            const titulo = document.createElement('div');
            titulo.className = 'small text-secondary fw-semibold mb-1';
            titulo.textContent = etiqueta;
            const contenidoDato = document.createElement('div');
            contenidoDato.className = 'text-break';
            contenidoDato.style.overflowWrap = 'anywhere';
            contenidoDato.textContent = valor;
            bloque.append(titulo, contenidoDato);
            padre.appendChild(bloque);
        };

        for (const diferencia of error.differences || []) {
            const bloque = document.createElement('div');
            bloque.className = 'border-top pt-3 mt-2';

            const fila = document.createElement('div');
            fila.className = 'row g-2 mb-2';
            const columnaCampo = document.createElement('div');
            columnaCampo.className = 'col-12 col-md-6';
            agregarDato(columnaCampo, 'Campo afectado', String(diferencia.field ?? 'No disponible'));
            const columnaError = document.createElement('div');
            columnaError.className = 'col-12 col-md-6';
            agregarDato(columnaError, 'Tipo de diferencia', tiposDiferencia[diferencia.type] || diferencia.type || 'No disponible');
            fila.append(columnaCampo, columnaError);
            bloque.appendChild(fila);

            if (Object.prototype.hasOwnProperty.call(diferencia, 'expected')) {
                agregarDato(bloque, 'Valor esperado (PostgreSQL)', JSON.stringify(diferencia.expected));
            }
            if (Object.prototype.hasOwnProperty.call(diferencia, 'actual')) {
                agregarDato(bloque, 'Valor encontrado (MongoDB)', JSON.stringify(diferencia.actual));
            }

            const sugerencia = document.createElement('div');
            sugerencia.className = 'alert alert-primary py-2 px-3 mt-3 mb-1 small';
            const tituloSugerencia = document.createElement('strong');
            tituloSugerencia.textContent = 'Sugerencia de solución';
            const textoSugerencia = document.createElement('div');
            textoSugerencia.className = 'mt-1';
            textoSugerencia.textContent = sugerencias[diferencia.type] ||
                'Revise la configuración de transformación y los datos.';
            sugerencia.append(tituloSugerencia, textoSugerencia);
            bloque.appendChild(sugerencia);
            detalle.appendChild(bloque);
        }

        if (!error.differences || error.differences.length === 0) {
            agregarDato(detalle, 'Descripción', 'Revise el registro indicado y verifique su existencia y clave en MongoDB.');
        }
        panel.appendChild(detalle);
    }
}
        }

        // CONCLUSIÓN AUTOMÁTICA DE VALIDACIÓN
const conclusion = document.createElement('div');

conclusion.className = aprobada
    ? 'alert alert-success mt-4 mb-0'
    : 'alert alert-warning mt-4 mb-0';

const tituloConclusion = document.createElement('h6');
tituloConclusion.className = 'fw-bold mb-2';

tituloConclusion.textContent = aprobada
    ? 'Validación de integridad satisfactoria'
    : 'Validación de integridad con observaciones';

const textoConclusion = document.createElement('p');
textoConclusion.className = 'mb-0';

if (aprobada) {

    textoConclusion.textContent =
        `La validación finalizó satisfactoriamente. ` +
        `Se verificaron ${contenido.totalCorrect} registros ` +
        `con una integridad del ${contenido.integrityPercentage}%. ` +
        `No se detectaron diferencias en los datos evaluados.`;

} else {

    const inconsistentes = contenido?.totalInconsistent ?? 0;
    const faltantes = contenido?.totalMissing ?? 0;
    const porcentaje = contenido?.integrityPercentage ?? 'No calculable';

    textoConclusion.textContent =
        `La validación finalizó con observaciones. ` +
        `Se obtuvo una integridad del ${porcentaje}%, ` +
        `con ${inconsistentes} registros inconsistentes y ` +
        `${faltantes} registros faltantes. ` +
        `Se recomienda revisar los detalles identificados ` +
        `y corregir las diferencias antes de considerar ` +
        `la migración completamente validada.`;
}

conclusion.append(tituloConclusion, textoConclusion);
panel.appendChild(conclusion);

        contenedor.appendChild(panel);
        
        // ANÁLISIS DE INTEGRIDAD CON INTELIGENCIA ARTIFICIAL
        const panelIA = document.createElement('div');
        panelIA.className = 'card border-primary mt-4';

        const cuerpoIA = document.createElement('div');
        cuerpoIA.className = 'card-body';

        const tituloIA = document.createElement('h5');
        tituloIA.className = 'card-title fw-bold';
        tituloIA.textContent = 'Asistente de inteligencia artificial';

        const descripcionIA = document.createElement('p');
        descripcionIA.className = 'text-secondary';
        descripcionIA.textContent =
    'El asistente de inteligencia artificial analiza los resultados ' +
    'de integridad y ofrece explicaciones y recomendaciones técnicas.';

        const botonIA = document.createElement('button');
        botonIA.type = 'button';
        botonIA.className = 'btn btn-primary';
        botonIA.textContent = 'Analizar con IA';

        const resultadoIA = document.createElement('div');
resultadoIA.className = 'mt-3 analisis-ia';
resultadoIA.style.whiteSpace = 'normal';

        botonIA.addEventListener('click', async () => {
            botonIA.disabled = true;
            botonIA.textContent = 'Analizando con IA...';
            resultadoIA.textContent = 'Generando recomendaciones...';

            try {
                const response = await fetch('/api/ia/analizar', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        validacion: {
                            contentValidation: {
                                totalCorrect: contenido.totalCorrect,
                                totalInconsistent: contenido.totalInconsistent,
                                totalMissing: contenido.totalMissing,
                                integrityPercentage: contenido.integrityPercentage,
                                // Solo metadatos: no enviar claves ni valores de registros.
                                results: (Array.isArray(contenido.results) ? contenido.results : []).map(tabla => ({
                                    table: tabla.table,
                                    status: tabla.status,
                                    verified: tabla.verified,
                                    correct: tabla.correct,
                                    errors: (Array.isArray(tabla.errors) ? tabla.errors : []).map(error => ({
                                        type: error.type,
                                        differences: (Array.isArray(error.differences) ? error.differences : []).map(diferencia => ({
                                            field: diferencia.field,
                                            type: diferencia.type
                                        }))
                                    }))
                                }))
                            }
                        }
                    })
                });

                if (response.status === 401) {
                    cerrarSesion();
                    return;
                }

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message || 'No se pudo generar el análisis.'
                    );
                }

                
const analisis = data.data.analisis;

if (typeof marked === 'undefined' ||
    typeof DOMPurify === 'undefined') {
    resultadoIA.textContent = analisis;
    console.warn('Marked o DOMPurify no están disponibles.');
} else {
    const html = marked.parse(analisis);
    resultadoIA.innerHTML = DOMPurify.sanitize(html);
}


            } catch (error) {
                resultadoIA.textContent =
                    'Error al consultar la IA: ' + error.message;
            } finally {
                botonIA.disabled = false;
                botonIA.textContent = 'Analizar con IA';
            }
        });

        cuerpoIA.append(tituloIA, descripcionIA, botonIA, resultadoIA);
        panelIA.appendChild(cuerpoIA);
        contenedor.appendChild(panelIA);

        // Habilitar la etapa 5 cuando el reporte ya está preparado
btnContinuar.disabled = false;

btnContinuar.classList.remove('d-none');

btnContinuar.innerHTML = `
    Continuar a validación
    <i class="bi bi-arrow-right"></i>
`;

        console.log(
            'Resultado de validación independiente:',
            validacion
        );

    } catch (error) {

        console.error('Error de validación:', error);

        notificarDataBridge('error', 'No se pudo validar', error.message);

        estadoMigracion.className =
            'migration-execution-status error';

        estadoMigracion.textContent =
            'No se pudo completar la validación';

        const mensajeError = document.createElement('div');

        mensajeError.className = 'alert alert-danger';

        mensajeError.textContent =
            'Error al validar: ' + error.message;

        contenedor.appendChild(mensajeError);

    } finally {

        btnValidarIntegridad.disabled = false;
        btnEjecutarMigracion.disabled = false;

        btnValidarIntegridad.innerHTML = `
            <i class="bi bi-shield-check"></i>
            Validar integridad
        `;
    }
}

btnValidarIntegridad.addEventListener(
    'click',
    validarIntegridadIndependiente
);



/* ========================================
   CONTINUAR
======================================== */

function actualizarContinuar() {

    btnContinuar.disabled =
        !(
            postgresqlVerificado &&
            mongodbVerificado
        );

}


/* ========================================
   CERRAR SESIÓN
======================================== */

document
    .getElementById('btnCerrarSesion')
    .addEventListener(
        'click',
        cerrarSesion
    );


function cerrarSesion() {

    localStorage.removeItem('token');
    localStorage.removeItem('usuario');

    window.location.replace('/login.html');

}