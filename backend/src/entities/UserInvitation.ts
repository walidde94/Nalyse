import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Organization } from './Organization';
import { User } from './User';

@Entity('user_invitations')
export class UserInvitation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    email: string;

    @Column({ default: 'member' })
    role: 'member' | 'admin';

    @Column()
    token: string;

    @ManyToOne(() => Organization, org => org.id)
    @JoinColumn({ name: 'organization_id' })
    organization: Organization;

    @Column({ name: 'organization_id', type: 'uuid' })
    organizationId: string;

    @ManyToOne(() => User, user => user.id)
    @JoinColumn({ name: 'inviter_id' })
    inviter: User;

    @Column({ name: 'inviter_id', type: 'uuid' })
    inviterId: string;

    @Column({ name: 'expires_at', type: process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamp' })
    expiresAt: Date;

    @Column({ default: 'pending' })
    status: 'pending' | 'accepted' | 'expired';

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
