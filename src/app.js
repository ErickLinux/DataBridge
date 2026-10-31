const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Rutas
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const connectionRoutes = require('./routes/connectionRoutes');
const transformationRoutes =
    require('./routes/transformationRoutes');
    const migrationRoutes =
    require('./routes/migrationRoutes');
const validationRoutes =
    require('./routes/validationRoutes');
    const historialRoutes =
    require('./routes/historialRoutes');
const aiRoutes = require('./routes/aiRoutes');
const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Archivos estáticos
app.use(express.static('public'));

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', userRoutes);
app.use('/api/conexiones', connectionRoutes);
app.use('/api/transformacion',transformationRoutes);
app.use('/api/migraciones',migrationRoutes);
app.use('/api/validacion', validationRoutes);
app.use('/api/historial', historialRoutes);
app.use('/api/ia', aiRoutes);

// Ruta principal
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Herramienta de migración PostgreSQL → MongoDB',
        status: 'Servidor funcionando correctamente'
    });
});



module.exports = app;