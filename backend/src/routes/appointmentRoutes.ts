import express from 'express';
import * as appointmentController from '../controllers/appointmentController';

const router = express.Router();

// Get all appointments
router.get('/appointments', appointmentController.getAllAppointments);

// Get appointments by date range
router.get('/appointments/date-range', appointmentController.getAppointmentsByDateRange);

// Get appointment by ID
router.get('/appointments/:id', appointmentController.getAppointmentById);

// Create new appointment
router.post('/appointments', appointmentController.createAppointment);

// Update appointment
router.put('/appointments/:id', appointmentController.updateAppointment);

// Delete appointment
router.delete('/appointments/:id', appointmentController.deleteAppointment);

export default router;
