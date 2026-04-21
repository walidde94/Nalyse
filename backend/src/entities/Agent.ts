import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';

@Entity()
export class Agent {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    role: string; // 'inspector', 'analyst', 'architect'

    @Column()
    status: string; // 'idle', 'working', 'paused'

    @Column({ name: 'current_goal', nullable: true })
    currentGoal: string;

    @Column({ name: 'final_report', type: 'text', nullable: true })
    finalReport: string;

    @ManyToOne(() => User, user => user.id)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'user_id' })
    userId: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
