import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, BeforeInsert, BeforeUpdate } from 'typeorm';
import { User } from './User';
import { Organization } from './Organization';

@Entity('dashboards')
export class Dashboard {
    @PrimaryColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ type: 'jsonb', default: [] })
    panels: any[];

    @Column({ name: 'grid_layout', type: 'jsonb', default: [] })
    gridLayout: any[];

    @Column({ name: 'user_id', type: 'uuid' })
    userId: string;

    @Column({ name: 'organization_id', type: 'uuid', nullable: true })
    organizationId: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @ManyToOne(() => User, (user) => user.dashboards)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Organization, (org) => org.dashboards)
    @JoinColumn({ name: 'organization_id' })
    organization: Organization;

    @BeforeInsert()
    generateIdAndDates() {
        if (!this.id) {
            const { v4: uuidv4 } = require('uuid');
            this.id = uuidv4();
        }
        if (!this.createdAt) this.createdAt = new Date();
        if (!this.updatedAt) this.updatedAt = new Date();
    }

    @BeforeUpdate()
    updateDate() {
        this.updatedAt = new Date();
    }
}
