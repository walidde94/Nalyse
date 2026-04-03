import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { User } from './User';

@Entity('remote_sources')
export class RemoteSource {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    type: string;

    @Column({ type: 'simple-json', nullable: true })
    config: any; // { host, port, user, password, database } OR { url, headers }

    @Column({ default: 'active' })
    status: 'active' | 'connection_failed' | 'unauthorized';

    @Column({ type: process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamp', nullable: true })
    lastSyncedAt: Date;

    @Column()
    ownerId: string;

    @ManyToOne(() => User)
    owner: User;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
