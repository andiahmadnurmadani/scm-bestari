import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import harvestRoutes from './routes/harvestRoutes.js';
import varietyRoutes from './routes/varietyRoutes.js';
import landRoutes from './routes/landRoutes.js';
import equipmentRoutes from './routes/equipmentRoutes.js';
import productionRoutes from './routes/productionRoutes.js';
import certificateRoutes from './routes/certificateRoutes.js';
import packagingRoutes from './routes/packagingRoutes.js';
import logisticsRoutes from './routes/logisticsRoutes.js';
import cmsRoutes from './routes/cmsRoutes.js';
import notificationsRoutes from './routes/notificationsRoutes.js';
import apiKeyRoutes from './routes/apiKeyRoutes.js';
import { openApiSpec } from './openapi.js';
import { apiReference } from '@scalar/express-api-reference';
import { seedHarvests } from './seeders/seedHarvests.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 8000;

// ── Morgan: Logging Request (ke console + file) ───────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logDir = path.join(__dirname, '..', 'logs');
fs.mkdirSync(logDir, { recursive: true });
const accessLogStream = fs.createWriteStream(
  path.join(logDir, 'access.log'),
  { flags: 'a' }
);
app.use(morgan('combined', { stream: accessLogStream }));   // persist ke file
app.use(morgan('dev'));                                     // tampil di console

// ── Middleware Global ─────────────────────────────────────────────────────────
app.use(cors()); // Izinkan FE (localhost:3000) memanggil API
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.status(200).json({ success: true, message: 'Sorgum SCM API is running.', timestamp: new Date().toISOString() });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/harvest', harvestRoutes);
app.use('/api/varieties', varietyRoutes);
app.use('/api/land', landRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/packaging', packagingRoutes);
app.use('/api/logistics', logisticsRoutes);
app.use('/api/cms', cmsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/keys', apiKeyRoutes);

// ── Dokumentasi API (Scalar) ─────────────────────────────────────────────────
app.use(
  '/api/docs',
  apiReference({
    spec: {
      content: openApiSpec,
    },
    theme: 'default',
  })
);

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Endpoint tidak ditemukan: ${req.method} ${req.originalUrl}` });
});

// ── Error Handler Global ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[Global Error]', err.message);
  res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
});

// ── Start Server ──────────────────────────────────────────────────────────────
async function startServer() {
  try {
    await initDatabase(); // Auto-create database & tabel, lalu siapkan pool
    await seedHarvests(); // Seed data panen awal jika tabel masih kosong
    app.listen(PORT, () => {
      console.log('──────────────────────────────────────────────');
      console.log(`  Sorgum SCM API berjalan di:`);
      console.log(`  ➜  http://localhost:${PORT}/api/health`);
      console.log('──────────────────────────────────────────────');
    });
  } catch (error) {
    console.error('Gagal memulai server:', error.message);
    console.error('Periksa konfigurasi MySQL di file .env');
    process.exit(1);
  }
}

startServer();
