import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { roleValues, type Role } from '@vacation-manager/shared';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('identity', { type: 'integer', generatedIdentity: 'ALWAYS' })
  id!: number;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 255, select: false })
  password!: string;

  @Column({ type: 'enum', enum: roleValues, enumName: 'user_role' })
  role!: Role;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
