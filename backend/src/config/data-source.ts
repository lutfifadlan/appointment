import "reflect-metadata";
import { DataSource } from "typeorm";
import { AppointmentLockEntity } from "../entities/AppointmentLockEntity";
import { AppointmentEntity } from "../entities/AppointmentEntity";
import { UserEntity } from "../entities/UserEntity";
import path from "path";

const isTest = process.env.NODE_ENV === "test";

export const AppDataSource = new DataSource({
  type: isTest ? "sqlite" : "postgres",
  host: isTest ? undefined : process.env.DB_HOST || "localhost",
  port: isTest ? undefined : parseInt(process.env.DB_PORT || "5432"),
  username: isTest ? undefined : process.env.DB_USERNAME || "postgres",
  password: isTest ? undefined : process.env.DB_PASSWORD || "postgres",
  database: isTest ? path.join(__dirname, "../../test.sqlite") : process.env.DB_NAME || "appointment_db",
  synchronize: true, // Always true for tests, controlled by NODE_ENV for other environments
  logging: process.env.NODE_ENV !== "production",
  entities: [AppointmentLockEntity, AppointmentEntity, UserEntity],
  migrations: ["dist/migrations/*.js"],
  subscribers: [],
});
