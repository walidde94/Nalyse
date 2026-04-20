import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, BeforeInsert, JoinColumn } from 'typeorm';
import { Organization } from './Organization';
import { File } from './File';
import { Group } from './Group';
import { Report } from './Report';
import { Dashboard } from './Dashboard';

@Entity('users')
export class User {
    @PrimaryColumn('uuid')
    id: string;

    @Column({ unique: true })
    email: string;

    @Column({ name: 'password_hash' })
    passwordHash: string;

    @Column({ name: 'first_name', type: 'varchar', nullable: true })
    firstName: string | null;

    @Column({ name: 'last_name', type: 'varchar', nullable: true })
    lastName: string | null;

    @Column({ name: 'email_verified', default: false })
    emailVerified: boolean;

    @Column({ name: 'email_verification_token', type: 'varchar', nullable: true })
    emailVerificationToken: string | null;

    @Column({ name: 'password_reset_token', type: 'varchar', nullable: true })
    passwordResetToken: string | null;

    @Column({ name: 'password_reset_expires', type: process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamp', nullable: true })
    passwordResetExpires: Date | null;

    @Column({ type: 'varchar', default: 'user' })
    role: 'user' | 'admin';

    @ManyToOne(() => Organization, org => org.users, { nullable: true })
    @JoinColumn({ name: 'organization_id' })
    organization: Organization | null;

    @Column({ name: 'organization_id', type: 'uuid', nullable: true })
    organizationId: string | null;

    @OneToMany(() => File, file => file.owner)
    files: File[];

    @OneToMany(() => Group, group => group.owner)
    groups: Group[];

    @OneToMany(() => Report, report => report.user)
    reports: Report[];

    @OneToMany(() => Dashboard, dashboard => dashboard.user)
    dashboards: Dashboard[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @Column({ name: 'last_login_at', type: process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamp', nullable: true })
    lastLoginAt: Date | null;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @Column({ type: 'varchar', nullable: true })
    bio: string | null;

    @Column({ name: 'display_name', type: 'varchar', nullable: true })
    displayName: string | null;

    @Column({ name: 'avatar_url', type: 'varchar', nullable: true })
    avatarUrl: string | null;

    @Column({ name: 'notification_preferences', type: 'simple-json', default: '{}' })
    notificationPreferences: any;

    @Column({ name: 'api_keys', type: 'simple-json', default: '[]' })
    apiKeys: Array<{ key: string; name: string; createdAt: string }>;

    @Column({ type: 'varchar', default: 'free' })
    plan: 'free' | 'pro' | 'enterprise';

    @Column({ name: 'stripe_customer_id', type: 'varchar', nullable: true })
    stripeCustomerId: string | null;

    @Column({ name: 'subscription_status', type: 'varchar', default: 'inactive' })
    subscriptionStatus: 'active' | 'inactive' | 'trialing' | 'past_due';

    @BeforeInsert()
    generateId() {
        if (!this.id) {
            const { v4: uuidv4 } = require('uuid');
            this.id = uuidv4();
        }
    }
}
