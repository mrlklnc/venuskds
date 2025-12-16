import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Parse DATABASE_URL
const dbUrl = process.env.DATABASE_URL;
let config = {};

if (dbUrl) {
  try {
    const url = new URL(dbUrl);
    config = {
      host: url.hostname,
      port: parseInt(url.port) || 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.replace('/', ''),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    };
  } catch (error) {
    console.error('Error parsing DATABASE_URL:', error);
    // Fallback to individual env variables
    config = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'venus_db',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    };
  }
} else {
  // Use individual environment variables
  config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'venus_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };
}

// Create connection pool
const pool = mysql.createPool(config);

// Test connection
pool.getConnection()
  .then(connection => {
    console.log('✅ MySQL bağlantısı başarılı');
    connection.release();
  })
  .catch(error => {
    console.error('❌ MySQL bağlantı hatası:', error.message);
  });

export default pool;






