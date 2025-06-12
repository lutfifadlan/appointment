import "reflect-metadata";
import { DataSource, DataSourceOptions } from "typeorm";
import { AppointmentLockEntity } from "../entities/AppointmentLockEntity";

// Define data source options based on environment
let dataSourceOptions: DataSourceOptions;

// Check if DB_URL is provided (typically in production)
if (process.env.DB_URL) {
  dataSourceOptions = {
    type: "postgres",
    url: process.env.DB_URL,
    synchronize: false, // Never auto-sync in production
    logging: process.env.NODE_ENV === "development",
    entities: [AppointmentLockEntity],
    migrations: ["dist/migrations/*.js"], // Use compiled JS in production
    subscribers: [],
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  };
} else {
  // Default configuration using individual connection parameters
  dataSourceOptions = {
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    database: process.env.DB_NAME || "appointment_db",
    synchronize: process.env.NODE_ENV === "development",
    logging: process.env.NODE_ENV === "development",
    entities: [AppointmentLockEntity],
    migrations: [process.env.NODE_ENV === "production" ? "dist/migrations/*.js" : "src/migrations/*.ts"],
    subscribers: [],
  };
}

export const AppDataSource = new DataSource(dataSourceOptions);
