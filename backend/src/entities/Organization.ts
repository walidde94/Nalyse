import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { User } from './User';
import { File } from './File';

@Entity('organizations')
export class Organization {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    name: string;

    @Column({ type: 'varchar', unique: true, nullable: true })
    slug: string | null;

    @Column({ type: 'varchar', default: 'free' })
    plan: 'free' | 'pro' | 'enterprise';

    @Column({ type: 'varchar', nullable: true })
    stripeCustomerId: string | null;

    @Column({ type: 'varchar', nullable: true })
    stripeSubscriptionId: string | null;

    @Column({ type: 'bigint', default: 0 })
    storageUsed: number;

    @Column({ type: 'bigint', default: 5368709120 }) // 5GB default for free plan
    storageLimit: number;

    @Column({ type: 'int', default: 5 })
    userLimit: number;

    @Column({ type: 'int', default: 10 })
    fileLimit: number;

    @OneToMany(() => User, user => user.organization)
    users: User[];

    @OneToMany(() => File, file => file.organization)
    files: File[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column({ default: true })
    isActive: boolean;
}
