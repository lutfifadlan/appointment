import express, { Request, Response } from 'express';
import http from 'http';
import cors from 'cors';
import bodyParser from 'body-parser';
import websocketService from './services/websocketService';
import * as lockController from './controllers/lockController';

const app = express();
const port = process.env.PORT || 8088;
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.get('/', (req: Request, res: Response) => {
  res.send('Appointment backend root endpoint');
});

// Lock routes
app.get('/api/appointments/:id/lock-status', lockController.getLockStatus);
app.post('/api/appointments/:id/acquire-lock', lockController.acquireLock);
app.delete('/api/appointments/:id/release-lock', lockController.releaseLock);
app.delete('/api/appointments/:id/force-release-lock', lockController.forceReleaseLock);
app.post('/api/appointments/:id/update-position', lockController.updateUserPosition);

// Initialize WebSocket service
websocketService.initialize(server);

// Start server
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`WebSocket server is running`);
});