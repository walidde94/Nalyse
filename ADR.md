# Architecture Decision Records (ADR)

## ADR 1: ORM Selection
- **Context**: The Nalyse platform requires a scalable, robust, and TypeScript-compatible data access layer.
- **Decision**: We selected TypeORM over Prisma because of TypeORM's declarative class-based structure, which aligns seamlessly with Express and allows dynamic cross-schema tenant separation essential for our B2B operations.

## ADR 2: API Strategy
- **Context**: Our frontend requires optimized, highly specific data fetching for analytics dashboards, while external partners need raw bulk data access.
- **Decision**: A Hybrid API strategy. We utilize GraphQL (`@apollo/server`) for relational UI data queries to minimize over-fetching, and RESTful `v2` endpoints for standard predictable integrations and heavy CSV streaming.

## ADR 3: Frontend Framework
- **Context**: Balancing rapid prototyping speed with long-term performance and bundle sizing.
- **Decision**: React with Vite. Vite's esbuild-powered dev server accelerates HMR iteratively, and the native Rollup build pipeline gives us complete control over code-splitting across data science libraries (like `alasql` and `recharts`). Next.js was considered but deferred to avoid unnecessary SSR complexity for what is fundamentally a rich client-side SPA.
