import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
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

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Root endpoint
app.get("/", (req, res) => {
  res.send("Venus Beauty Salon DSS API is running 💖");
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Venüs DSS API is running' });
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

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

export { prisma };
