const API_URL = 'http://localhost:8000/api';

const formulario = document.querySelector(
    '#formulario-password'
);

const campoUsuario = document.querySelector(
    '#usuario'
);

const campoPassword = document.querySelector(
    '#nueva-password'
);

const campoConfirmacion = document.querySelector(
    '#confirmar-password'
);

const mensajeError = document.querySelector(
    '#mensaje-error'
);

const mensajeExito = document.querySelector(
    '#mensaje-exito'
);

const botonLogout = document.querySelector(
    '#boton-logout'
);


async function cargarUsuarios() {
    try {
        const respuesta = await fetch(
            API_URL + '/usuarios',
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
                'No fue posible obtener los usuarios.'
            );
        }

        mostrarUsuarios(datos.usuarios);
    } catch (error) {
        mostrarError(error.message);
    }
}


function mostrarUsuarios(usuarios) {
    usuarios.forEach(function (usuario) {
        const opcion = document.createElement('option');

        opcion.value = usuario.id_usuario;

        opcion.textContent =
            usuario.usuario +
            ' - ' +
            usuario.rol;

        if (Number(usuario.activo) === 0) {
            opcion.textContent += ' - Inactivo';
        }

        campoUsuario.appendChild(opcion);
    });
}


formulario.addEventListener(
    'submit',
    async function (eventoEnvio) {
        eventoEnvio.preventDefault();

        ocultarMensajes();

        const idUsuario = Number(
            campoUsuario.value
        );

        const nuevaPassword =
            campoPassword.value;

        const confirmarPassword =
            campoConfirmacion.value;

        if (idUsuario <= 0) {
            mostrarError(
                'Debes seleccionar un usuario.'
            );

            return;
        }

        if (nuevaPassword.length < 8) {
            mostrarError(
                'La contraseña debe tener al menos 8 caracteres.'
            );

            return;
        }

        if (nuevaPassword !== confirmarPassword) {
            mostrarError(
                'Las contraseñas no coinciden.'
            );

            return;
        }

        try {
            const respuesta = await fetch(
                API_URL + '/usuarios/password',
                {
                    method: 'PUT',

                    headers: {
                        'Content-Type': 'application/json'
                    },

                    credentials: 'include',

                    body: JSON.stringify({
                        id_usuario: idUsuario,
                        nueva_password: nuevaPassword
                    })
                }
            );

            const datos = await respuesta.json();

            if (
                respuesta.status === 401 ||
                respuesta.status === 403
            ) {
                window.location.replace('../index.html');
                return;
            }

            if (!respuesta.ok) {
                throw new Error(
                    datos.error ||
                    'No fue posible restaurar la contraseña.'
                );
            }

            mensajeExito.textContent = datos.mensaje;
            mensajeExito.hidden = false;

            formulario.reset();
        } catch (error) {
            mostrarError(error.message);
        }
    }
);


function mostrarError(mensaje) {
    mensajeError.textContent = mensaje;
    mensajeError.hidden = false;
}


function ocultarMensajes() {
    mensajeError.textContent = '';
    mensajeError.hidden = true;

    mensajeExito.textContent = '';
    mensajeExito.hidden = true;
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


cargarUsuarios();