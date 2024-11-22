import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Agency } from "./Agency";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'email', type: 'varchar', length: 255, unique: true })
  email: string;

  @ManyToOne(() => Agency, (agency) => agency.users)
  agency: Agency;
}
