import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, Index } from 'typeorm';
import { User } from './User';

@Entity('api_keys')
export class ApiKey {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Index()
    @Column({ unique: true })
    key: string; // Stored as plain string for this demo, usually hashed.

    @Column({ default: true })
    isActive: boolean;

    @Column({ default: 1000 }) // Rate limit per hour
    requestsPerHour: number;

    @Column({ type: process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamp', nullable: true })
    lastUsedAt: Date;

    @Column()
    ownerId: string;

    @ManyToOne(() => User)
    owner: User;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
