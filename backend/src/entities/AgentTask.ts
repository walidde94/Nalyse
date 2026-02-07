import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Agent } from './Agent';

@Entity()
export class AgentTask {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    description: string;

    @Column({ default: 'pending' }) // pending, running, completed, failed
    status: string;

    @Column({ type: 'text', nullable: true })
    result: string;

    @ManyToOne(() => Agent, agent => agent.id, { onDelete: 'CASCADE' })
    agent: Agent;

    @Column()
    agentId: string;

    @CreateDateColumn()
    createdAt: Date;
}
