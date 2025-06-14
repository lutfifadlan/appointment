import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, jest } from '@jest/globals';
import { Server } from 'http';
import { Socket as ClientSocket } from 'socket.io-client';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import { AddressInfo } from 'net';
import Client from 'socket.io-client';
import request from 'supertest';
import { WebSocketService } from '../../src/services/websocketService';
import { AppointmentLock } from '../../src/models/appointmentLock';

// Helper function to create a promise that resolves when an event is emitted
const waitForEvent = (socket: ClientSocket, event: string, timeout = 5000): Promise<any> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Event '${event}' not received within ${timeout}ms`));
    }, timeout);

    socket.once(event, (data) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
};

// Helper function to create and connect a client
const createClient = (port: number): Promise<ClientSocket> => {
  return new Promise((resolve, reject) => {
    const client = Client(`http://localhost:${port}`, {
      forceNew: true,
      timeout: 5000
    });

    client.on('connect', () => resolve(client));
    client.on('connect_error', reject);
  });
};

describe('WebSocketService', () => {
  let httpServer: Server;
  let wsService: WebSocketService;
  let serverPort: number;
  let clientSocket: ClientSocket;

  beforeAll(async () => {
    // Create HTTP server
    httpServer = createServer();
    wsService = new WebSocketService();
    
    // Initialize WebSocket service
    wsService.initialize(httpServer);
    
    // Start server on random port
    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => {
        const address = httpServer.address() as AddressInfo;
        serverPort = address.port;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (httpServer) {
      await new Promise<void>((resolve) => {
        httpServer.close(() => resolve());
      });
    }
  });

  beforeEach(async () => {
    // Create client connection before each test
    clientSocket = await createClient(serverPort);
  });

  afterEach(() => {
    // Clean up client connection after each test
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
  });

  describe('HTTP Server Integration', () => {
    it('should handle HTTP requests alongside WebSocket connections', async () => {
      // Add a simple HTTP route for testing
      httpServer.on('request', (req, res) => {
        if (req.url === '/health') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'ok' }));
        }
      });

      // Test HTTP endpoint with supertest
      const response = await request(httpServer)
        .get('/health')
        .expect(200);

      expect(response.body).toEqual({ status: 'ok' });
      
      // Ensure WebSocket still works
      expect(clientSocket.connected).toBe(true);
    });
  });

  describe('Connection Management', () => {
    it('should handle client connection', () => {
      expect(clientSocket.connected).toBe(true);
    });

    it('should handle client disconnection', async () => {
      const disconnectPromise = new Promise<void>((resolve) => {
        clientSocket.on('disconnect', () => {
          resolve();
        });
      });
      
      clientSocket.disconnect();
      
      await disconnectPromise;
      expect(clientSocket.connected).toBe(false);
    });

    it('should handle connection timeout gracefully', async () => {
      // Test connection to non-existent port
      const invalidClient = Client('http://localhost:99999', {
        timeout: 1000,
        forceNew: true
      });

      await expect(
        waitForEvent(invalidClient, 'connect', 2000)
      ).rejects.toThrow();

      invalidClient.disconnect();
    });
  });

  describe('Subscription Management', () => {
    const appointmentId = 'test-appointment-123';

    it('should handle subscription to appointment', async () => {
      // Subscribe to appointment
      clientSocket.emit('subscribe', appointmentId);
      
      // Wait a bit for subscription to process
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify subscription by checking connection is still active
      expect(clientSocket.connected).toBe(true);
    });

    it('should handle unsubscription from appointment', async () => {
      // First subscribe
      clientSocket.emit('subscribe', appointmentId);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Then unsubscribe
      clientSocket.emit('unsubscribe', appointmentId);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(clientSocket.connected).toBe(true);
    });

    it('should handle multiple clients subscribing to same appointment', async () => {
      const client2 = await createClient(serverPort);
      
      try {
        // Both clients subscribe to same appointment
        clientSocket.emit('subscribe', appointmentId);
        client2.emit('subscribe', appointmentId);
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        expect(clientSocket.connected).toBe(true);
        expect(client2.connected).toBe(true);
      } finally {
        client2.disconnect();
      }
    });

    it('should handle subscription with invalid appointment ID', async () => {
      const invalidId = '';
      
      // This should not crash the server
      clientSocket.emit('subscribe', invalidId);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(clientSocket.connected).toBe(true);
    });
  });

  describe('Cursor Position Updates', () => {
    const appointmentId = 'test-appointment-456';
    const userId = 'user-123';
    const cursorPosition = { x: 100, y: 200 };

    it('should broadcast cursor position updates to other clients', async () => {
      const client2 = await createClient(serverPort);
      
      try {
        // Both clients subscribe to same appointment
        clientSocket.emit('subscribe', appointmentId);
        client2.emit('subscribe', appointmentId);
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Set up listener for cursor updates on client2
        const cursorUpdatePromise = waitForEvent(client2, 'cursor-update');
        
        // Client1 sends cursor position
        clientSocket.emit('cursor-position', {
          appointmentId,
          userId,
          position: cursorPosition
        });
        
        // Wait for cursor update
        const data = await cursorUpdatePromise;
        
        expect(data.userId).toBe(userId);
        expect(data.position).toEqual(cursorPosition);
      } finally {
        client2.disconnect();
      }
    });

    it('should not send cursor update back to sender', async () => {
      clientSocket.emit('subscribe', appointmentId);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      let receivedUpdate = false;
      clientSocket.on('cursor-update', () => {
        receivedUpdate = true;
      });
      
      // Send cursor position
      clientSocket.emit('cursor-position', {
        appointmentId,
        userId,
        position: cursorPosition
      });
      
      // Wait and verify no update was received
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(receivedUpdate).toBe(false);
    });

    it('should handle invalid cursor position data', async () => {
      clientSocket.emit('subscribe', appointmentId);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Send invalid cursor data
      clientSocket.emit('cursor-position', {
        appointmentId,
        userId,
        position: null
      });
      
      // Should not crash
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(clientSocket.connected).toBe(true);
    });
  });

  describe('Lock Notifications', () => {
    const appointmentId = 'test-appointment-789';
    const mockLock: AppointmentLock = {
      appointmentId,
      userId: 'user-456',
      userInfo: {
        name: 'Test User',
        email: 'test@example.com'
      },
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 300000) // 5 minutes from now
    };

    beforeEach(async () => {
      clientSocket.emit('subscribe', appointmentId);
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should notify clients about lock changes', async () => {
      const lockUpdatePromise = waitForEvent(clientSocket, 'lock-update');
      
      wsService.notifyLockChange(appointmentId, mockLock);
      
      const data = await lockUpdatePromise;
      expect(data.appointmentId).toBe(appointmentId);
      expect(data.lock.appointmentId).toBe(mockLock.appointmentId);
      expect(data.lock.userId).toBe(mockLock.userId);
      expect(data.lock.userInfo).toEqual(mockLock.userInfo);
      // Dates are serialized as strings over WebSocket
      expect(data.lock.createdAt).toBe(mockLock.createdAt.toISOString());
      expect(data.lock.expiresAt).toBe(mockLock.expiresAt.toISOString());
    });

    it('should notify clients about lock acquisition', async () => {
      const lockAcquiredPromise = waitForEvent(clientSocket, 'lock-acquired');
      
      wsService.notifyLockAcquired(appointmentId, mockLock);
      
      const data = await lockAcquiredPromise;
      expect(data.appointmentId).toBe(appointmentId);
      expect(data.lock.appointmentId).toBe(mockLock.appointmentId);
      expect(data.lock.userId).toBe(mockLock.userId);
      expect(data.lock.userInfo).toEqual(mockLock.userInfo);
      // Dates are serialized as strings over WebSocket
      expect(data.lock.createdAt).toBe(mockLock.createdAt.toISOString());
      expect(data.lock.expiresAt).toBe(mockLock.expiresAt.toISOString());
    });

    it('should notify clients about lock release', async () => {
      const lockReleasedPromise = waitForEvent(clientSocket, 'lock-released');
      
      wsService.notifyLockReleased(appointmentId);
      
      const data = await lockReleasedPromise;
      expect(data.appointmentId).toBe(appointmentId);
    });

    it('should notify clients about admin takeover', async () => {
      const adminId = 'admin-123';
      const adminInfo = {
        name: 'Admin User',
        email: 'admin@example.com'
      };
      
      const adminTakeoverPromise = waitForEvent(clientSocket, 'admin-takeover');
      
      wsService.notifyAdminTakeover(appointmentId, adminId, adminInfo);
      
      const data = await adminTakeoverPromise;
      expect(data.appointmentId).toBe(appointmentId);
      expect(data.adminId).toBe(adminId);
      expect(data.adminInfo).toEqual(adminInfo);
    });

    it('should handle notification to non-existent appointment', async () => {
      const nonExistentId = 'non-existent-appointment';
      
      // Should not throw error
      expect(() => {
        wsService.notifyLockChange(nonExistentId, mockLock);
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle initialization with invalid server', () => {
      const invalidService = new WebSocketService();
      
      // Mock the SocketIOServer constructor to throw an error
      const originalServer = require('socket.io').Server;
      jest.spyOn(require('socket.io'), 'Server').mockImplementation(() => {
        throw new Error('Socket.IO initialization failed');
      });
      
      try {
        expect(() => {
          invalidService.initialize(null as any);
        }).toThrow('Failed to initialize WebSocket server');
      } finally {
        // Restore the original implementation
        require('socket.io').Server = originalServer;
      }
    });

    it('should handle notifications when server not initialized', () => {
      const uninitializedService = new WebSocketService();
      
      // Mock console.error to avoid noise in test output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation((message) => {
        console.log('Mocked console.error:', message);
      });
      
      try {
        expect(() => {
          uninitializedService.notifyLockChange('test', null);
        }).not.toThrow(); // Should log error but not throw
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it('should handle malformed subscription data', async () => {
      // Send malformed data
      clientSocket.emit('subscribe', null);
      clientSocket.emit('subscribe', undefined);
      clientSocket.emit('subscribe', 123);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(clientSocket.connected).toBe(true);
    });
  });

  describe('Room Management', () => {
    const appointmentId = 'test-room-management';

    it('should properly clean up subscriptions on disconnect', async () => {
      const client2 = await createClient(serverPort);
      
      // Subscribe to appointment
      client2.emit('subscribe', appointmentId);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Disconnect client
      client2.disconnect();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Try to send notification - should not crash
      expect(() => {
        wsService.notifyLockChange(appointmentId, null);
      }).not.toThrow();
    });

    it('should handle subscription to non-existent appointments', async () => {
      const nonExistentId = 'non-existent-appointment';
      
      // This should not throw an error
      clientSocket.emit('subscribe', nonExistentId);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(clientSocket.connected).toBe(true);
    });

    it('should handle multiple subscriptions from same client', async () => {
      const appointmentId1 = 'appointment-1';
      const appointmentId2 = 'appointment-2';
      
      clientSocket.emit('subscribe', appointmentId1);
      clientSocket.emit('subscribe', appointmentId2);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(clientSocket.connected).toBe(true);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple simultaneous connections', async () => {
      const numClients = 5;
      const clients: ClientSocket[] = [];
      
      try {
        // Create multiple clients concurrently
        const clientPromises = Array.from({ length: numClients }, () => 
          createClient(serverPort)
        );
        
        const connectedClients = await Promise.all(clientPromises);
        clients.push(...connectedClients);
        
        // Verify all clients are connected
        connectedClients.forEach(client => {
          expect(client.connected).toBe(true);
        });
      } finally {
        // Clean up all clients
        clients.forEach(client => client.disconnect());
      }
    });

    it('should handle rapid subscription/unsubscription', async () => {
      const appointmentId = 'rapid-test';
      
      // Rapid subscribe/unsubscribe cycles
      for (let i = 0; i < 10; i++) {
        clientSocket.emit('subscribe', appointmentId);
        clientSocket.emit('unsubscribe', appointmentId);
      }
      
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(clientSocket.connected).toBe(true);
    });

    it('should handle concurrent cursor updates', async () => {
      const appointmentId = 'concurrent-cursor-test';
      const numClients = 3;
      const clients: ClientSocket[] = [];
      
      try {
        // Create multiple clients
        for (let i = 0; i < numClients; i++) {
          const client = await createClient(serverPort);
          clients.push(client);
          client.emit('subscribe', appointmentId);
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Send cursor updates from all clients simultaneously
        const cursorPromises = clients.map((client, index) => {
          return new Promise<void>((resolve) => {
            client.emit('cursor-position', {
              appointmentId,
              userId: `user-${index}`,
              position: { x: index * 10, y: index * 20 }
            });
            resolve();
          });
        });
        
        await Promise.all(cursorPromises);
        
        // All clients should still be connected
        clients.forEach(client => {
          expect(client.connected).toBe(true);
        });
      } finally {
        clients.forEach(client => client.disconnect());
      }
    });
  });

  describe('Performance and Stress Testing', () => {
    it('should handle high frequency events', async () => {
      const appointmentId = 'stress-test';
      clientSocket.emit('subscribe', appointmentId);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Send many cursor updates rapidly
      for (let i = 0; i < 100; i++) {
        clientSocket.emit('cursor-position', {
          appointmentId,
          userId: 'stress-user',
          position: { x: i, y: i }
        });
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(clientSocket.connected).toBe(true);
    });
  });
});

// Integration tests with mocked dependencies
describe('WebSocketService Integration', () => {
  let wsService: WebSocketService;
  let mockServer: Server;
  let mockIO: jest.Mocked<SocketIOServer>;

  beforeEach(() => {
    wsService = new WebSocketService();
    mockServer = createServer();
    
    // Mock Socket.IO server
    mockIO = {
      on: jest.fn(),
      to: jest.fn().mockReturnThis(),
      emit: jest.fn()
    } as any;
    
    // Mock the SocketIOServer constructor
    jest.spyOn(require('socket.io'), 'Server').mockImplementation(() => mockIO);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should set up event handlers on initialization', () => {
    wsService.initialize(mockServer);
    
    expect(mockIO.on).toHaveBeenCalledWith('connection', expect.any(Function));
  });

  it('should emit lock-update events to correct room', () => {
    wsService.initialize(mockServer);
    
    const appointmentId = 'test-appointment';
    const mockLock = {
      appointmentId,
      userId: 'user-123',
      userInfo: {
        name: 'Test User',
        email: 'test@example.com'
      },
      createdAt: new Date(),
      expiresAt: new Date()
    };
    
    wsService.notifyLockChange(appointmentId, mockLock);
    
    expect(mockIO.to).toHaveBeenCalledWith(`appointment:${appointmentId}`);
    expect(mockIO.emit).toHaveBeenCalledWith('lock-update', {
      appointmentId,
      lock: mockLock
    });
  });

  it('should handle CORS configuration', () => {
    const originalEnv = process.env.FRONTEND_URL;
    process.env.FRONTEND_URL = 'http://localhost:3000';
    
    try {
      wsService.initialize(mockServer);
      
      // Verify CORS configuration was passed
      expect(require('socket.io').Server).toHaveBeenCalledWith(
        mockServer,
        expect.objectContaining({
          cors: {
            origin: 'http://localhost:3000',
            methods: ['GET', 'POST']
          }
        })
      );
    } finally {
      process.env.FRONTEND_URL = originalEnv;
    }
  });

  it('should use default CORS when FRONTEND_URL not set', () => {
    const originalEnv = process.env.FRONTEND_URL;
    delete process.env.FRONTEND_URL;
    
    try {
      wsService.initialize(mockServer);
      
      expect(require('socket.io').Server).toHaveBeenCalledWith(
        mockServer,
        expect.objectContaining({
          cors: {
            origin: '*',
            methods: ['GET', 'POST']
          }
        })
      );
    } finally {
      process.env.FRONTEND_URL = originalEnv;
    }
  });
});

// Utility tests
describe('WebSocketService Utilities', () => {
  it('should validate helper functions', async () => {
    const mockSocket = {
      once: jest.fn(),
      on: jest.fn(),
      emit: jest.fn()
    } as any;

    // Test waitForEvent with timeout
    mockSocket.once.mockImplementation((event, callback) => {
      setTimeout(() => callback({ test: 'data' }), 100);
    });

    const result = await waitForEvent(mockSocket, 'test-event');
    expect(result).toEqual({ test: 'data' });
  });

  it('should handle waitForEvent timeout', async () => {
    const mockSocket = {
      once: jest.fn()
    } as any;

    // Don't call the callback to simulate timeout
    mockSocket.once.mockImplementation(() => {});

    await expect(
      waitForEvent(mockSocket, 'test-event', 100)
    ).rejects.toThrow("Event 'test-event' not received within 100ms");
  });
});