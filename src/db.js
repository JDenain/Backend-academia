import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Obtener __dirname equivalente en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar .env desde la raíz del proyecto
dotenv.config({ path: path.join(__dirname, '../.env') });

// Configuración del pool
const pool = new Pool({
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  port: process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : 5432,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Función de prueba de conexión
const testConnection = async () => {
  let client;
  try {
    client = await pool.connect();
    console.log('✅ Conexión a PostgreSQL establecida correctamente');
  } catch (err) {
    console.error('❌ Error al conectar a PostgreSQL:', err.message);
    process.exit(1);
  } finally {
    if (client) client.release();
  }
};

// Ejecutar prueba inmediatamente
testConnection();

export { pool, testConnection };