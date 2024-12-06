import "reflect-metadata";
import { DataSource } from "typeorm";
import { Agency } from "./entities/Agency";
import { User } from "./entities/User";
import dotenv from "dotenv";
import { Project } from "./entities/Project";
// import { UserAgency } from "./entities/UserAgency";

dotenv.config();

console.log(process.env.DB_HOST, process.env.DB_PORT, process.env.DB_USER, process.env.DB_PASSWORD, process.env.DB_NAME)

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [Agency, User, Project],
  synchronize: true, // Automatically sync schema
  logging: false,
});
