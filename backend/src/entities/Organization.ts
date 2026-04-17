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

    @Column({ type: 'varchar', default: 'free' })
    plan: 'free' | 'pro' | 'enterprise';

    @Column({ type: 'varchar', nullable: true })
    stripeCustomerId: string | null;

    @Column({ type: 'varchar', nullable: true })
    stripeSubscriptionId: string | null;

    @Column({ type: 'timestamp', nullable: true })
    subscriptionStartedAt: Date | null;

    @Column({ type: 'timestamp', nullable: true })
    currentPeriodEnd: Date | null;

    @Column({ type: 'boolean', default: false })
    cancelAtPeriodEnd: boolean;

    @Column({ type: 'bigint', default: 0 })
    storageUsed: number;

    @Column({ type: 'bigint', default: 104857600 }) // 100MB default for free plan
    storageLimit: number;

    @Column({ type: 'int', default: 1 })
    userLimit: number;

    @Column({ type: 'int', default: 5 })
    fileLimit: number;

    @OneToMany(() => User, user => user.organization)
    users: User[];

    @OneToMany(() => File, file => file.organization)
    files: File[];

    @OneToMany(() => Dashboard, dashboard => dashboard.organization)
    dashboards: Dashboard[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column({ default: true })
    isActive: boolean;

    @BeforeInsert()
    generateId() {
        if (!this.id) {
            const { v4: uuidv4 } = require('uuid');
            this.id = uuidv4();
        }
    }
}
