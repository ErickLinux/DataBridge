const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// Registrar usuario
async function register(req, res) {
    try {
        const { nombre, correo, password } = req.body;

        if (!nombre || !correo || !password) {
            return res.status(400).json({
                success: false,
                message: 'Nombre, correo y contraseña son obligatorios.'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe tener al menos 6 caracteres.'
            });
        }

        const correoNormalizado = correo.trim().toLowerCase();

        const usuarioExistente = await pool.query(
            'SELECT id FROM usuarios WHERE correo = $1',
            [correoNormalizado]
        );

        if (usuarioExistente.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Ya existe un usuario registrado con ese correo.'
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const resultado = await pool.query(
            `INSERT INTO usuarios
                (nombre, correo, password_hash)
             VALUES ($1, $2, $3)
             RETURNING id, nombre, correo, activo, fecha_creacion`,
            [nombre.trim(), correoNormalizado, passwordHash]
        );

        return res.status(201).json({
            success: true,
            message: 'Usuario registrado correctamente.',
            usuario: resultado.rows[0]
        });

    } catch (error) {
        console.error('Error al registrar usuario:', error);

        return res.status(500).json({
            success: false,
            message: 'Error interno al registrar el usuario.'
        });
    }
}

// Iniciar sesión
async function login(req, res) {
    try {
        const { correo, password } = req.body;

        if (!correo || !password) {
            return res.status(400).json({
                success: false,
                message: 'Correo y contraseña son obligatorios.'
            });
        }

        const correoNormalizado = correo.trim().toLowerCase();

        const resultado = await pool.query(
            `SELECT id, nombre, correo, password_hash, activo
             FROM usuarios
             WHERE correo = $1`,
            [correoNormalizado]
        );

        if (resultado.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales incorrectas.'
            });
        }

        const usuario = resultado.rows[0];

        if (!usuario.activo) {
            return res.status(403).json({
                success: false,
                message: 'El usuario se encuentra desactivado.'
            });
        }

        const passwordValido = await bcrypt.compare(
            password,
            usuario.password_hash
        );

        if (!passwordValido) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales incorrectas.'
            });
        }

        const token = jwt.sign(
            {
                id: usuario.id,
                correo: usuario.correo
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '8h'
            }
        );

        return res.json({
            success: true,
            message: 'Inicio de sesión correcto.',
            token,
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                correo: usuario.correo
            }
        });

    } catch (error) {
        console.error('Error al iniciar sesión:', error);

        return res.status(500).json({
            success: false,
            message: 'Error interno al iniciar sesión.'
        });
    }
}

module.exports = {
    register,
    login
};