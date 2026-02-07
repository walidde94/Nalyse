import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Agent } from './Agent';

@Entity()
export class AgentLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    message: string;

    @Column({ default: 'info' }) // info, warning, error, success
    level: string;

    @ManyToOne(() => Agent, agent => agent.id, { onDelete: 'CASCADE' })
    agent: Agent;

    @Column()
    agentId: string;

    @CreateDateColumn()
    createdAt: Date;
}
