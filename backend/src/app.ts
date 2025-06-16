import 'reflect-metadata';
import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import websocketService from './services/websocketService';
import { AppDataSource } from './config/data-source';
import appointmentRoutes from './routes/appointmentRoutes';
import lockRoutes from './routes/lockRoutes';
import lockHistoryRoutes from './routes/lockHistoryRoutes';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';

const app = express();
const port = process.env.PORT || 8088;
let server: http.Server | null = null;

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

app.get('/health', (req: Request, res: Response) => {
  res.send('OK');
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1', appointmentRoutes);
app.use('/api/v1', lockRoutes);
app.use('/api/v1', lockHistoryRoutes);

// Error handling middleware
app.use((err: Error, req: Request, res: Response) => {
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

// Load environment variables
dotenv.config();

// Exported function to initialize the server and database
export const initializeApp = async () => {
  await AppDataSource.initialize();
  await AppDataSource.runMigrations();
  server = http.createServer(app);
  websocketService.initialize(server);
  return { app, server };
};

// Export the app for testing
export { app };

// If run directly, start the server
if (require.main === module) {
  (async () => {
    try {
      const { server } = await initializeApp();
      server.listen(port, () => {
        console.log(`Server is running on port ${port}`);
      });
    } catch (error) {
      console.error('Error during database initialization:', error);
      process.exit(1);
    }
  })();
}