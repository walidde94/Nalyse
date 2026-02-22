# SAAS Architecture: Nalyse AI Anomaly Detection Platform

## 1. System Objective
To build a production-ready, enterprise-grade SaaS platform for detecting business anomalies using advanced AI/ML techniques. The system ingests structured data, identifies statistical and contextual outliers, provides explainable insights, and triggers alerts.

## 2. High-Level Architecture

The system follows a **Microservices Architecture** to ensure scalability and modularity.

```mermaid
graph TD
    User[User / Client App] -->|HTTPS| CDN[CDN / Load Balancer]
    CDN -->|Next.js App| Frontend[Frontend (React/Vite)]
    CDN -->|API Requests| Gateway[API Gateway / Orchestrator (Node.js/Express)]
    
    subgraph "Core Backend Services"
        Gateway --> Auth[Auth Service (JWT/OAuth)]
        Gateway --> Billing[Billing Service (Stripe)]
        Gateway --> FileMgr[File Management (S3/MinIO)]
        Gateway --> Queue[Task Queue (Redis/BullMQ)]
    end
    
    subgraph "ML Intelligence Layer (Python)"
        Queue -->|Async Jobs| MLEngine[ML Engine (FastAPI/Celery)]
        MLEngine -->|Read Data| DataLake[(Data Lake / Postgres)]
        MLEngine -->|Store Results| MetaDB[(Metadata DB)]
        
        subgraph "Models"
            Model1[Isolation Forest]
            Model2[Prophet (Time Series)]
            Model3[Autoencoders (Deep)]
            Model4[SHAP (Explainability)]
        end
        
        MLEngine --> Model1
        MLEngine --> Model2
        MLEngine --> Model3
        MLEngine --> Model4
    end
    
    subgraph "Data Storage"
        MetaDB[(PostgreSQL - Relational)]
        Redis[(Redis - Cache/Queue)]
        VectorDB[(Vector DB - Context Memory)]
    end
```

## 3. Component Responsibilities

### A. Frontend (React/Vite/Tailwind)
- **Dashboard**: Real-time visualization of KPIs and anomalies.
- **Data Upload**: Interface for drag-and-drop CSV/Excel.
- **Alert Center**: Manages notifications and rules.
- **Explainability UI**: Natural language insights and feature importance charts.

### B. Orchestrator Backend (Node.js/TypeScript)
- **API Gateway**: Entry point for all requests.
- **Authentication**: Usage of `bcrypt`, `jsonwebtoken` for secure access.
- **File Management**: Validates and sanitizes uploads before processing.
- **Job Orchestration**: Pushes analysis tasks to Redis for the ML worker.
- **Billing Integration**: Tracks usage (rows processed) for SaaS billing.

### C. ML Engine (Python/FastAPI)
- **Data Ingestion**: Pandas/Polars for high-performance parsing.
- **Anomaly Detection**:
    - **Statistical**: Z-Score, IQR, Rolling Mean.
    - **Machine Learning**: Isolation Forest, Local Outlier Factor.
    - **Time Series**: Facebook Prophet (Seasonality), ARIMA.
    - **Deep Learning**: Autoencoders (PyTorch) for complex multivariate patterns.
- **Explainability**: SHAP (Shapley Additive Explanations) to attribute anomalies to specific columns.
- **Recommendation**: Rule-based + ML correlation engine.

### D. Infrastructure
- **Docker**: All services containerized.
- **Kubernetes (K8s)**: For scaling ML workers independently of the API.
- **PostgreSQL**: Stores user data, file metadata, and analysis results.
- **Redis**: Handles job queues and caching.

## 4. Data Flow (Anomaly Detection Pipeline)
1.  **Ingest**: User uploads CSV -> Backend validates -> Saved to Storage -> Job ID created.
2.  **Queue**: Backend pushes `{ fileId, tenantId }` to Redis.
3.  **Process**: ML Worker picks up job -> Loads data -> Cleans/Preprocesses.
4.  **Detect**:
    -   Checks for Time Series? -> Runs Prophet/STL.
    -   Checks for Multivariate? -> Runs Isolation Forest/Autoencoder.
5.  **Explain**: Runs SHAP on detected anomalies to find key drivers.
6.  **Store**: Saves results to PostgreSQL `anomalies` table.
7.  **Alert**: If severity > threshold -> Trigger Notification (Email/Slack).
8.  **Notify**: Frontend receives WebSocket update or polls for detailed report.

## 5. Technology Stack & Libraries

### Backend (Node.js)
-   `express`: Web framework.
-   `typeorm`: ORM for PostgreSQL.
-   `bull`: Queue management.
-   `multer`: File handling.

### ML Engine (Python)
-   `fastapi`: High-performance API.
-   `pandas`, `numpy`: Data manipulation.
-   `scikit-learn`: Isolation Forest, LOF, PCA.
-   `prophet`: Time series forecasting.
-   `shap`: Explainability.
-   `pytorch`: Autoencoders (optional enhancement).

### Database
-   `PostgreSQL`: Relational data.
-   `Redis`: Queue/Cache.

## 6. Security & Compliance
-   **Multi-Tenancy**: Logical separation via `tenant_id` in all DB queries.
-   **Encryption**: TLS 1.3 in transit, AES-256 at rest (DB/Files).
-   **RBAC**: Role-based access control (Admin, Analyst, Viewer).
-   **Audit Logs**: Tracks all data access and model executions.

## 7. Business Model Implementation
-   **Usage-Based Pricing**: Track `rows_processed` and `models_trained`.
-   **Tiered Feature Access**:
    -   Free: Statistical methods only (Z-Score).
    -   Pro: ML methods (Isolation Forest) + 1GB Storage.
    -   Enterprise: Deep Learning + Custom Retention.

## 8. Scalability Strategy
-   **Horizontal Scaling**: ML workers scale based on Queue Depth (KEDA).
-   **Connectors**: Modular adapter pattern for SQL/API sources.
-   **Streaming**: Potential for Kafka/Redpanda integration for real-time ingestion.

## 9. Folder Structure (Monorepo)
```
/
├── backend/            # Node.js API Gateway
│   ├── src/services/   # Auth, File, Billing
│   └── src/queue/      # Job Producers
├── frontend/           # React Dashboard
├── ml-engine/          # Python Microservice
│   ├── app/            # FastAPI App
│   ├── models/         # ML Model Definitions
│   ├── pipelines/      # Data Processing Pipelines
│   └── tests/          # PyTest
├── infrastructure/     # Docker/K8s configs
└── docs/               # Documentation
```

## 10. Monitoring & MLOps
-   **Model Drift**: Track statistical properties of input data vs training data.
-   **Performance**: Latency tracking (Prometheus/Grafana).
-   **Logging**: ELK Stack or Datadog.
