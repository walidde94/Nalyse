import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { Organization } from './Organization';
import { File } from './File';
import { Group } from './Group';
import { Report } from './Report';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    email: string;

    @Column()
    passwordHash: string;

    @Column({ type: 'varchar', nullable: true })
    firstName: string | null;

    @Column({ type: 'varchar', nullable: true })
    lastName: string | null;

    @Column({ default: false })
    emailVerified: boolean;

    @Column({ type: 'varchar', nullable: true })
    emailVerificationToken: string | null;

    @Column({ type: 'varchar', nullable: true })
    passwordResetToken: string | null;

    @Column({ type: process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamp', nullable: true })
    passwordResetExpires: Date | null;

    @Column({ type: 'varchar', default: 'user' })
    role: 'user' | 'admin';

    @ManyToOne(() => Organization, org => org.users, { nullable: true })
    organization: Organization | null;

    @Column({ nullable: true })
    organizationId: string | null;

    @OneToMany(() => File, file => file.owner)
    files: File[];

    @OneToMany(() => Group, group => group.owner)
    groups: Group[];

    @OneToMany(() => Report, report => report.user)
    reports: Report[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column({ type: process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamp', nullable: true })
    lastLoginAt: Date | null;

    @Column({ default: true })
    isActive: boolean;

    @Column({ type: 'varchar', nullable: true })
    bio: string | null;

    @Column({ type: 'varchar', nullable: true })
    displayName: string | null;

    @Column({ type: 'varchar', nullable: true })
    avatarUrl: string | null;

    @Column({ type: 'simple-json', default: '{}' })
    notificationPreferences: any;

    @Column({ type: 'simple-json', default: '[]' })
    apiKeys: Array<{ key: string; name: string; createdAt: string }>;

    @Column({ type: 'varchar', default: 'free' })
    plan: 'free' | 'pro' | 'enterprise';

    @Column({ type: 'varchar', nullable: true })
    stripeCustomerId: string | null;

    @Column({ type: 'varchar', default: 'inactive' })
    subscriptionStatus: 'active' | 'inactive' | 'trialing' | 'past_due';
}
