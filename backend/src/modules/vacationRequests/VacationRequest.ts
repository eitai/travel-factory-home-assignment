import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  VacationRequestStatus,
  vacationRequestStatusValues,
  type IsoDate,
} from '@vacation-manager/shared';
import { User } from '../users/User';

@Entity({ name: 'vacation_requests' })
export class VacationRequest {
  @PrimaryGeneratedColumn('identity', { type: 'integer', generatedIdentity: 'ALWAYS' })
  id!: number;

  @Column({ name: 'user_id', type: 'integer' })
  userId!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ name: 'start_date', type: 'date' })
  startDate!: IsoDate;

  @Column({ name: 'end_date', type: 'date' })
  endDate!: IsoDate;

  @Column({ type: 'text', nullable: true })
  reason!: string | null;

  @Column({
    type: 'enum',
    enum: vacationRequestStatusValues,
    enumName: 'vacation_request_status',
    default: VacationRequestStatus.Pending,
  })
  status!: VacationRequestStatus;

  @Column({ type: 'text', nullable: true })
  comments!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
