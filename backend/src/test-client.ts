import axios from 'axios';
import { io, Socket } from 'socket.io-client';

const API_URL = 'http://localhost:8088/api';
const WS_URL = 'http://localhost:8088';

// Test user data
const user1 = {
  userId: 'user1',
  userInfo: {
    name: 'John Doe',
    email: 'john@example.com'
  }
};

const user2 = {
  userId: 'user2',
  userInfo: {
    name: 'Jane Smith',
    email: 'jane@example.com'
  }
};

const admin = {
  adminId: 'admin1',
  userInfo: {
    name: 'Admin User',
    email: 'admin@example.com'
  }
};

// Test appointment ID
const appointmentId = 'appointment123';

// Socket.IO client
let socket: Socket;

// Connect to WebSocket
const connectWebSocket = () => {
  socket = io(WS_URL);
  
  socket.on('connect', () => {
    console.log('Connected to WebSocket server');
    
    // Subscribe to appointment updates
    socket.emit('subscribe', appointmentId);
  });
};

// API functions
const getLockStatus = async () => {
  try {
    const response = await axios.get(`${API_URL}/appointments/${appointmentId}/lock-status`);
    console.log('Lock status:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error getting lock status:', (error as Error).message);
    return null;
  }
};

const acquireLock = async (user: typeof user1) => {
  try {
    const response = await axios.post(`${API_URL}/appointments/${appointmentId}/acquire-lock`, user);
    console.log('Acquire lock result:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error acquiring lock:', (error as Error).message);
    return null;
  }
};

const releaseLock = async (userId: string) => {
  try {
    const response = await axios.delete(`${API_URL}/appointments/${appointmentId}/release-lock`, {
      data: { userId }
    });
    console.log('Release lock result:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error releasing lock:', (error as Error).message);
    return null;
  }
};

const forceReleaseLock = async (adminId: string) => {
  try {
    const response = await axios.delete(`${API_URL}/appointments/${appointmentId}/force-release-lock`, {
      data: { adminId }
    });
    console.log('Force release lock result:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error force releasing lock:', (error as Error).message);
    return null;
  }
};

const updatePosition = async (userId: string, x: number, y: number) => {
  try {
    const response = await axios.post(`${API_URL}/appointments/${appointmentId}/update-position`, {
      userId,
      position: { x, y }
    });
    console.log('Update position result:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating position:', (error as Error).message);
    return null;
  }
};

const sendCursorPosition = (userId: string, x: number, y: number) => {
  if (socket && socket.connected) {
    socket.emit('cursor-position', {
      appointmentId,
      userId,
      position: { x, y }
    });
    console.log('Cursor position sent');
  } else {
    console.error('WebSocket not connected');
  }
};

// Test scenarios
const runTests = async () => {
  console.log('=== Starting Test Scenarios ===');
  
  // Connect to WebSocket
  connectWebSocket();
  
  // Scenario 1: Check initial lock status
  console.log('\n=== Scenario 1: Check initial lock status ===');
  await getLockStatus();
  
  // Scenario 2: User 1 acquires lock
  console.log('\n=== Scenario 2: User 1 acquires lock ===');
  await acquireLock(user1);
  
  // Scenario 3: User 2 tries to acquire lock (should fail)
  console.log('\n=== Scenario 3: User 2 tries to acquire lock (should fail) ===');
  await acquireLock(user2);
  
  // Scenario 4: User 1 updates cursor position
  console.log('\n=== Scenario 4: User 1 updates cursor position ===');
  await updatePosition(user1.userId, 100, 200);
  
  // Scenario 5: User 1 sends real-time cursor position via WebSocket
  console.log('\n=== Scenario 5: User 1 sends real-time cursor position via WebSocket ===');
  sendCursorPosition(user1.userId, 150, 250);
  
  // Scenario 6: User 1 releases lock
  console.log('\n=== Scenario 6: User 1 releases lock ===');
  await releaseLock(user1.userId);
  
  // Scenario 7: User 2 acquires lock (should succeed now)
  console.log('\n=== Scenario 7: User 2 acquires lock (should succeed now) ===');
  await acquireLock(user2);
  
  // Scenario 8: Admin force releases lock
  console.log('\n=== Scenario 8: Admin force releases lock ===');
  await forceReleaseLock(admin.adminId);
  
  // Scenario 9: Final lock status check
  console.log('\n=== Scenario 9: Final lock status check ===');
  await getLockStatus();
  
  console.log('\n=== Test Scenarios Completed ===');
  
  // Disconnect WebSocket after tests
  if (socket) {
    socket.disconnect();
  }
};

// Run the tests
runTests().catch(console.error);
