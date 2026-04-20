import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, BeforeInsert, BeforeUpdate, JoinColumn } from 'typeorm';
import { User } from './User';
import { Organization } from './Organization';
import { Analysis } from './Analysis';
import { Group } from './Group';

@Entity('files')
export class File {
    @PrimaryColumn('uuid')
    id: string;

    @Column()
    filename: string;

    @Column({ name: 'original_name' })
    originalName: string;

    @Column({ type: 'bigint' })
    size: number;

    @Column({ name: 'mime_type' })
    mimeType: string;

    @Column({ name: 's3_key', nullable: true })
    s3Key: string; // Path in S3 bucket

    @Column({ name: 's3_bucket', nullable: true })
    s3Bucket: string;

    @ManyToOne(() => User, user => user.files)
    @JoinColumn({ name: 'owner_id' })
    owner: User;

    @Column({ name: 'owner_id', type: 'uuid' })
    ownerId: string;

    @ManyToOne(() => Organization, org => org.files)
    @JoinColumn({ name: 'organization_id' })
    organization: Organization;

    @Column({ name: 'organization_id', type: 'uuid' })
    organizationId: string;

    @Column({ name: 'workspace_id', type: 'uuid', nullable: true })
    workspaceId: string;

    @OneToMany(() => Analysis, analysis => analysis.file)
    analyses: Analysis[];

    @ManyToOne(() => Group, group => group.files, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'group_id' })
    group: Group;

    @Column({ name: 'group_id', type: 'uuid', nullable: true })
    groupId: string | null;

    @Column({ name: 'is_favorite', default: false })
    isFavorite: boolean;

    @Column({ type: 'simple-json', nullable: true })
    metadata: any; // Store column info, row count, etc.

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @Column({ name: 'is_deleted', default: false })
    isDeleted: boolean;

    @Column({ nullable: true })
    checksum: string;

    @Column({ name: 'is_processed', default: false })
    isProcessed: boolean;

    @Column({ name: 'processed_at', type: process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamp', nullable: true })
    processedAt: Date;

    @Column({ name: 'is_archived', default: false })
    isArchived: boolean;

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
