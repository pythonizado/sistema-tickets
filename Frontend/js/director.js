const API_URL = 'http://localhost:8000/api';

const listaTickets =
    document.querySelector('#lista-tickets');

const mensajeError =
    document.querySelector('#mensaje-error');

const botonLogout =
    document.querySelector('#boton-logout');


async function cargarTickets() {
    ocultarError();

    try {
        const respuesta = await fetch(
            API_URL + '/director/tickets',
            {
                method: 'GET',
                credentials: 'include'
            }
        );

        if (
            respuesta.status === 401 ||
            respuesta.status === 403
        ) {
            window.location.replace('../index.html');
            return;
        }

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                datos.error ||
                'No fue posible obtener los tickets.'
            );
        }

        mostrarTickets(datos.tickets, datos.historial);
    } catch (error) {
        mostrarError(error.message);
    }
}


function mostrarTickets(tickets, historialCompleto) {
    listaTickets.textContent = '';

    if (tickets.length === 0) {
        const fila = document.createElement('tr');
        const celda = document.createElement('td');

        celda.textContent = 'No existen tickets registrados.';
        celda.colSpan = 10;

        fila.appendChild(celda);
        listaTickets.appendChild(fila);

        return;
    }

    tickets.forEach(function (ticket) {
        const fila = document.createElement('tr');
         const historialTicket = historialCompleto.filter(
            function (cambio) {
                return Number(cambio.id_ticket) ===
                    Number(ticket.id_ticket);
            }
        );

        agregarCelda(fila, ticket.id_ticket);
        agregarCelda(fila, ticket.descripcion);
        agregarCelda(fila, ticket.sala || 'Sin sala');

        agregarEtiqueta(
            fila,
            ticket.prioridad,
            obtenerClasePrioridad(ticket.prioridad)
        );

        agregarEtiqueta(
            fila,
            ticket.estado,
            obtenerClaseEstado(ticket.estado)
        );

        agregarCelda(fila, ticket.creador);
        agregarCelda(fila, formatearFecha(ticket.fecha));
        agregarCelda(fila, calcularTiempoAbiertoProceso(historialTicket));
        agregarCelda(fila, calcularTiempoProcesoFinal(historialTicket));

        listaTickets.appendChild(fila);
    });
}

function agregarHistorial(fila, historial) {
    const celda = document.createElement('td');
    const lista = document.createElement('ul');

    lista.classList.add('historial-estados');

    historial.forEach(function (cambio) {
        const elemento = document.createElement('li');

        elemento.textContent =
            cambio.estado +
            ': ' +
            formatearFecha(cambio.fecha);

        lista.appendChild(elemento);
    });

    celda.appendChild(lista);
    fila.appendChild(celda);
}

function buscarCambioEstado(
    historial,
    nombreEstado,
    posicionInicial
) {
    for (
        let posicion = posicionInicial;
        posicion < historial.length;
        posicion++
    ) {
        if (
            historial[posicion].estado === nombreEstado
        ) {
            return {
                cambio: historial[posicion],
                posicion: posicion
            };
        }
    }

    return null;
}

function calcularTiempoAbiertoProceso(historial) {
    const abierto = buscarCambioEstado(
        historial,
        'Abierto',
        0
    );

    if (abierto === null) {
        return 'Sin información';
    }

    const enProceso = buscarCambioEstado(
        historial,
        'En proceso',
        abierto.posicion + 1
    );

    if (enProceso === null) {
        return 'En proceso';
    }

    return calcularDuracion(
        abierto.cambio.fecha,
        enProceso.cambio.fecha
    );
}

function calcularTiempoProcesoFinal(historial) {
    const enProceso = buscarCambioEstado(
        historial,
        'En proceso',
        0
    );

    if (enProceso === null) {
        return 'Abierto';
    }

    let cambioFinal = null;

    for (
        let posicion = enProceso.posicion + 1;
        posicion < historial.length;
        posicion++
    ) {
        const estado = historial[posicion].estado;

        if (
            estado === 'Cerrado' ||
            estado === 'Fuera de alcance'
        ) {
            cambioFinal = historial[posicion];
            break;
        }
    }

    if (cambioFinal === null) {
        return 'No finalizado';
    }

    return calcularDuracion(
        enProceso.cambio.fecha,
        cambioFinal.fecha
    );
}

function calcularDuracion(fechaInicial, fechaFinal) {
    const inicio = convertirFechaMySQL(fechaInicial);
    const final = convertirFechaMySQL(fechaFinal);

    const diferenciaMilisegundos = final - inicio;

    if (diferenciaMilisegundos < 0) {
        return 'Fechas incorrectas';
    }

    const minutosTotales = Math.floor(
        diferenciaMilisegundos / 60000
    );

    const dias = Math.floor(
        minutosTotales / 1440
    );

    const horas = Math.floor(
        (minutosTotales % 1440) / 60
    );

    const minutos = minutosTotales % 60;

    let resultado = '';

    if (dias > 0) {
        resultado += dias + ' d ';
    }

    if (horas > 0 || dias > 0) {
        resultado += horas + ' h ';
    }

    resultado += minutos + ' min';

    return resultado;
}

function convertirFechaMySQL(fecha) {
    return new Date(
        fecha.replace(' ', 'T')
    );
}

function agregarCelda(fila, contenido) {
    const celda = document.createElement('td');

    celda.textContent = contenido;

    fila.appendChild(celda);
}


function agregarEtiqueta(fila, contenido, clase) {
    const celda = document.createElement('td');
    const etiqueta = document.createElement('span');

    etiqueta.textContent = contenido;

    etiqueta.classList.add(
        'etiqueta',
        clase
    );

    celda.appendChild(etiqueta);
    fila.appendChild(celda);
}


function obtenerClasePrioridad(prioridad) {
    const nombre = prioridad.toLowerCase();

    if (nombre === 'fatal') {
        return 'prioridad-fatal';
    }

    if (nombre === 'alta') {
        return 'prioridad-alta';
    }

    if (nombre === 'media') {
        return 'prioridad-media';
    }

    return 'prioridad-baja';
}


function obtenerClaseEstado(estado) {
    const nombre = estado.toLowerCase();

    if (nombre === 'abierto') {
        return 'estado-abierto';
    }

    if (nombre === 'en proceso') {
        return 'estado-en-proceso';
    }

    if (nombre === 'cerrado') {
        return 'estado-cerrado';
    }

    return 'estado-fuera-de-alcance';
}


function formatearFecha(fecha) {
    if (!fecha) {
        return 'Sin fecha';
    }

    const fechaConvertida =
        convertirFechaMySQL(fecha);

    return fechaConvertida.toLocaleString(
        'es-UY'
    );
}


function mostrarError(mensaje) {
    mensajeError.textContent = mensaje;
    mensajeError.hidden = false;
}


function ocultarError() {
    mensajeError.textContent = '';
    mensajeError.hidden = true;
}


botonLogout.addEventListener(
    'click',
    async function () {
        try {
            await fetch(
                API_URL + '/logout',
                {
                    method: 'POST',
                    credentials: 'include'
                }
            );
        } finally {
            window.location.replace('../index.html');
        }
    }
);


cargarTickets();