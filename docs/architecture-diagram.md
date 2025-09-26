# Staryer Platform - Architecture Diagrams

## High-Level Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[Creator Dashboard]
        B[Customer Portal]
        C[Embeddable Widgets]
        D[Platform Owner Dashboard]
    end
    
    subgraph "API Layer"
        E[Next.js API Routes]
        F[Authentication Middleware]
        G[Tenant Context Middleware]
        H[Rate Limiting]
    end
    
    subgraph "Service Layer"
        I[Usage Tracking Service]
        J[Tier Management Service]
        K[Billing Automation Service]
        L[Analytics Service]
        M[Embed Generator Service]
        N[AI Customization Service]
    end
    
    subgraph "Data Layer"
        O[Supabase PostgreSQL]
        P[Row Level Security]
        Q[Audit Logs]
    end
    
    subgraph "External Integrations"
        R[Stripe Connect]
        S[PostHog Analytics]
        T[Resend Email]
        U[OpenAI API]
    end
    
    A --> E
    B --> E
    C --> E
    D --> E
    
    E --> F
    F --> G
    G --> H
    H --> I
    H --> J
    H --> K
    H --> L
    H --> M
    H --> N
    
    I --> O
    J --> O
    K --> O
    L --> O
    M --> O
    N --> O
    
    O --> P
    O --> Q
    
    I --> R
    J --> R
    K --> R
    L --> S
    M --> T
    N --> U
```

## Multi-Tenant Data Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Middleware
    participant Service
    participant Database
    
    Client->>API: Request with tenant context
    API->>Middleware: Extract tenant from domain/header
    Middleware->>Middleware: Set tenant context
    Middleware->>Service: Forward request with tenant_id
    Service->>Database: Query with RLS policy
    Database->>Database: Filter by tenant_id
    Database->>Service: Return tenant-scoped data
    Service->>API: Process and return response
    API->>Client: Send response
```

## Usage Tracking Flow

```mermaid
graph LR
    A[Client App] -->|Track Usage| B[Usage API]
    B --> C[Usage Service]
    C --> D[Usage Events Table]
    C --> E[Usage Aggregates Table]
    C --> F[Tier Enforcement Check]
    
    F -->|Limit Exceeded| G[Block/Warn]
    F -->|Within Limits| H[Allow]
    
    E --> I[Billing Service]
    I --> J[Stripe Metered Billing]
    
    D --> K[Analytics Service]
    K --> L[PostHog Events]
    
    E --> M[Dashboard Updates]
```

## Embed System Architecture

```mermaid
graph TB
    subgraph "Creator's Website"
        A[Embed Script Tag]
        B[Embed Container Div]
    end
    
    subgraph "Staryer Platform"
        C[Embed API Endpoint]
        D[Embed Configuration]
        E[A/B Test Logic]
        F[Analytics Tracking]
    end
    
    subgraph "External Services"
        G[Stripe Checkout]
        H[PostHog Events]
    end
    
    A -->|Load Script| C
    C -->|Fetch Config| D
    D -->|Apply A/B Test| E
    E -->|Render to| B
    B -->|User Interaction| F
    F -->|Track Events| H
    B -->|Purchase| G
```

## Database Schema Overview

```mermaid
erDiagram
    creators ||--o{ subscription_tiers : creates
    creators ||--o{ usage_meters : defines
    creators ||--o{ embed_assets : owns
    
    subscription_tiers ||--o{ customer_tier_assignments : assigned_to
    customer_tier_assignments }o--|| users : customer
    
    usage_meters ||--o{ usage_events : generates
    usage_events }o--|| users : tracked_for
    
    embed_assets ||--o{ embed_versions : versioned
    embed_assets ||--o{ ab_tests : tested
    
    users ||--o{ audit_logs : logged
    creators ||--o{ audit_logs : scoped_to
    
    creators {
        uuid id PK
        uuid tenant_id
        text slug
        text custom_domain
        jsonb branding_config
        text stripe_connect_account_id
        timestamp created_at
    }
    
    subscription_tiers {
        uuid id PK
        uuid creator_id FK
        text name
        decimal price
        jsonb usage_caps
        text[] feature_entitlements
        text stripe_price_id
    }
    
    usage_events {
        uuid id PK
        uuid creator_id FK
        uuid user_id FK
        uuid meter_id FK
        numeric event_value
        timestamp created_at
    }
    
    embed_assets {
        uuid id PK
        uuid creator_id FK
        text asset_type
        jsonb configuration
        boolean active
    }
```

## Security Architecture

```mermaid
graph TB
    subgraph "Authentication Layer"
        A[Supabase Auth]
        B[JWT Tokens]
        C[Row Level Security]
    end
    
    subgraph "Authorization Layer"
        D[Tenant Context]
        E[API Middleware]
        F[Service Permissions]
    end
    
    subgraph "Data Protection"
        G[Encryption at Rest]
        H[Encryption in Transit]
        I[Input Validation]
        J[SQL Injection Protection]
    end
    
    subgraph "Audit & Compliance"
        K[Audit Logging]
        L[GDPR Compliance]
        M[Data Retention]
    end
    
    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    
    F --> G
    F --> H
    F --> I
    F --> J
    
    F --> K
    K --> L
    L --> M
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "Development"
        A[Git Repository]
        B[Feature Branches]
        C[Pull Requests]
    end
    
    subgraph "CI/CD Pipeline"
        D[GitHub Actions]
        E[Automated Tests]
        F[Code Quality Checks]
        G[Security Scans]
    end
    
    subgraph "Production Environment"
        H[Vercel Edge Network]
        I[Next.js Application]
        J[Supabase Database]
        K[External APIs]
    end
    
    subgraph "Monitoring"
        L[Vercel Analytics]
        M[PostHog Events]
        N[Error Tracking]
        O[Performance Monitoring]
    end
    
    A --> D
    B --> D
    C --> D
    
    D --> E
    E --> F
    F --> G
    G --> H
    
    H --> I
    I --> J
    I --> K
    
    I --> L
    I --> M
    I --> N
    I --> O
```

## Integration Flow

```mermaid
sequenceDiagram
    participant Creator as Creator Dashboard
    participant API as Staryer API
    participant Stripe as Stripe Connect
    participant PostHog as PostHog Analytics
    participant Customer as Customer App
    
    Creator->>API: Create subscription tier
    API->>Stripe: Create product/price
    Stripe->>API: Return Stripe IDs
    API->>Creator: Confirm tier created
    
    Customer->>API: Track usage event
    API->>PostHog: Send analytics event
    API->>API: Check tier limits
    API->>Customer: Return usage status
    
    API->>Stripe: Report usage for billing
    Stripe->>API: Webhook: Invoice created
    API->>PostHog: Track billing event
```

This architecture diagram collection provides a comprehensive visual overview of how all the components in the Staryer platform work together, from high-level architecture down to specific data flows and security patterns.