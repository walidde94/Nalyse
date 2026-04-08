import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Webhook } from './Webhook';

@Entity('webhook_logs')
export class WebhookLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    webhookId: string;

    @ManyToOne(() => Webhook)
    @JoinColumn({ name: 'webhookId' })
    webhook: Webhook;

    @Column()
    event: string;

    @Column()
    status: number;

    @Column()
    duration: number;

    @CreateDateColumn()
    timestamp: Date;

    @Column({ default: 1 })
    attempt: number;

    @Column('jsonb', { nullable: true })
    requestHeaders: any;

    @Column('text', { nullable: true })
    requestBody: string;

    @Column('text', { nullable: true })
    responseBody: string;

    @Column()
    organizationId: string;
}
