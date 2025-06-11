import { Server as SocketIOServer } from 'socket.io';
import { Server } from 'http';
import { AppointmentLock } from '../models/appointmentLock';

class WebSocketService {
  private io: SocketIOServer | null = null;
  
  // Map of appointmentId to array of connected client socket IDs
  private appointmentSubscriptions: Map<string, Set<string>> = new Map();

  initialize(server: Server) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: '*', // In production, restrict this to your frontend domain
        methods: ['GET', 'POST']
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Subscribe to appointment updates
      socket.on('subscribe', (appointmentId: string) => {
        console.log(`Client ${socket.id} subscribed to appointment ${appointmentId}`);
        
        if (!this.appointmentSubscriptions.has(appointmentId)) {
          this.appointmentSubscriptions.set(appointmentId, new Set());
        }
        
        this.appointmentSubscriptions.get(appointmentId)!.add(socket.id);
        socket.join(`appointment:${appointmentId}`);
      });

      // Unsubscribe from appointment updates
      socket.on('unsubscribe', (appointmentId: string) => {
        console.log(`Client ${socket.id} unsubscribed from appointment ${appointmentId}`);
        
        if (this.appointmentSubscriptions.has(appointmentId)) {
          this.appointmentSubscriptions.get(appointmentId)!.delete(socket.id);
        }
        
        socket.leave(`appointment:${appointmentId}`);
      });

      // Update cursor position
      socket.on('cursor-position', (data: { 
        appointmentId: string;
        userId: string;
        position: { x: number; y: number };
      }) => {
        // Broadcast cursor position to all clients subscribed to this appointment
        socket.to(`appointment:${data.appointmentId}`).emit('cursor-update', {
          userId: data.userId,
          position: data.position
        });
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        
        // Remove socket from all subscriptions
        this.appointmentSubscriptions.forEach((subscribers, appointmentId) => {
          if (subscribers.has(socket.id)) {
            subscribers.delete(socket.id);
          }
        });
      });
    });
  }

  // Notify all clients subscribed to an appointment about lock changes
  notifyLockChange(appointmentId: string, lock: AppointmentLock | null) {
    if (!this.io) {
      console.error('WebSocket server not initialized');
      return;
    }

    this.io.to(`appointment:${appointmentId}`).emit('lock-update', {
      appointmentId,
      lock
    });
  }

  // Notify about lock acquisition
  notifyLockAcquired(appointmentId: string, lock: AppointmentLock) {
    if (!this.io) {
      console.error('WebSocket server not initialized');
      return;
    }

    this.io.to(`appointment:${appointmentId}`).emit('lock-acquired', {
      appointmentId,
      lock
    });
  }

  // Notify about lock release
  notifyLockReleased(appointmentId: string) {
    if (!this.io) {
      console.error('WebSocket server not initialized');
      return;
    }

    this.io.to(`appointment:${appointmentId}`).emit('lock-released', {
      appointmentId
    });
  }

  // Notify about admin takeover
  notifyAdminTakeover(appointmentId: string, adminId: string, adminInfo: { name: string; email: string }) {
    if (!this.io) {
      console.error('WebSocket server not initialized');
      return;
    }

    this.io.to(`appointment:${appointmentId}`).emit('admin-takeover', {
      appointmentId,
      adminId,
      adminInfo
    });
  }
}

export default new WebSocketService();
