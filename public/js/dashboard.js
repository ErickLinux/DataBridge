const token = localStorage.getItem('token');
const usuarioGuardado = localStorage.getItem('usuario');

if (!token) {
    window.location.replace('/login.html');
} else {
    validarSesion();
}

if (usuarioGuardado) {
    const usuario = JSON.parse(usuarioGuardado);

    document.getElementById('nombreUsuario').textContent =
        usuario.nombre;
}

async function validarSesion() {
    try {
        const response = await fetch('/api/usuarios/perfil', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) {
            cerrarSesion();
        }

    } catch (error) {
        console.error('Error al validar sesión:', error);
    }
}

document
    .getElementById('btnCerrarSesion')
    .addEventListener('click', cerrarSesion);

function cerrarSesion() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');

    window.location.replace('/login.html');
}