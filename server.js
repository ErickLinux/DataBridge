require('dotenv').config();

const app = require('./src/app');
const { connectDatabase } = require('./src/config/database');

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        await connectDatabase();

        app.listen(PORT, () => {
            console.log('==============================================');
            console.log('  MIGRADOR POSTGRESQL → MONGODB');
            console.log('==============================================');
            console.log(`Servidor ejecutándose en el puerto ${PORT}`);
            console.log(`http://localhost:${PORT}`);
            console.log('==============================================');
        });
    } catch (error) {
        console.error('No fue posible iniciar la aplicación.');
        process.exit(1);
    }
}

startServer();