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
    if (!server) {
      throw new Error('Failed to initialize WebSocket server: Invalid server instance');
    }

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
        userInfo?: { name: string; email: string };
        position: CursorPosition;
      }) => {
        this.handleCursorPosition(socket, data);
      });

      socket.on('forceTakeover', (data: { 
        appointmentId: string;
        userId: string;
        userInfo: { name: string; email: string };
      }, callback) => {
        this.handleForceTakeover(data, callback);
      });

      socket.on('requestTakeover', (data: { 
        appointmentId: string;
        userId: string;
        userInfo: { name: string; email: string };
      }, callback) => {
        this.handleRequestTakeover(data, callback);
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
    if (!appointmentId) {
      return;
    }

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
    if (!appointmentId) {
      return;
    }

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
    userInfo?: { name: string; email: string };
    position: CursorPosition;
  }): void {
    if (!data?.appointmentId || !data?.userId || !data?.position) {
      return;
    }

    try {
      const { appointmentId, userId, userInfo, position } = data;
      socket.to(`appointment:${appointmentId}`).emit('cursor-update', {
        userId,
        userInfo: userInfo || { name: 'Unknown User', email: '' },
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
   * Handle admin force takeover
   * @private
   */
  private async handleForceTakeover(data: { 
    appointmentId: string;
    userId: string;
    userInfo: { name: string; email: string };
  }, callback: (response: { success: boolean; error?: string }) => void): Promise<void> {
    try {
      console.log('🔧 Force takeover received:', JSON.stringify(data, null, 2));
      const { appointmentId, userId, userInfo } = data;
      
      if (!appointmentId || !userId || !userInfo || !userInfo.name || !userInfo.email) {
        console.log('❌ Missing parameters:', { appointmentId, userId, userInfo });
        callback({ success: false, error: 'Missing required parameters' });
        return;
      }

      // Import LockService dynamically to avoid circular dependencies
      const { LockService } = await import('./lockService.js');
      const lockService = new LockService();
      
      // Perform admin takeover
      const result = await lockService.adminTakeover(appointmentId, userId, userInfo);
      
      if (result.success) {
        callback({ success: true });
      } else {
        callback({ success: false, error: result.message });
      }
    } catch (error) {
      console.error('Failed to handle force takeover:', error);
      callback({ success: false, error: 'Internal server error' });
    }
  }

  /**
   * Handle regular user takeover request
   * @private
   */
  private async handleRequestTakeover(data: { 
    appointmentId: string;
    userId: string;
    userInfo: { name: string; email: string };
  }, callback: (response: { success: boolean; error?: string }) => void): Promise<void> {
    try {
      const { appointmentId, userId, userInfo } = data;
      
      if (!appointmentId || !userId || !userInfo) {
        callback({ success: false, error: 'Missing required parameters' });
        return;
      }

      // For now, non-admin users can't directly takeover
      // This would typically send a notification to admins
      console.log(`User ${userInfo.name} requested takeover for appointment ${appointmentId}`);
      
      // In a real implementation, you would:
      // 1. Store the takeover request
      // 2. Notify all admin users
      // 3. Allow admins to approve/deny the request
      
      callback({ success: true });
    } catch (error) {
      console.error('Failed to handle request takeover:', error);
      callback({ success: false, error: 'Internal server error' });
    }
  }

  /**
   * Notify clients about lock changes
   */
  notifyLockChange(appointmentId: string, lock: AppointmentLock | null): void {
    if (!this.io) {
      console.error('Failed to notify lock change: WebSocket server not initialized');
      return;
    }

    if (!appointmentId) {
      console.error('Failed to notify lock change: Invalid appointment ID');
      return;
    }

    try {
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
    if (!this.io) {
      console.error('Failed to notify lock acquisition: WebSocket server not initialized');
      return;
    }

    if (!appointmentId || !lock) {
      console.error('Failed to notify lock acquisition: Invalid parameters');
      return;
    }

    try {
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
    if (!this.io) {
      console.error('Failed to notify lock release: WebSocket server not initialized');
      return;
    }

    if (!appointmentId) {
      console.error('Failed to notify lock release: Invalid appointment ID');
      return;
    }

    try {
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
    if (!this.io) {
      console.error('Failed to notify admin takeover: WebSocket server not initialized');
      return;
    }

    if (!appointmentId || !adminId || !adminInfo) {
      console.error('Failed to notify admin takeover: Invalid parameters');
      return;
    }

    try {
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
