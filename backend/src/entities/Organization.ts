import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, BeforeInsert } from 'typeorm';
import { User } from './User';
import { File } from './File';
import { Dashboard } from './Dashboard';

@Entity('organizations')
export class Organization {
    @PrimaryColumn('uuid')
    id: string;

    @Column({ unique: true })
    name: string;

    @Column({ type: 'varchar', unique: true, nullable: true })
    slug: string | null;

    @Column({ name: 'subscription_tier', type: 'varchar', default: 'free' })
    subscriptionTier: string;

    @Column({ type: 'varchar', default: 'free' })
    plan: 'free' | 'pro' | 'enterprise';

    @Column({ name: 'stripe_customer_id', type: 'varchar', nullable: true })
    stripeCustomerId: string | null;

    @Column({ name: 'stripe_subscription_id', type: 'varchar', nullable: true })
    stripeSubscriptionId: string | null;

    @Column({ name: 'subscription_started_at', type: 'timestamp', nullable: true })
    subscriptionStartedAt: Date | null;

    @Column({ name: 'current_period_end', type: 'timestamp', nullable: true })
    currentPeriodEnd: Date | null;

    @Column({ name: 'cancel_at_period_end', type: 'boolean', default: false })
    cancelAtPeriodEnd: boolean;

    @Column({ name: 'storage_used', type: 'bigint', default: 0 })
    storageUsed: number;

    @Column({ name: 'storage_limit', type: 'bigint', default: 104857600 }) // 100MB default for free plan
    storageLimit: number;

    @Column({ name: 'user_limit', type: 'int', default: 1 })
    userLimit: number;

    @Column({ name: 'file_limit', type: 'int', default: 5 })
    fileLimit: number;

    @OneToMany(() => User, user => user.organization)
    users: User[];

    @OneToMany(() => File, file => file.organization)
    files: File[];

    @OneToMany(() => Dashboard, dashboard => dashboard.organization)
    dashboards: Dashboard[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @BeforeInsert()
    generateId() {
        if (!this.id) {
            const { v4: uuidv4 } = require('uuid');
            this.id = uuidv4();
        }
    }
}
