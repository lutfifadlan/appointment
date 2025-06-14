import { describe, beforeEach, afterEach, expect, it, jest } from '@jest/globals';
import { Repository } from 'typeorm';
import { AppointmentService } from '../../src/services/appointmentService';
import { AppointmentEntity } from '../../src/entities/AppointmentEntity';

// Mock dependencies
jest.mock('../../src/config/data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn()
  }
}));

describe('AppointmentService', () => {
  let appointmentService: AppointmentService;
  let mockRepository: Repository<AppointmentEntity>;

  // Helper function to create mock appointment data
  const createMockAppointment = (overrides = {}): AppointmentEntity => ({
    id: 'test-appointment-id',
    title: 'Test Appointment',
    description: 'Test Description',
    startDate: new Date(),
    endDate: new Date(Date.now() + 3600000),
    status: 'scheduled',
    location: 'Test Location',
    organizer: 'Test Organizer',
    attendees: ['test@example.com'],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  } as AppointmentEntity);

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup repository mock
    mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      merge: jest.fn(),
      create: jest.fn(),
      createQueryBuilder: jest.fn()
    } as unknown as Repository<AppointmentEntity>;

    // Setup AppDataSource mock
    const { AppDataSource } = require('../../src/config/data-source');
    AppDataSource.getRepository.mockReturnValue(mockRepository);

    // Create a new instance of the service for each test
    appointmentService = new AppointmentService();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getAppointmentById', () => {
    it('should return an appointment when found', async () => {
      const mockAppointment = createMockAppointment();
      jest.spyOn(mockRepository, 'findOneBy').mockResolvedValue(mockAppointment);

      const result = await appointmentService.getAppointmentById('test-appointment-id');

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 'test-appointment-id' });
      expect(result).toEqual(mockAppointment);
    });

    it('should throw error when appointment not found', async () => {
      jest.spyOn(mockRepository, 'findOneBy').mockResolvedValue(null);

      await expect(appointmentService.getAppointmentById('non-existent-id'))
        .rejects
        .toThrow('Appointment not found');

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 'non-existent-id' });
    });

    it('should throw error when database query fails', async () => {
      jest.spyOn(mockRepository, 'findOneBy').mockRejectedValue(new Error('Database error'));

      await expect(appointmentService.getAppointmentById('test-appointment-id'))
        .rejects
        .toThrow('Failed to fetch appointment');

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 'test-appointment-id' });
    });
  });

  describe('createAppointment', () => {
    it('should create appointment successfully', async () => {
      const appointmentData = createMockAppointment();
      jest.spyOn(mockRepository, 'create').mockReturnValue(appointmentData);
      jest.spyOn(mockRepository, 'save').mockResolvedValue(appointmentData);

      const result = await appointmentService.createAppointment(appointmentData);

      expect(mockRepository.create).toHaveBeenCalledWith(appointmentData);
      expect(mockRepository.save).toHaveBeenCalledWith(appointmentData);
      expect(result).toEqual(appointmentData);
    });

    it('should handle validation errors', async () => {
      const invalidData = createMockAppointment({ title: '' });
      jest.spyOn(mockRepository, 'create').mockReturnValue(invalidData);
      jest.spyOn(mockRepository, 'save').mockRejectedValue(new Error('Validation failed'));

      await expect(appointmentService.createAppointment(invalidData))
        .rejects
        .toThrow('Failed to create appointment');
    });

    it('should handle database errors', async () => {
      const appointmentData = createMockAppointment();
      jest.spyOn(mockRepository, 'create').mockReturnValue(appointmentData);
      jest.spyOn(mockRepository, 'save').mockRejectedValue(new Error('Database error'));

      await expect(appointmentService.createAppointment(appointmentData))
        .rejects
        .toThrow('Failed to create appointment');
    });
  });

  describe('updateAppointment', () => {
    it('should update appointment successfully', async () => {
      const mockAppointment = createMockAppointment();
      const updateData = { title: 'Updated Title' };
      const mergedAppointment = { ...mockAppointment, ...updateData } as AppointmentEntity;

      jest.spyOn(mockRepository, 'findOneBy').mockResolvedValue(mockAppointment);
      jest.spyOn(mockRepository, 'merge').mockImplementation((entity, ...entityLikes) => {
        Object.assign(entity, ...entityLikes);
        return entity;
      });
      jest.spyOn(mockRepository, 'save').mockResolvedValue(mergedAppointment);

      const result = await appointmentService.updateAppointment('test-appointment-id', updateData);

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 'test-appointment-id' });
      expect(mockRepository.merge).toHaveBeenCalledWith(mockAppointment, updateData);
      expect(mockRepository.save).toHaveBeenCalledWith(mergedAppointment);
      expect(result).toEqual({
        success: true,
        data: mergedAppointment
      });
    });

    it('should return error when appointment not found', async () => {
      jest.spyOn(mockRepository, 'findOneBy').mockResolvedValue(null);

      const result = await appointmentService.updateAppointment('non-existent-id', { title: 'New Title' });

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 'non-existent-id' });
      expect(result).toEqual({
        success: false,
        message: 'Appointment not found'
      });
    });

    it('should handle validation errors during update', async () => {
      const mockAppointment = createMockAppointment();
      const invalidUpdate = { title: '' };

      jest.spyOn(mockRepository, 'findOneBy').mockResolvedValue(mockAppointment);
      jest.spyOn(mockRepository, 'save').mockRejectedValue(new Error('Validation failed'));

      const result = await appointmentService.updateAppointment('test-appointment-id', invalidUpdate);

      expect(result).toEqual({
        success: false,
        message: 'Failed to update appointment'
      });
    });
  });

  describe('deleteAppointment', () => {
    it('should delete appointment successfully', async () => {
      const mockAppointment = createMockAppointment();
      jest.spyOn(mockRepository, 'findOneBy').mockResolvedValue(mockAppointment);
      jest.spyOn(mockRepository, 'remove').mockResolvedValue(mockAppointment);

      const result = await appointmentService.deleteAppointment('test-appointment-id');

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 'test-appointment-id' });
      expect(mockRepository.remove).toHaveBeenCalledWith(mockAppointment);
      expect(result).toEqual({
        success: true,
        message: 'Appointment deleted successfully'
      });
    });

    it('should return error when appointment not found', async () => {
      jest.spyOn(mockRepository, 'findOneBy').mockResolvedValue(null);

      const result = await appointmentService.deleteAppointment('non-existent-id');

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 'non-existent-id' });
      expect(result).toEqual({
        success: false,
        message: 'Appointment not found'
      });
    });

    it('should handle database errors during deletion', async () => {
      const mockAppointment = createMockAppointment();
      jest.spyOn(mockRepository, 'findOneBy').mockResolvedValue(mockAppointment);
      jest.spyOn(mockRepository, 'remove').mockRejectedValue(new Error('Database error'));

      const result = await appointmentService.deleteAppointment('test-appointment-id');

      expect(result).toEqual({
        success: false,
        message: 'Failed to delete appointment'
      });
    });
  });

  describe('getAppointmentsByDateRange', () => {
    it('should return appointments within date range', async () => {
      const startDate = new Date();
      const endDate = new Date(Date.now() + 86400000);
      const mockAppointments = [
        createMockAppointment(),
        createMockAppointment({ id: 'test-appointment-id-2' })
      ];

      jest.spyOn(mockRepository, 'find').mockResolvedValue(mockAppointments);

      const result = await appointmentService.getAppointmentsByDateRange(startDate, endDate);

      expect(mockRepository.find).toHaveBeenCalled();
      expect(result).toEqual(mockAppointments);
    });

    it('should handle empty results', async () => {
      const startDate = new Date();
      const endDate = new Date(Date.now() + 86400000);

      jest.spyOn(mockRepository, 'find').mockResolvedValue([]);

      const result = await appointmentService.getAppointmentsByDateRange(startDate, endDate);

      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      const startDate = new Date();
      const endDate = new Date(Date.now() + 86400000);

      jest.spyOn(mockRepository, 'find').mockRejectedValue(new Error('Database error'));

      await expect(appointmentService.getAppointmentsByDateRange(startDate, endDate))
        .rejects
        .toThrow('Failed to fetch appointments by date range');
    });
  });
});
