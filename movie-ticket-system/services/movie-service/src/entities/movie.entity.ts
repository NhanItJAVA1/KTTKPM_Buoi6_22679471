import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("movies")
export class Movie {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  genre: string;

  @Column()
  duration: number; // phút

  @Column({ type: "date", nullable: true })
  releaseDate: Date;

  @Column({ nullable: true })
  posterUrl: string;

  @Column({ default: 100 })
  totalSeats: number;

  @Column({ default: 100 })
  availableSeats: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  price: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
