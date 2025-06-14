import { Server as SocketIOServer } from 'socket.io';
import { Server } from 'http';
import { AppointmentLock } from '../models/appointmentLock';

interface CursorPosition {
  x: number;
  y: number;
}

interface UserInfo {
  name: string;
  email: string;
  position?: CursorPosition;
}

export class WebSocketService {
  private io: SocketIOServer | null = null;
  
  // Map of appointmentId to array of connected client socket IDs
  private appointmentSubscriptions: Map<string, Set<string>> = new Map();

  /**
   * Initialize the WebSocket server
   * @param server - HTTP server instance
   */
  initialize(server: Server): void {
    try {
      this.io = new SocketIOServer(server, {
        cors: {
          origin: process.env.FRONTEND_URL || '*',
          methods: ['GET', 'POST']
        }
      });

      this.setupEventHandlers();
    } catch (error) {
      console.error('Failed to initialize WebSocket server:', error);
      throw new Error('Failed to initialize WebSocket server');
    }
  }

  /**
   * Set up WebSocket event handlers
   * @private
   */
  private setupEventHandlers(): void {
    if (!this.io) {
      throw new Error('WebSocket server not initialized');
    }

    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      socket.on('subscribe', (appointmentId: string) => {
        this.handleSubscribe(socket, appointmentId);
      });

      socket.on('unsubscribe', (appointmentId: string) => {
        this.handleUnsubscribe(socket, appointmentId);
      });

      socket.on('cursor-position', (data: { 
        appointmentId: string;
        userId: string;
        position: CursorPosition;
      }) => {
        this.handleCursorPosition(socket, data);
      });

      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  /**
   * Handle client subscription to an appointment
   * @private
   */
  private handleSubscribe(socket: any, appointmentId: string): void {
    try {
      console.log(`Client ${socket.id} subscribed to appointment ${appointmentId}`);
      
      if (!this.appointmentSubscriptions.has(appointmentId)) {
        this.appointmentSubscriptions.set(appointmentId, new Set());
      }
      
      this.appointmentSubscriptions.get(appointmentId)!.add(socket.id);
      socket.join(`appointment:${appointmentId}`);
    } catch (error) {
      console.error('Failed to handle subscription:', error);
    }
  }

  /**
   * Handle client unsubscription from an appointment
   * @private
   */
  private handleUnsubscribe(socket: any, appointmentId: string): void {
    try {
      console.log(`Client ${socket.id} unsubscribed from appointment ${appointmentId}`);
      
      if (this.appointmentSubscriptions.has(appointmentId)) {
        this.appointmentSubscriptions.get(appointmentId)!.delete(socket.id);
      }
      
      socket.leave(`appointment:${appointmentId}`);
    } catch (error) {
      console.error('Failed to handle unsubscription:', error);
    }
  }

  /**
   * Handle cursor position updates
   * @private
   */
  private handleCursorPosition(socket: any, data: { 
    appointmentId: string;
    userId: string;
    position: CursorPosition;
  }): void {
    try {
      const { appointmentId, userId, position } = data;
      socket.to(`appointment:${appointmentId}`).emit('cursor-update', {
        userId,
        position
      });
    } catch (error) {
      console.error('Failed to handle cursor position:', error);
    }
  }

  /**
   * Handle client disconnection
   * @private
   */
  private handleDisconnect(socket: any): void {
    try {
      console.log(`Client disconnected: ${socket.id}`);
      
      this.appointmentSubscriptions.forEach((subscribers, roomId) => {
        if (subscribers.has(socket.id)) {
          subscribers.delete(socket.id);
          console.log(`Removed client ${socket.id} from appointment ${roomId}`);
        }
      });
    } catch (error) {
      console.error('Failed to handle disconnection:', error);
    }
  }

  /**
   * Notify clients about lock changes
   */
  notifyLockChange(appointmentId: string, lock: AppointmentLock | null): void {
    try {
      if (!this.io) {
        throw new Error('WebSocket server not initialized');
      }

      this.io.to(`appointment:${appointmentId}`).emit('lock-update', {
        appointmentId,
        lock
      });
    } catch (error) {
      console.error('Failed to notify lock change:', error);
    }
  }

  /**
   * Notify clients about lock acquisition
   */
  notifyLockAcquired(appointmentId: string, lock: AppointmentLock): void {
    try {
      if (!this.io) {
        throw new Error('WebSocket server not initialized');
      }

      this.io.to(`appointment:${appointmentId}`).emit('lock-acquired', {
        appointmentId,
        lock
      });
    } catch (error) {
      console.error('Failed to notify lock acquisition:', error);
    }
  }

  /**
   * Notify clients about lock release
   */
  notifyLockReleased(appointmentId: string): void {
    try {
      if (!this.io) {
        throw new Error('WebSocket server not initialized');
      }

      this.io.to(`appointment:${appointmentId}`).emit('lock-released', {
        appointmentId
      });
    } catch (error) {
      console.error('Failed to notify lock release:', error);
    }
  }

  /**
   * Notify clients about admin takeover
   */
  notifyAdminTakeover(appointmentId: string, adminId: string, adminInfo: UserInfo): void {
    try {
      if (!this.io) {
        throw new Error('WebSocket server not initialized');
      }

      this.io.to(`appointment:${appointmentId}`).emit('admin-takeover', {
        appointmentId,
        adminId,
        adminInfo
      });
    } catch (error) {
      console.error('Failed to notify admin takeover:', error);
    }
  }
}

export default new WebSocketService();
