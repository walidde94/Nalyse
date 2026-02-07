import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, UpdateDateColumn } from 'typeorm';
import { User } from './User';
import { Analysis } from './Analysis';

@Entity('comments')
export class Comment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('text')
    content: string;

    @ManyToOne(() => Analysis, analysis => analysis.id)
    analysis: Analysis;

    @Column()
    analysisId: string;

    @ManyToOne(() => User, user => user.id)
    author: User;

    @Column()
    authorId: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
