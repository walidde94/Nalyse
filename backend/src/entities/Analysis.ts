import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, BeforeInsert, BeforeUpdate } from 'typeorm';
import { File } from './File';
import { User } from './User';

const isTest = process.env.NODE_ENV === 'test';

@Entity('analyses')
export class Analysis {
    @PrimaryColumn('uuid')
    id: string;

    @ManyToOne(() => File, file => file.analyses, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'fileId' })
    file: File;

    @Column()
    fileId: string;

    @ManyToOne(() => User)
    createdBy: User;

    @Column()
    createdById: string;

    @Column({ type: 'varchar', default: 'pending' })
    status: 'pending' | 'processing' | 'completed' | 'failed';

    @Column({ type: isTest ? 'simple-json' : 'jsonb', nullable: true })
    results: any;

    @Column({ type: isTest ? 'simple-json' : 'jsonb', nullable: true })
    insights: any;

    @Column({ type: isTest ? 'simple-json' : 'jsonb', nullable: true })
    statistics: any;

    @Column({ type: 'text', nullable: true })
    errorMessage: string;

    @Column({ type: 'int', nullable: true })
    processingTimeMs: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column({ type: isTest ? 'datetime' : 'timestamp', nullable: true })
    completedAt: Date;

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
