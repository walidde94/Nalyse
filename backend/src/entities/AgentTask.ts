import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
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
    @JoinColumn({ name: 'agent_id' })
    agent: Agent;

    @Column({ name: 'agent_id' })
    agentId: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
