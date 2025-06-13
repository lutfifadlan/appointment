import { AppDataSource } from '../config/data-source';
import { AppointmentEntity } from '../entities/AppointmentEntity';
import { Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';

const appointmentRepository = AppDataSource.getRepository(AppointmentEntity);

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

const appointmentService = {
  // Create a new appointment
  async createAppointment(data: AppointmentData): Promise<AppointmentEntity> {
    const appointment = appointmentRepository.create(data);
    return await appointmentRepository.save(appointment);
  },

  // Get all appointments
  async getAllAppointments(): Promise<AppointmentEntity[]> {
    return await appointmentRepository.find({
      order: {
        startDate: 'ASC'
      }
    });
  },

  // Get appointments by date range
  async getAppointmentsByDateRange(startDate: Date, endDate: Date): Promise<AppointmentEntity[]> {
    return await appointmentRepository.find({
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
  },

  // Get appointment by ID
  async getAppointmentById(id: string): Promise<AppointmentEntity | null> {
    return await appointmentRepository.findOneBy({ id });
  },

  // Update appointment
  async updateAppointment(id: string, data: Partial<AppointmentData>): Promise<{
    success: boolean;
    appointment?: AppointmentEntity;
    message?: string;
  }> {
    const appointment = await appointmentRepository.findOneBy({ id });
    
    if (!appointment) {
      return {
        success: false,
        message: 'Appointment not found'
      };
    }

    // Update the appointment with the new data
    appointmentRepository.merge(appointment, data);
    const updatedAppointment = await appointmentRepository.save(appointment);
    
    return {
      success: true,
      appointment: updatedAppointment
    };
  },

  // Delete appointment
  async deleteAppointment(id: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    const appointment = await appointmentRepository.findOneBy({ id });
    
    if (!appointment) {
      return {
        success: false,
        message: 'Appointment not found'
      };
    }

    await appointmentRepository.remove(appointment);
    
    return {
      success: true,
      message: 'Appointment deleted successfully'
    };
  }
};

export default appointmentService;