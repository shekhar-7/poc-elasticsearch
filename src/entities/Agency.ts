import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { User } from "./User";
import { Project } from "./Project";

@Entity()
export class Agency {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: number;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'address', type: 'varchar', length: 255 })
  address: string;

  @OneToMany(() => User, (user) => user.agency)
  users: User[];

  @OneToMany(() => Project, (project) => project.agency)
  projects: Project[];
}
