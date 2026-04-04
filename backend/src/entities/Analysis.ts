import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { File } from './File';
import { User } from './User';

@Entity('analyses')
export class Analysis {
    @PrimaryGeneratedColumn('uuid')
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

    @Column({ type: 'simple-json', nullable: true })
    results: any; // Store analysis results

    @Column({ type: 'simple-json', nullable: true })
    insights: any; // Store AI-generated insights

    @Column({ type: 'simple-json', nullable: true })
    statistics: any; // Store statistical analysis

    @Column({ type: 'text', nullable: true })
    errorMessage: string;

    @Column({ type: 'int', nullable: true })
    processingTimeMs: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column({ type: process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamp', nullable: true })
    completedAt: Date;
}
