import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import cors from 'cors';
import bodyParser from 'body-parser';
import websocketService from './services/websocketService';
import * as lockController from './controllers/lockController';
import { AppDataSource } from './config/data-source';
import 'reflect-metadata';

const app = express();
const port = process.env.PORT || 8088;
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

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

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error'
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  console.log(`404 Not Found: ${req.method} ${req.url}`);
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Initialize WebSocket service
websocketService.initialize(server);

// Initialize TypeORM and start server
AppDataSource.initialize()
  .then(() => {
    console.log("Database connection established");
    
    server.listen(port, () => {
      console.log(`Server is running on port ${port}`);
      console.log(`WebSocket server is running`);
    });
  })
  .catch((error) => {
    console.error("Error connecting to database:", error);
  });