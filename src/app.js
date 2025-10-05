import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import parcelRoutes from './routes/parcels.js';
import verifyRoutes from './routes/verify.js';
import recipientRoutes from './routes/recipients.js';
import trackRoutes from './routes/track.js';

dotenv.config();

const app = express();

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// Basic health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.use('/parcel', parcelRoutes); // POST /parcel, GET /parcel/:id
app.use('/', verifyRoutes); // POST /verify-scan
app.use('/', recipientRoutes); // POST /feedback (could also be /feedback)
app.use('/', trackRoutes); // POST /track-parcel

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handler
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

export default app;
