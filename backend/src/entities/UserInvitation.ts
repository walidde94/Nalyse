import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
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
    organization: Organization;

    @Column()
    organizationId: string;

    @ManyToOne(() => User, user => user.id)
    inviter: User;

    @Column()
    inviterId: string;

    @Column({ type: process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamp' })
    expiresAt: Date;

    @Column({ default: 'pending' })
    status: 'pending' | 'accepted' | 'expired';

    @CreateDateColumn()
    createdAt: Date;
}
