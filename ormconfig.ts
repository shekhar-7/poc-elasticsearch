import { DataSource } from "typeorm";
import { Agency } from "./src/entities/Agency";
import { User } from "./src/entities/User";
import dotenv from "dotenv";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER || "your_username",
  password: process.env.DB_PASSWORD || "your_password",
  database: process.env.DB_NAME || "sample_app",
  entities: [Agency, User],
  synchronize: true, // Automatically sync schema (use cautiously in production)
  logging: false,
});
