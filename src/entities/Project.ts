import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Agency } from "./Agency";

export enum ProjectType {
    WEDDING = 'wedding',
    PHOTOGRAPHY = 'photography',
    CONTENT_CREATION = 'content-creation',
  }

@Entity()
export class Project {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'projectName', type: 'varchar', length: 255 })
  projectName: string;

  @Column({ name: 'type', type: 'varchar', length: 255, enum: ProjectType })
  type: string;

  @ManyToOne(() => Agency, (agency) => agency.projects)
  agency: Agency;
}
