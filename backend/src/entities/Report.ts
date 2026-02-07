import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from './User';

@Entity('reports')
export class Report {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column({ type: 'text' })
    config: string;

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => User, user => user.reports)
    user: User;

    @Column()
    userId: string; // Changed from Int to string (UUID)

    @Column({ nullable: true, unique: true })
    shareToken: string;

    @Column({ default: false })
    isPublic: boolean;
}
