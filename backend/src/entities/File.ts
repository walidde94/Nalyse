import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from './User';
import { Organization } from './Organization';
import { Analysis } from './Analysis';
import { Group } from './Group';

@Entity('files')
export class File {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    filename: string;

    @Column()
    originalName: string;

    @Column({ type: 'bigint' })
    size: number;

    @Column()
    mimeType: string;

    @Column({ nullable: true })
    s3Key: string; // Path in S3 bucket

    @Column({ nullable: true })
    s3Bucket: string;

    @ManyToOne(() => User, user => user.files)
    owner: User;

    @Column()
    ownerId: string;

    @ManyToOne(() => Organization, org => org.files)
    organization: Organization;

    @Column()
    organizationId: string;

    @Column({ nullable: true })
    workspaceId: string;

    @OneToMany(() => Analysis, analysis => analysis.file)
    analyses: Analysis[];

    @ManyToOne(() => Group, group => group.files, { nullable: true, onDelete: 'SET NULL' })
    group: Group;

    @Column({ nullable: true })
    groupId: string | null;

    @Column({ default: false })
    isFavorite: boolean;

    @Column({ type: 'simple-json', nullable: true })
    metadata: any; // Store column info, row count, etc.

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column({ default: false })
    isDeleted: boolean;

    @Column({ nullable: true })
    checksum: string;

    @Column({ default: false })
    isProcessed: boolean;

    @Column({ type: process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamp', nullable: true })
    processedAt: Date;

    @Column({ default: false })
    isArchived: boolean;
}
