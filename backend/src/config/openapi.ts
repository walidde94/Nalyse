export const openApiSpec = {
    openapi: "3.0.0",
    info: {
        title: "Nalyse Strategic API",
        description: "Production-grade API for dataset analysis and strategic intelligence.",
        version: "1.2.0",
        contact: {
            name: "API Support",
            email: "api@nalyse.ai"
        }
    },
    servers: [
        { url: (process.env.API_URL ? `${process.env.API_URL}/api/v1` : "http://localhost:3000/api/v1"), description: "API Server" }
    ],
    components: {
        securitySchemes: {
            ApiKeyAuth: {
                type: "apiKey",
                in: "header",
                name: "X-API-KEY"
            }
        },
        schemas: {
            Dataset: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" },
                    filename: { type: "string" },
                    size: { type: "integer" },
                    mimeType: { type: "string" },
                    createdAt: { type: "string", format: "date-time" }
                }
            },
            AnalysisResult: {
                type: "object",
                properties: {
                    datasetId: { type: "string" },
                    summary: { type: "object" },
                    insights: { type: "array", items: { $ref: "#/components/schemas/Insight" } },
                    health: { type: "object" }
                }
            },
            Insight: {
                type: "object",
                properties: {
                    type: { type: "string", enum: ["trend", "anomaly", "pattern"] },
                    description: { type: "string" },
                    confidence: { type: "number" }
                }
            }
        }
    },
    security: [{ ApiKeyAuth: [] }],
    paths: {
        "/datasets": {
            post: {
                summary: "Upload Dataset",
                requestBody: {
                    content: {
                        "multipart/form-data": {
                            schema: {
                                type: "object",
                                properties: {
                                    file: { type: "string", format: "binary" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    "201": {
                        description: "Uploaded",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/Dataset" } } }
                    }
                }
            }
        },
        "/analysis": {
            post: {
                summary: "Trigger Analysis",
                requestBody: {
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["datasetId"],
                                properties: { datasetId: { type: "string" } }
                            }
                        }
                    }
                },
                responses: {
                    "200": {
                        description: "Analysis Results",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/AnalysisResult" } } }
                    }
                }
            }
        }
    }
};
