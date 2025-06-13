import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("appointments")
export class AppointmentEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  title!: string;

  @Column({ nullable: true, type: "text" })
  description?: string;

  @Column("timestamp")
  startDate!: Date;

  @Column("timestamp")
  endDate!: Date;

  @Column({
    type: "enum",
    enum: ["scheduled", "completed", "cancelled"],
    default: "scheduled"
  })
  status!: "scheduled" | "completed" | "cancelled";

  @Column({ nullable: true })
  location?: string;

  @Column({ nullable: true })
  organizer?: string;

  @Column("simple-array", { nullable: true })
  attendees?: string[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
