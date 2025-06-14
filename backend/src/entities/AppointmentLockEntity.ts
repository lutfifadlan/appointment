import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from "typeorm";

@Entity("appointment_locks")
export class AppointmentLockEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "appointment_id" })
  @Index()
  appointmentId!: string;

  @Column({ name: "user_id" })
  userId!: string;

  @Column({ 
    name: "user_info", 
    type: process.env.NODE_ENV === "test" ? "simple-json" : "jsonb"
  })
  userInfo!: {
    name: string;
    email: string;
    position?: { x: number; y: number };
  };

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @Column({ 
    name: "expires_at", 
    type: process.env.NODE_ENV === "test" ? "datetime" : "timestamp" 
  })
  expiresAt!: Date;
}
