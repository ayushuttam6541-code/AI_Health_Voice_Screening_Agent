import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { config } from './config/env.js';
import { setupVoiceSocket } from './websocket/voiceSocket.js';
import healthRoutes from './routes/health.routes.js';

const app = express();
const server = createServer(app);

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api', healthRoutes);

// Health check
app.get('/', (_req: any, res: any) => {
  res.json({
    message: 'AI Health Voice Screening Agent API',
    status: 'running',
    timestamp: new Date().toISOString(),
  });
});

// Setup WebSocket
setupVoiceSocket(server);

// Start server
const PORT = config.port;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}/ws/voice`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
