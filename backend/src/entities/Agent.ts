import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne } from 'typeorm';
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

    @Column({ nullable: true })
    currentGoal: string;

    @Column({ type: 'text', nullable: true })
    finalReport: string;

    @ManyToOne(() => User, user => user.id)
    user: User;

    @Column()
    userId: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
