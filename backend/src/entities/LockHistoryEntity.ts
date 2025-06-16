import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from "typeorm";

export enum LockAction {
  ACQUIRED = "acquired",
  RELEASED = "released",
  EXPIRED = "expired",
  FORCE_RELEASED = "force_released"
}

@Entity("lock_history")
export class LockHistoryEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "appointment_id" })
  @Index()
  appointmentId!: string;

  @Column({ name: "user_id" })
  userId!: string;

  @Column({ name: "user_name" })
  userName!: string;

  @Column({ name: "user_email" })
  userEmail!: string;

  @Column({
    type: "enum",
    enum: LockAction,
    default: LockAction.ACQUIRED
  })
  action!: LockAction;

  @CreateDateColumn({ name: "timestamp" })
  timestamp!: Date;

  @Column({ name: "duration", type: "int", nullable: true })
  duration?: number; // Duration in seconds

  @Column({ name: "released_by", nullable: true })
  releasedBy?: string; // For force releases, who released it

  @Column({ name: "lock_id", nullable: true })
  lockId?: string; // Reference to the original lock

  @Column({ 
    name: "metadata", 
    type: process.env.NODE_ENV === "test" ? "simple-json" : "jsonb",
    nullable: true
  })
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
    sessionId?: string;
    [key: string]: any;
  };
} 