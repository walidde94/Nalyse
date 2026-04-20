import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, BeforeInsert, BeforeUpdate } from 'typeorm';
import { File } from './File';
import { User } from './User';

const isTest = process.env.NODE_ENV === 'test';

@Entity('analyses')
export class Analysis {
    @PrimaryColumn('uuid')
    id: string;

    @ManyToOne(() => File, file => file.analyses, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'file_id' })
    file: File;

    @Column({ name: 'file_id', type: 'uuid' })
    fileId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'created_by_id' })
    createdBy: User;

    @Column({ name: 'created_by_id', type: 'uuid' })
    createdById: string;

    @Column({ type: 'varchar', default: 'pending' })
    status: 'pending' | 'processing' | 'completed' | 'failed';

    @Column({ type: isTest ? 'simple-json' : 'jsonb', nullable: true })
    results: any;

    @Column({ type: isTest ? 'simple-json' : 'jsonb', nullable: true })
    insights: any;

    @Column({ type: isTest ? 'simple-json' : 'jsonb', nullable: true })
    statistics: any;

    @Column({ name: 'error_message', type: 'text', nullable: true })
    errorMessage: string;

    @Column({ name: 'processing_time_ms', type: 'int', nullable: true })
    processingTimeMs: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @Column({ name: 'completed_at', type: isTest ? 'datetime' : 'timestamp', nullable: true })
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
