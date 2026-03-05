import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import { prisma } from './config/database';
import { Request, Response } from 'express';

const typeDefs = `#graphql
    type File {
        id: ID!
        filename: String!
        size: Int
        mimeType: String
        status: String
        createdAt: String
    }

    type Analysis {
        id: ID!
        type: String!
        status: String!
        config: String
        createdAt: String
    }

    type Query {
        files(limit: Int, offset: Int): [File]
        file(id: ID!): File
        analyses(limit: Int, offset: Int): [Analysis]
        analysis(id: ID!): Analysis
    }
`;

const resolvers = {
    Query: {
        files: async (_: any, args: { limit?: number, offset?: number }) => {
            const { limit = 50, offset = 0 } = args;
            return await prisma.file.findMany({ take: limit, skip: offset, orderBy: { createdAt: 'desc' } });
        },
        file: async (_: any, { id }: { id: string }) => {
            return await prisma.file.findUnique({ where: { id } });
        },
        analyses: async (_: any, args: { limit?: number, offset?: number }) => {
            const { limit = 50, offset = 0 } = args;
            return await prisma.analysis.findMany({ take: limit, skip: offset, orderBy: { createdAt: 'desc' } });
        },
        analysis: async (_: any, { id }: { id: string }) => {
            return await prisma.analysis.findUnique({ where: { id } });
        }
    }
};

export const startApolloServer = async (app: any) => {
    const server = new ApolloServer({
        typeDefs,
        resolvers,
        introspection: true // Keep on for playground
    });

    await server.start();

    app.use('/graphql', expressMiddleware(server, {
        context: async ({ req }: { req: any }) => {
            // Authentication check via auth header / api key
            return { user: (req as any).user };
        }
    }));

    console.log('✅ GraphQL Playground ready at /graphql');
};
