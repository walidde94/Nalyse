import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from './User';
import { Organization } from './Organization';

@Entity('activity_logs')
export class ActivityLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    action: string; // 'create_analysis', 'upload_file', 'invite_user', etc.

    @Column({ type: 'jsonb', nullable: true })
    metadata: any;

    @ManyToOne(() => User, user => user.id)
    actor: User;

    @Column()
    actorId: string;

    @ManyToOne(() => Organization, org => org.id)
    organization: Organization;

    @Column()
    organizationId: string;

    @CreateDateColumn()
    createdAt: Date;
}
