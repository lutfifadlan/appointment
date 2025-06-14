import { AppDataSource } from '../config/data-source';
import { AppointmentEntity } from '../entities/AppointmentEntity';
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';

interface AppointmentData {
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  status?: 'scheduled' | 'completed' | 'cancelled';
  location?: string;
  organizer?: string;
  attendees?: string[];
}

interface AppointmentError extends Error {
  code?: string;
  status?: number;
}

interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export class AppointmentService {
  private appointmentRepository: Repository<AppointmentEntity>;

  constructor() {
    this.appointmentRepository = AppDataSource.getRepository(AppointmentEntity);
  }

  /**
   * Create a new appointment
   * @param data - Appointment data
   * @throws {AppointmentError} If appointment creation fails
   */
  async createAppointment(data: AppointmentData): Promise<AppointmentEntity> {
    try {
      const appointment = this.appointmentRepository.create(data);
      return await this.appointmentRepository.save(appointment);
    } catch (error) {
      console.error('Failed to create appointment:', error);
      const appError = new Error('Failed to create appointment') as AppointmentError;
      appError.code = 'CREATE_FAILED';
      appError.status = 500;
      throw appError;
    }
  }

  /**
   * Get all appointments
   * @returns Array of appointments sorted by start date
   */
  async getAllAppointments(): Promise<AppointmentEntity[]> {
    try {
      return await this.appointmentRepository.find({
        order: {
          startDate: 'ASC'
        }
      });
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
      throw new Error('Failed to fetch appointments');
    }
  }

  /**
   * Get appointments within a date range
   * @param startDate - Start date of the range
   * @param endDate - End date of the range
   * @returns Array of appointments within the date range
   */
  async getAppointmentsByDateRange(startDate: Date, endDate: Date): Promise<AppointmentEntity[]> {
    try {
      return await this.appointmentRepository.find({
        where: [
          { startDate: Between(startDate, endDate) },
          { endDate: Between(startDate, endDate) },
          {
            startDate: LessThanOrEqual(startDate),
            endDate: MoreThanOrEqual(endDate)
          }
        ],
        order: {
          startDate: 'ASC'
        }
      });
    } catch (error) {
      console.error('Failed to fetch appointments by date range:', error);
      throw new Error('Failed to fetch appointments by date range');
    }
  }

  /**
   * Get an appointment by ID
   * @param id - Appointment ID
   * @throws {AppointmentError} If appointment is not found
   */
  async getAppointmentById(id: string): Promise<AppointmentEntity | null> {
    try {
      return await this.appointmentRepository.findOneBy({ id });
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      throw new Error('Failed to fetch appointment');
    }
  }

  /**
   * Update an appointment
   * @param id - Appointment ID
   * @param data - Updated appointment data
   * @throws {AppointmentError} If appointment is not found or update fails
   */
  async updateAppointment(id: string, data: Partial<AppointmentData>): Promise<ServiceResponse<AppointmentEntity>> {
    try {
      const appointment = await this.appointmentRepository.findOneBy({ id });
      
      if (!appointment) {
        return {
          success: false,
          message: 'Appointment not found'
        };
      }

      this.appointmentRepository.merge(appointment, data);
      const updatedAppointment = await this.appointmentRepository.save(appointment);
      
      return {
        success: true,
        data: updatedAppointment
      };
    } catch (error) {
      console.error('Failed to update appointment:', error);
      return {
        success: false,
        message: 'Failed to update appointment'
      };
    }
  }

  /**
   * Delete an appointment
   * @param id - Appointment ID
   * @throws {AppointmentError} If appointment is not found or deletion fails
   */
  async deleteAppointment(id: string): Promise<ServiceResponse<void>> {
    try {
      const appointment = await this.appointmentRepository.findOneBy({ id });
      
      if (!appointment) {
        return {
          success: false,
          message: 'Appointment not found'
        };
      }

      await this.appointmentRepository.remove(appointment);
      
      return {
        success: true,
        message: 'Appointment deleted successfully'
      };
    } catch (error) {
      console.error('Failed to delete appointment:', error);
      return {
        success: false,
        message: 'Failed to delete appointment'
      };
    }
  }
}

export default new AppointmentService();