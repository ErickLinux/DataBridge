const loginForm = document.getElementById('loginForm');
const mensaje = document.getElementById('mensaje');

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    ocultarMensaje();

    const correo = document.getElementById('correo').value.trim();
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify({
                correo,
                password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            mostrarMensaje(
                data.message || 'No fue posible iniciar sesión.',
                'danger'
            );

            return;
        }

        // Guardar el JWT
        localStorage.setItem('token', data.token);

        // Guardar información básica del usuario
        localStorage.setItem(
            'usuario',
            JSON.stringify(data.usuario)
        );

        mostrarMensaje(
            'Inicio de sesión correcto.',
            'success'
        );

        setTimeout(() => {
            window.location.href = '/dashboard.html';
        }, 700);

    } catch (error) {
        console.error(error);

        mostrarMensaje(
            'No fue posible conectar con el servidor.',
            'danger'
        );
    }
});

function mostrarMensaje(texto, tipo) {
    mensaje.textContent = texto;
    mensaje.className = `alert alert-${tipo}`;
}

function ocultarMensaje() {
    mensaje.textContent = '';
    mensaje.className = 'alert d-none';
}