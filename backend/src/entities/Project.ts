import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { User } from './User';

@Entity('projects')
export class Project {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column({ type: 'text' })
    description: string;

    @Column()
    objective: string;

    @Column({ type: 'simple-json', nullable: true })
    actions: string[];

    @Column({ default: 'active' })
    status: string; // 'active' | 'completed' | 'on_hold' | 'cancelled'

    @Column({ nullable: true })
    impact: string;

    @Column()
    ownerId: string;

    @ManyToOne(() => User)
    owner: User;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
