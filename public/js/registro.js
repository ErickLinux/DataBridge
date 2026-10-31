const registroForm = document.getElementById('registroForm');
const mensaje = document.getElementById('mensaje');

registroForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    ocultarMensaje();

    const nombre = document.getElementById('nombre').value.trim();
    const correo = document.getElementById('correo').value.trim();
    const password = document.getElementById('password').value;
    const confirmarPassword =
        document.getElementById('confirmarPassword').value;

    if (password !== confirmarPassword) {
        mostrarMensaje(
            'Las contraseñas no coinciden.',
            'danger'
        );

        return;
    }

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify({
                nombre,
                correo,
                password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            mostrarMensaje(
                data.message || 'No fue posible crear la cuenta.',
                'danger'
            );

            return;
        }

        mostrarMensaje(
            'Cuenta creada correctamente. Redirigiendo...',
            'success'
        );

        registroForm.reset();

        setTimeout(() => {
            window.location.href = '/login.html';
        }, 1200);

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