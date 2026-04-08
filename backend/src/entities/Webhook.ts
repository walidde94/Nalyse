import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Organization } from './Organization';

@Entity('webhooks')
export class Webhook {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    url: string;

    @Column('text', { array: true })
    events: string[];

    @Column()
    secret: string;

    @Column({ default: 'active' })
    status: string;

    @Column({ nullable: true })
    description: string;

    @Column('jsonb', { nullable: true })
    retryPolicy: { maxRetries: number; backoffMs: number };

    @Column({ default: 0 })
    deliveries: number;

    @Column({ default: 0 })
    successCount: number;

    @Column({ default: 0 })
    failureCount: number;

    @Column({ type: 'float', default: 0 })
    failureRate: number;

    @Column({ default: 0 })
    avgLatency: number;

    @Column({ type: 'timestamp', nullable: true })
    lastTriggered: Date;

    @Column()
    organizationId: string;

    @ManyToOne(() => Organization)
    @JoinColumn({ name: 'organizationId' })
    organization: Organization;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
