import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

// Import routes
import musteriRoutes from './routes/musteri.js';
import randevuRoutes from './routes/randevu.js';
import hizmetRoutes from './routes/hizmet.js';
import ilceRoutes from './routes/ilce.js';
import kampanyaRoutes from './routes/kampanya.js';
import memnuniyetRoutes from './routes/memnuniyet.js';
import masrafRoutes from './routes/masraf.js';
import rakipRoutes from './routes/rakip.js';
import subeRoutes from './routes/sube.js';
import dssRoutes from './routes/dssRoutes.js';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// Root endpoint
app.get("/", (req, res) => {
  res.send("Venus Beauty Salon DSS API is running 💖");
});

// Routes
app.use('/api/musteri', musteriRoutes);
app.use('/api/randevu', randevuRoutes);
app.use('/api/hizmet', hizmetRoutes);
app.use('/api/ilce', ilceRoutes);
app.use('/api/kampanya', kampanyaRoutes);
app.use('/api/memnuniyet', memnuniyetRoutes);
app.use('/api/masraf', masrafRoutes);
app.use('/api/rakip', rakipRoutes);
app.use('/api/sube', subeRoutes);
app.use('/api/dss', dssRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", db: "connected" });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

// Test MySQL connection
async function testDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("✅ MySQL bağlantısı başarılı");
  } catch (error) {
    console.error("❌ MySQL bağlantı hatası:", error.message);
  }
}

// Log database connection info (without password)
function logDatabaseInfo() {
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    try {
      // Parse DATABASE_URL: mysql://user:password@host:port/database
      const url = new URL(dbUrl);
      const host = url.hostname;
      const port = url.port || '3306';
      const database = url.pathname.replace('/', '');
      console.log(`📊 Database: ${host}:${port}/${database}`);
    } catch (error) {
      console.log(`📊 Database URL loaded (format check failed)`);
    }
  } else {
    console.warn('⚠️  DATABASE_URL not found in .env');
  }
}

// Start server
app.listen(PORT, async () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    logDatabaseInfo();
    await testDatabaseConnection();
  });
  
export { prisma };
