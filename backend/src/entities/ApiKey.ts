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

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @Column({ name: 'requests_per_hour', default: 1000 }) // Rate limit per hour
    requestsPerHour: number;

    @Column({ name: 'last_used_at', type: process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamp', nullable: true })
    lastUsedAt: Date;

    @Column({ name: 'owner_id' })
    ownerId: string;

    @ManyToOne(() => User)
    owner: User;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
