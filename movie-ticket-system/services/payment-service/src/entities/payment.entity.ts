import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from "typeorm";

export enum PaymentStatus {
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
}

@Entity("payments")
export class Payment {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  bookingId: string;

  @Column()
  userId: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  amount: number;

  @Column({ type: "enum", enum: PaymentStatus })
  status: PaymentStatus;

  @CreateDateColumn()
  processedAt: Date;
}
