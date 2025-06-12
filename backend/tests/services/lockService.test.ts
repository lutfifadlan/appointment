const mockRepository = {
  findOne: jest.fn(),
  delete: jest.fn(),
  save: jest.fn(),
  remove: jest.fn()
};

jest.mock('../../src/config/data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn().mockReturnValue(mockRepository)
  }
}));

const mockWebsocketService = {
  notifyLockAcquired: jest.fn(),
  notifyLockReleased: jest.fn(),
  notifyAdminTakeover: jest.fn(),
  notifyLockChange: jest.fn()
};

jest.mock('../../src/services/websocketService', () => ({
  __esModule: true,
  default: mockWebsocketService
}));

// Mock setTimeout and clearTimeout
jest.useFakeTimers();
const spySetTimeout = jest.spyOn(global, 'setTimeout');
const spyClearTimeout = jest.spyOn(global, 'clearTimeout');

// Import after mocks are set up
let lockService: any;

describe('LockService', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    jest.resetModules();
    
    // Reset the mock repository
    mockRepository.findOne.mockReset();
    mockRepository.delete.mockReset();
    mockRepository.save.mockReset();
    mockRepository.remove.mockReset();
    
    // Reset websocket service mocks
    mockWebsocketService.notifyLockAcquired.mockReset();
    mockWebsocketService.notifyLockReleased.mockReset();
    mockWebsocketService.notifyAdminTakeover.mockReset();
    mockWebsocketService.notifyLockChange.mockReset();
    
    // Reset timer spies
    spySetTimeout.mockClear();
    spyClearTimeout.mockClear();
    
    // Import the service fresh for each test
    lockService = require('../../src/services/lockService').default;
  });

  describe('getLockStatus', () => {
    it('should return not locked if no lock exists', async () => {
      // Setup: Mock findOne to return null (no lock found)
      mockRepository.findOne.mockResolvedValueOnce(null);
      
      // Execute
      const result = await lockService.getLockStatus('appointment1');
      
      // Verify
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: {
          appointmentId: 'appointment1',
          expiresAt: expect.any(Object) // MoreThan(new Date())
        }
      });
      expect(result.success).toBe(true);
      expect(result.message).toBe('Appointment is not locked');
      expect(result.lock).toBeUndefined();
    });

    it('should return locked if lock exists', async () => {
      // Setup: Create a fake lock with future expiry date
      const fakeLock = {
        appointmentId: 'appointment1',
        userId: 'user1',
        userInfo: { name: 'A', email: 'B' },
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        createdAt: new Date()
      };
      
      // Mock: Return the fake lock when findOne is called with the right parameters
      mockRepository.findOne.mockImplementation(({ where }) => {
        if (where && 
            where.appointmentId === 'appointment1' && 
            where.expiresAt) {
          return Promise.resolve(fakeLock);
        }
        return Promise.resolve(null);
      });
      
      // Execute
      const result = await lockService.getLockStatus('appointment1');
      
      // Verify
      expect(mockRepository.findOne).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.message).toBe('Appointment is locked');
      expect(result.lock).toMatchObject({
        appointmentId: 'appointment1',
        userId: 'user1',
        userInfo: { name: 'A', email: 'B' }
      });
    });
  });

  describe('acquireLock', () => {
    it('should fail to acquire lock if appointment is already locked by another user', async () => {
      // Setup: Create a fake lock with future expiry date
      const existingLock = {
        appointmentId: 'appointment1',
        userId: 'user1',
        userInfo: { name: 'User One', email: 'user1@example.com' },
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        createdAt: new Date()
      };
      
      // Mock: Return the existing lock when findOne is called
      mockRepository.findOne.mockResolvedValueOnce(existingLock);
      
      // Execute: Try to acquire lock as a different user
      const result = await lockService.acquireLock(
        'appointment1',
        'user2',
        { name: 'User Two', email: 'user2@example.com' }
      );
      
      // Verify
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: {
          appointmentId: 'appointment1',
          expiresAt: expect.any(Object)
        }
      });
      expect(result.success).toBe(false);
      expect(result.message).toBe('Appointment is currently locked by User One');
      expect(result.lock).toMatchObject({
        appointmentId: 'appointment1',
        userId: 'user1',
        userInfo: { name: 'User One', email: 'user1@example.com' }
      });
      expect(mockRepository.save).not.toHaveBeenCalled();
      expect(mockWebsocketService.notifyLockAcquired).not.toHaveBeenCalled();
    });

    it('should acquire lock if appointment is not locked', async () => {
      // Setup: No existing lock
      mockRepository.findOne.mockResolvedValueOnce(null);
      
      // Mock save to return the saved entity
      const savedLock = {
        appointmentId: 'appointment1',
        userId: 'user1',
        userInfo: { name: 'User One', email: 'user1@example.com' },
        expiresAt: expect.any(Date),
        createdAt: expect.any(Date)
      };
      mockRepository.save.mockResolvedValueOnce(savedLock);
      
      // Execute
      const result = await lockService.acquireLock(
        'appointment1',
        'user1',
        { name: 'User One', email: 'user1@example.com' }
      );
      
      // Verify
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: {
          appointmentId: 'appointment1',
          expiresAt: expect.any(Object)
        }
      });
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.message).toBe('Lock acquired successfully');
      expect(result.lock).toMatchObject({
        appointmentId: 'appointment1',
        userId: 'user1',
        userInfo: { name: 'User One', email: 'user1@example.com' }
      });
      
      // Verify timeout was set
      expect(spySetTimeout).toHaveBeenCalledWith(expect.any(Function), 5 * 60 * 1000);
      
      // Verify websocket notification
      expect(mockWebsocketService.notifyLockAcquired).toHaveBeenCalledWith(
        'appointment1',
        expect.objectContaining({
          appointmentId: 'appointment1',
          userId: 'user1'
        })
      );
    });

    it('should allow the same user to re-acquire their own lock', async () => {
      // Setup: Existing lock by the same user
      const existingLock = {
        appointmentId: 'appointment1',
        userId: 'user1',
        userInfo: { name: 'User One', email: 'user1@example.com' },
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        createdAt: new Date()
      };
      mockRepository.findOne.mockResolvedValueOnce(existingLock);
      
      // Mock save to return the saved entity
      const savedLock = {
        appointmentId: 'appointment1',
        userId: 'user1',
        userInfo: { name: 'User One', email: 'user1@example.com', position: { x: 10, y: 20 } },
        expiresAt: expect.any(Date),
        createdAt: expect.any(Date)
      };
      mockRepository.save.mockResolvedValueOnce(savedLock);
      
      // Execute: Same user acquires lock with updated position
      const result = await lockService.acquireLock(
        'appointment1',
        'user1',
        { name: 'User One', email: 'user1@example.com', position: { x: 10, y: 20 } }
      );
      
      // Verify
      expect(mockRepository.findOne).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.message).toBe('Lock acquired successfully');
      expect(result.lock).toMatchObject({
        appointmentId: 'appointment1',
        userId: 'user1',
        userInfo: { 
          name: 'User One', 
          email: 'user1@example.com',
          position: { x: 10, y: 20 }
        }
      });
      
      // Verify timeout was reset
      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 5 * 60 * 1000);
      
      // Verify websocket notification
      expect(mockWebsocketService.notifyLockAcquired).toHaveBeenCalled();
    });
  });

  describe('releaseLock', () => {
    it('should fail to release lock if appointment is not locked', async () => {
      // Setup: No lock exists
      mockRepository.findOne.mockResolvedValueOnce(null);
      
      // Execute
      const result = await lockService.releaseLock('appointment1', 'user1');
      
      // Verify
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { appointmentId: 'appointment1' }
      });
      expect(result.success).toBe(false);
      expect(result.message).toBe('Appointment is not locked');
      expect(mockRepository.remove).not.toHaveBeenCalled();
      expect(mockWebsocketService.notifyLockReleased).not.toHaveBeenCalled();
    });

    it('should fail to release lock if user is not the lock owner', async () => {
      // Setup: Lock exists but owned by a different user
      const existingLock = {
        appointmentId: 'appointment1',
        userId: 'user1',
        userInfo: { name: 'User One', email: 'user1@example.com' },
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        createdAt: new Date()
      };
      mockRepository.findOne.mockResolvedValueOnce(existingLock);
      
      // Execute: Different user tries to release the lock
      const result = await lockService.releaseLock('appointment1', 'user2');
      
      // Verify
      expect(mockRepository.findOne).toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.message).toBe('You do not have permission to release this lock');
      expect(result.lock).toMatchObject({
        appointmentId: 'appointment1',
        userId: 'user1'
      });
      expect(mockRepository.remove).not.toHaveBeenCalled();
      expect(mockWebsocketService.notifyLockReleased).not.toHaveBeenCalled();
    });

    it('should successfully release lock if user is the lock owner', async () => {
      // Setup: Lock exists and owned by the user
      const existingLock = {
        appointmentId: 'appointment1',
        userId: 'user1',
        userInfo: { name: 'User One', email: 'user1@example.com' },
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        createdAt: new Date()
      };
      mockRepository.findOne.mockResolvedValueOnce(existingLock);
      
      // Mock successful removal
      mockRepository.remove.mockResolvedValueOnce(existingLock);
      
      // Execute: Lock owner releases the lock
      const result = await lockService.releaseLock('appointment1', 'user1');
      
      // Verify
      expect(mockRepository.findOne).toHaveBeenCalled();
      expect(mockRepository.remove).toHaveBeenCalledWith(existingLock);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Lock released successfully');
      expect(mockWebsocketService.notifyLockReleased).toHaveBeenCalledWith('appointment1');
    });
  });

  describe('forceReleaseLock', () => {
    it('should fail to force release if appointment is not locked', async () => {
      // Setup: No lock exists
      mockRepository.findOne.mockResolvedValueOnce(null);
      
      // Execute
      const result = await lockService.forceReleaseLock('appointment1', 'admin1');
      
      // Verify
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { appointmentId: 'appointment1' }
      });
      expect(result.success).toBe(false);
      expect(result.message).toBe('Appointment is not locked');
      expect(mockRepository.remove).not.toHaveBeenCalled();
      expect(mockWebsocketService.notifyAdminTakeover).not.toHaveBeenCalled();
    });

    it('should successfully force release a lock as admin', async () => {
      // Setup: Lock exists
      const existingLock = {
        appointmentId: 'appointment1',
        userId: 'user1',
        userInfo: { name: 'User One', email: 'user1@example.com' },
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        createdAt: new Date()
      };
      mockRepository.findOne.mockResolvedValueOnce(existingLock);
      
      // Mock successful removal
      mockRepository.remove.mockResolvedValueOnce(existingLock);
      
      // Execute: Admin force releases the lock
      const result = await lockService.forceReleaseLock('appointment1', 'admin1');
      
      // Verify
      expect(mockRepository.findOne).toHaveBeenCalled();
      expect(mockRepository.remove).toHaveBeenCalledWith(existingLock);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Lock forcibly released by admin (admin1)');
      expect(mockWebsocketService.notifyAdminTakeover).toHaveBeenCalledWith(
        'appointment1',
        'admin1',
        { name: 'Admin', email: 'admin@example.com' }
      );
    });
  });

  describe('updateUserPosition', () => {
    it('should fail to update position if user does not have an active lock', async () => {
      // Setup: No lock exists
      mockRepository.findOne.mockResolvedValueOnce(null);
      
      // Execute
      const result = await lockService.updateUserPosition(
        'appointment1',
        'user1',
        { x: 10, y: 20 }
      );
      
      // Verify
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { appointmentId: 'appointment1' }
      });
      expect(result.success).toBe(false);
      expect(result.message).toBe('You do not have an active lock on this appointment');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should fail to update position if lock is owned by a different user', async () => {
      // Setup: Lock exists but owned by a different user
      const existingLock = {
        appointmentId: 'appointment1',
        userId: 'user1',
        userInfo: { name: 'User One', email: 'user1@example.com' },
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        createdAt: new Date()
      };
      mockRepository.findOne.mockResolvedValueOnce(existingLock);
      
      // Execute: Different user tries to update position
      const result = await lockService.updateUserPosition(
        'appointment1',
        'user2',
        { x: 10, y: 20 }
      );
      
      // Verify
      expect(mockRepository.findOne).toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.message).toBe('You do not have an active lock on this appointment');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should successfully update position if user is the lock owner', async () => {
      // Setup: Lock exists and owned by the user
      const existingLock = {
        appointmentId: 'appointment1',
        userId: 'user1',
        userInfo: { name: 'User One', email: 'user1@example.com' },
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        createdAt: new Date()
      };
      mockRepository.findOne.mockResolvedValueOnce(existingLock);
      
      // Mock save to return the updated lock
      const updatedLock = {
        ...existingLock,
        userInfo: {
          ...existingLock.userInfo,
          position: { x: 10, y: 20 }
        },
        expiresAt: expect.any(Date)
      };
      mockRepository.save.mockResolvedValueOnce(updatedLock);
      
      // Execute: Lock owner updates position
      const result = await lockService.updateUserPosition(
        'appointment1',
        'user1',
        { x: 10, y: 20 }
      );
      
      // Verify
      expect(mockRepository.findOne).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.message).toBe('Position updated and lock refreshed');
      expect(result.lock).toMatchObject({
        appointmentId: 'appointment1',
        userId: 'user1',
        userInfo: {
          name: 'User One',
          email: 'user1@example.com',
          position: { x: 10, y: 20 }
        }
      });
      
      // Verify timeout was reset
      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 5 * 60 * 1000);
    });
  });
});

