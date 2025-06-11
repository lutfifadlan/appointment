import "reflect-metadata";
import { DataSource } from "typeorm";
import { AppointmentLockEntity } from "../entities/AppointmentLockEntity";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "appointment_db",
  synchronize: process.env.NODE_ENV !== "production",
  logging: process.env.NODE_ENV !== "production",
  entities: [AppointmentLockEntity],
  migrations: ["src/migrations/*.ts"],
  subscribers: [],
});
