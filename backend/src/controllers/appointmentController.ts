import { Request, Response } from 'express';
import appointmentService from '../services/appointmentService';
import { validate as uuidValidate } from 'uuid';

export const getAllAppointments = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const appointments = await appointmentService.getAllAppointments();
    res.json(appointments);
  } catch (error) {
    console.error('Error getting all appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getAppointmentsByDateRange = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required query parameters: startDate, endDate',
      });
    }
    
    const appointments = await appointmentService.getAppointmentsByDateRange(
      new Date(startDate as string),
      new Date(endDate as string)
    );
    
    res.json(appointments);
  } catch (error) {
    console.error('Error getting appointments by date range:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getAppointmentById = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { id } = req.params;
    
    // Validate UUID format
    if (!uuidValidate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment ID format. Must be a valid UUID.',
      });
    }
    
    const appointment = await appointmentService.getAppointmentById(id);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }
    
    res.json(appointment);
  } catch (error) {
    console.error('Error getting appointment by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const createAppointment = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { title, description, startDate, endDate, status, location, organizer, attendees } = req.body;
    
    if (!title || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, startDate, endDate',
      });
    }
    
    const appointment = await appointmentService.createAppointment({
      title,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status,
      location,
      organizer,
      attendees,
    });
    
    res.status(201).json(appointment);
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const updateAppointment = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { id } = req.params;
    
    // Validate UUID format
    if (!uuidValidate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment ID format. Must be a valid UUID.',
      });
    }
    
    const { title, description, startDate, endDate, status, location, organizer, attendees } = req.body;
    
    const updateData: any = {};
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (status !== undefined) updateData.status = status;
    if (location !== undefined) updateData.location = location;
    if (organizer !== undefined) updateData.organizer = organizer;
    if (attendees !== undefined) updateData.attendees = attendees;
    
    const result = await appointmentService.updateAppointment(id, updateData);
    
    if (!result.success) {
      return res.status(404).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const deleteAppointment = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { id } = req.params;
    
    // Validate UUID format
    if (!uuidValidate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment ID format. Must be a valid UUID.',
      });
    }
    
    const result = await appointmentService.deleteAppointment(id);
    
    if (!result.success) {
      return res.status(404).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
