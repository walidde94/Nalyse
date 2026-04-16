import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';
import { Organization } from './Organization';

@Entity('dashboards')
export class Dashboard {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ type: 'jsonb', default: [] })
    panels: any[];

    @Column({ type: 'jsonb', default: [] })
    gridLayout: any[];

    @Column()
    userId: string;

    @Column({ nullable: true })
    organizationId: string;

    @Column({ nullable: true })
    workspaceId: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => User, (user) => user.dashboards)
    @JoinColumn({ name: 'userId' })
    user: User;

    @ManyToOne(() => Organization, (org) => org.dashboards)
    @JoinColumn({ name: 'organizationId' })
    organization: Organization;
}
