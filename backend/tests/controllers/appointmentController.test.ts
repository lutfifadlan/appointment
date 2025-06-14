import { describe, beforeEach, afterEach, expect, it, jest } from '@jest/globals';
import { Request, Response } from 'express';
import * as appointmentController from '../../src/controllers/appointmentController';
import appointmentServiceImport from '../../src/services/appointmentService';
import { AppointmentEntity } from '../../src/entities/AppointmentEntity';

// Use a properly typed mock for appointmentService
const appointmentService = appointmentServiceImport as jest.Mocked<typeof appointmentServiceImport>;

// Mock the appointment service
jest.mock('../../src/services/appointmentService');

describe('AppointmentController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Response;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllAppointments', () => {
    it('should return all appointments successfully', async () => {
      const mockAppointments: AppointmentEntity[] = [
        {
          id: '1',
          title: 'Meeting 1',
          startDate: new Date('2024-03-20T10:00:00Z'),
          endDate: new Date('2024-03-20T11:00:00Z'),
          status: 'scheduled' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          title: 'Meeting 2',
          startDate: new Date('2024-03-21T10:00:00Z'),
          endDate: new Date('2024-03-21T11:00:00Z'),
          status: 'scheduled' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      appointmentService.getAllAppointments.mockResolvedValue(mockAppointments);

      await appointmentController.getAllAppointments(mockRequest as Request, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith(mockAppointments);
    });

    it('should handle errors when getting all appointments', async () => {
      appointmentService.getAllAppointments.mockRejectedValue(new Error('Database error'));

      await appointmentController.getAllAppointments(mockRequest as Request, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
      });
    });
  });

  describe('getAppointmentsByDateRange', () => {
    it('should return appointments within date range successfully', async () => {
      const mockAppointments: AppointmentEntity[] = [
        {
          id: '1',
          title: 'Meeting 1',
          startDate: new Date('2024-03-20T10:00:00Z'),
          endDate: new Date('2024-03-20T11:00:00Z'),
          status: 'scheduled' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          title: 'Meeting 2',
          startDate: new Date('2024-03-21T10:00:00Z'),
          endDate: new Date('2024-03-21T11:00:00Z'),
          status: 'scheduled' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockRequest.query = {
        startDate: '2024-03-20',
        endDate: '2024-03-21',
      };

      appointmentService.getAppointmentsByDateRange.mockResolvedValue(mockAppointments);

      await appointmentController.getAppointmentsByDateRange(mockRequest as Request, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith(mockAppointments);
    });

    it('should handle missing date parameters', async () => {
      mockRequest.query = {};

      await appointmentController.getAppointmentsByDateRange(mockRequest as Request, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Missing required query parameters: startDate, endDate',
      });
    });
  });

  describe('getAppointmentById', () => {
    it('should return appointment by id successfully', async () => {
      const mockAppointment: AppointmentEntity = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Test Meeting',
        startDate: new Date('2024-03-20T10:00:00Z'),
        endDate: new Date('2024-03-20T11:00:00Z'),
        status: 'scheduled' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockRequest.params = { id: '123e4567-e89b-12d3-a456-426614174000' };

      appointmentService.getAppointmentById.mockResolvedValue(mockAppointment);

      await appointmentController.getAppointmentById(mockRequest as Request, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith(mockAppointment);
    });

    it('should handle invalid UUID format', async () => {
      mockRequest.params = { id: 'invalid-uuid' };

      await appointmentController.getAppointmentById(mockRequest as Request, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid appointment ID format. Must be a valid UUID.',
      });
    });

    it('should handle appointment not found', async () => {
      mockRequest.params = { id: '123e4567-e89b-12d3-a456-426614174000' };

      appointmentService.getAppointmentById.mockResolvedValue(null);

      await appointmentController.getAppointmentById(mockRequest as Request, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Appointment not found',
      });
    });
  });

  describe('createAppointment', () => {
    it('should create appointment successfully', async () => {
      const mockAppointment: AppointmentEntity = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'New Meeting',
        startDate: new Date('2024-03-20T10:00:00Z'),
        endDate: new Date('2024-03-20T11:00:00Z'),
        status: 'scheduled' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.body = {
        title: 'New Meeting',
        startDate: '2024-03-20T10:00:00Z',
        endDate: '2024-03-20T11:00:00Z',
      };

      appointmentService.createAppointment.mockResolvedValue(mockAppointment);

      await appointmentController.createAppointment(mockRequest as Request, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(mockAppointment);
    });

    it('should handle missing required fields', async () => {
      mockRequest.body = {
        description: 'Test description',
      };

      await appointmentController.createAppointment(mockRequest as Request, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Missing required fields: title, startDate, endDate',
      });
    });
  });

  describe('updateAppointment', () => {
    it('should update appointment successfully', async () => {
      const mockResult = {
        success: true,
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Updated Meeting',
          startDate: new Date('2024-03-20T10:00:00Z'),
          endDate: new Date('2024-03-20T11:00:00Z'),
          status: 'scheduled' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      mockRequest.params = { id: '123e4567-e89b-12d3-a456-426614174000' };
      mockRequest.body = {
        title: 'Updated Meeting',
      };

      appointmentService.updateAppointment.mockResolvedValue(mockResult);

      await appointmentController.updateAppointment(mockRequest as Request, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle invalid UUID format', async () => {
      mockRequest.params = { id: 'invalid-uuid' };
      mockRequest.body = {
        title: 'Updated Meeting',
      };

      await appointmentController.updateAppointment(mockRequest as Request, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid appointment ID format. Must be a valid UUID.',
      });
    });
  });

  describe('deleteAppointment', () => {
    it('should delete appointment successfully', async () => {
      const mockResult = {
        success: true,
        message: 'Appointment deleted successfully',
      };

      mockRequest.params = { id: '123e4567-e89b-12d3-a456-426614174000' };

      appointmentService.deleteAppointment.mockResolvedValue(mockResult);

      await appointmentController.deleteAppointment(mockRequest as Request, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle invalid UUID format', async () => {
      mockRequest.params = { id: 'invalid-uuid' };

      await appointmentController.deleteAppointment(mockRequest as Request, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid appointment ID format. Must be a valid UUID.',
      });
    });

    it('should handle appointment not found', async () => {
      const mockResult = {
        success: false,
        message: 'Appointment not found',
      };

      mockRequest.params = { id: '123e4567-e89b-12d3-a456-426614174000' };

      appointmentService.deleteAppointment.mockResolvedValue(mockResult);

      await appointmentController.deleteAppointment(mockRequest as Request, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });
  });
}); 