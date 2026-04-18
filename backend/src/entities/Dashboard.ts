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

    @Column({ type: 'jsonb', default: [] })
    gridLayout: any[];

    @Column()
    userId: string;

    @Column({ nullable: true })
    organizationId: string;

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
