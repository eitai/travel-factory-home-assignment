import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import {
  vacationRequestEventTypeValues,
  type VacationRequestEventType,
  type VacationRequestHistoryDetails,
} from '@vacation-manager/shared';
import { User } from '../users/User';
import { VacationRequest } from '../vacationRequests/VacationRequest';

@Entity({ name: 'vacation_request_events' })
export class VacationRequestEvent {
  @PrimaryGeneratedColumn('identity', { type: 'integer', generatedIdentity: 'ALWAYS' })
  id!: number;

  @Column({ name: 'vacation_request_id', type: 'integer' })
  vacationRequestId!: number;

  @ManyToOne(() => VacationRequest, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vacation_request_id' })
  vacationRequest?: VacationRequest;

  @Column({
    type: 'enum',
    enum: vacationRequestEventTypeValues,
    enumName: 'vacation_request_event_type',
  })
  type!: VacationRequestEventType;

  @Column({ name: 'actor_user_id', type: 'integer' })
  actorUserId!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'actor_user_id' })
  actor?: User;

  @Column({ type: 'jsonb', nullable: true })
  details!: VacationRequestHistoryDetails | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
