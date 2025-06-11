import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from "typeorm";

@Entity("appointment_locks")
export class AppointmentLockEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  @Index()
  appointmentId!: string;

  @Column()
  userId!: string;

  @Column("jsonb")
  userInfo!: {
    name: string;
    email: string;
    position?: { x: number; y: number };
  };

  @CreateDateColumn()
  createdAt!: Date;

  @Column("timestamp")
  expiresAt!: Date;
}
