# Waitlist & Referral Backend - Complete Code Documentation

**Version:** 1.0  
**Environment:** Node.js 20  
**Framework:** tRPC + Express  
**Database:** PostgreSQL/MySQL  
**Real-time Transport:** SSE (Server-Sent Events)  
**Observability:** Winston + Sentry  
**Last Updated:** January 2026

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Project Scope & Constraints](#project-scope--constraints)
3. [Architecture & Technology Stack](#architecture--technology-stack)
4. [Project Directory Structure](#project-directory-structure)
5. [Database Schema & Design](#database-schema--design)
6. [Configuration & Environment Management](#configuration--environment-management)
7. [tRPC Context & Middleware](#trpc-context--middleware)
8. [API Procedures Specification](#api-procedures-specification)
9. [Input Validation & Zod Schemas](#input-validation--zod-schemas)
10. [Session Management & Security](#session-management--security)
11. [Real-time Updates Architecture (SSE)](#real-time-updates-architecture-sse)
12. [Service Layer Architecture](#service-layer-architecture)
13. [Error Handling & Exception Strategy](#error-handling--exception-strategy)
14. [Observability & Logging](#observability--logging)
15. [Utility Functions & Helpers](#utility-functions--helpers)
16. [Type Definitions & Interfaces](#type-definitions--interfaces)
17. [Frontend vs Backend Responsibilities](#frontend-vs-backend-responsibilities)
18. [Deployment & Production Readiness](#deployment--production-readiness)

---

## Executive Summary

This documentation specifies the complete backend implementation for a waitlist and referral system MVP. The system is designed as a **single-server monolithic Node.js application** using tRPC for type-safe API procedures, PostgreSQL/MySQL for persistent data storage, and SSE for real-time referral count updates. The architecture prioritizes simplicity, production-readiness, and minimal operational overhead while maintaining enterprise-grade security, observability, and error handling practices.

The backend handles core workflows including waitlist entry collection, unique referral code generation, referral tracking with tier-based rewards, session-based user authentication without traditional login flows, and real-time notifications for referral milestones. All inputs are validated at the tRPC boundary using Zod, all outputs are strongly typed, and all operations are logged structurally with Winston and tracked through Sentry for production monitoring.


The backend will be a monolithic Node.js 20 application using tRPC for type-safe APIs, with a single PostgreSQL/MySQL database for persistence. The system centers on three core entities: Waitlist Entries (users who joined), Referral Links (unique shareable URLs), and Referral Relationships (tracking who referred whom). Security relies on httpOnly cookies containing session tokens to identify returning users without traditional authentication. Real-time referral count updates leverage SSE for one-directional server-to-client streaming since the counter only needs server pushes, not bidirectional communication

tRPC Router Layer: Single unified router containing all procedures for waitlist joining, referral tracking, stats retrieval, and link generation. Each procedure uses Zod schemas for input validation, ensuring type safety across the entire request/response cycle.
​
Session Management: Upon joining the waitlist, generate a secure random session token stored in an httpOnly, secure, sameSite cookie. This token acts as the user's identifier for subsequent requests to view their stats—no login required, just cookie presence validation.
​
Database Layer: Single relational database with three tables: waitlist_users (email, optional fields, referral code, session token), referrals (referrer_id, referee_id, created_at), and referral_links if tracking click-through rates separately from successful signups.

Technical Workflow
User Journey Flow
Step 1 - Initial Waitlist Join: User clicks "Get Access" from homepage → Frontend calls tRPC waitlist.join procedure → Backend validates email with Zod → Generates unique 8-character alphanumeric referral code using collision-resistant algorithm → Creates database entry with session token → Returns session cookie + referral link → Frontend displays shareable link with social platform buttons.

Step 2 - Referral Link Access: New user clicks referral link containing ?ref=ABC12XYZ parameter → Frontend extracts ref code, stores temporarily → User submits their email via same waitlist.join procedure, now including referral code → Backend validates referee doesn't already exist → Creates new waitlist entry → Creates referral relationship record linking referee to referrer → Increments referrer's referral count atomically → Triggers SSE event to notify referrer's active sessions → Returns new user's own referral link.​

Step 3 - Stats Viewing: User returns to site with existing session cookie → Frontend calls tRPC waitlist.getMyStats procedure → Backend validates session token from cookie → Queries database for referral count and tier status → Applies business logic (0-2=normal, 3-5=1 month free, 6-9=3 months, 10+=founder's table) → Returns stats object with actualCount and displayCount (capped at 10 for progress bar).
​
Step 4 - Real-time Updates: Frontend establishes SSE connection via /sse/referral-updates endpoint → Backend associates SSE stream with user's session token → When referral completes, backend publishes event to that session's stream → Frontend updates counter live without polling.​

Referral Code Generation Strategy
Use nanoid or crypto.randomBytes to generate 8-character codes from custom alphabet (alphanumeric excluding ambiguous characters like 0/O, 1/I/l). Before insertion, perform database lookup to check collision—if exists, regenerate (statistically rare with 62^8 combinations). This avoids sequential patterns that leak signup rates while remaining collision-free.

Session Security Without Authentication
Set httpOnly, secure, sameSite=Strict flags on session cookies to prevent XSS and CSRF attacks. Cookie value is a cryptographically random token stored in waitlist_users.session_token column. On each stats request, verify token exists in database and hasn't expired (optional 30-day TTL). No passwords, no OAuth—just device/browser binding via cookie. If user clears cookies or switches devices, they lose access to their specific stats but can rejoin with same email (system detects duplicate and returns existing referral link).


---

## Project Scope & Constraints

### In Scope

This documentation and implementation covers:

- **Waitlist Entry Collection**: Email-based registration with optional metadata capture (username, first/last name, phone, marketing consent, remarks)
- **Session-Based Authentication**: Cookie-driven user identification without traditional login screens (no password, no OAuth)
- **Unique Referral Code Generation**: 8-character collision-resistant codes per user for link sharing
- **Referral Tracking**: Relationship tracking between referrers and referees with automatic duplicate prevention
- **Tier-Based Rewards System**: Dynamic user tier assignment based on successful referral count (normal → 1month → 3months → founder)
- **Real-time Counter Updates**: Server-to-client updates via SSE for live referral count changes
- **Statistics & Analytics**: Per-user referral count retrieval with capped display (10) and true count tracking
- **Code Validation**: Public endpoint for validating referral code existence (frontend UX enhancement)
- **Production-Grade Observability**: Structured logging with Winston, error tracking with Sentry, health checks
- **Security Hardening**: httpOnly session cookies, rate limiting, CORS configuration, SQL injection prevention, XSS mitigation

### Out of Scope

The following are explicitly NOT included in backend implementation:

- **Frontend Implementation**: UI/UX, share buttons (WhatsApp, LinkedIn, Instagram, Twitter/X, Reddit, Discord), form rendering, referral link copy functionality
- **Homepage Design**: Landing page, "Get Access" button, visual design
- **Email Delivery**: Welcome emails, referral notifications, marketing automation
- **Social Media Integration**: OAuth with social platforms, direct API integrations for sharing
- **Analytics Dashboard**: Advanced reporting, historical trends, user cohort analysis
- **Mobile Applications**: Native iOS/Android implementations
- **Third-Party Integrations**: Webhooks to external services, CRM syncing, payment processing

### Implementation Constraints

1. **Single-Server Deployment**: No distributed systems architecture; all components run on single Node.js process
2. **MVP Stage**: Minimal redundancy; focus on feature completeness over scalability overhead
3. **Production-Friendly**: Code must be deployment-ready with no tech debt; no TODOs or placeholder implementations
4. **Monolithic Architecture**: All logic contained in single codebase; no microservices complexity
5. **No Overengineering**: Avoid premature optimization; implement only what's required for MVP functionality
6. **Type Safety Mandatory**: All APIs must use Zod validation with TypeScript strict mode throughout
7. **Security Non-Negotiable**: httpOnly cookies, CSRF protection, rate limiting, SQL injection prevention required from start
8. **Observability Essential**: All APIs, errors, and business events must be logged and tracked for production visibility

---

## Architecture & Technology Stack

### Core Technology Selection

| Layer | Technology | Version | Justification |
|-------|-----------|---------|---------------|
| **Runtime** | Node.js | 20.x LTS | Modern, stable JavaScript runtime with excellent async/await support |
| **HTTP Server** | Express.js | 4.18+ | Lightweight, battle-tested HTTP framework; ideal for tRPC integration |
| **RPC Protocol** | tRPC | 10.x+ | End-to-end TypeScript type safety; automatic API documentation; simpler than REST for internal APIs |
| **Input Validation** | Zod | Latest | Runtime schema validation with TypeScript type inference; excellent error messages |
| **Database** | PostgreSQL 12+ or MySQL 8+ | - | ACID compliance, excellent indexing, JSON support, proven reliability for production |
| **Real-time Transport** | SSE (native) | - | Unidirectional server-to-client streaming; no WebSocket overhead for counter updates; automatic browser reconnection |
| **Structured Logging** | Winston | 3.x+ | Industry-standard structured logging; JSON output for ELK/Datadog integration |
| **Error Tracking** | Sentry SDK | Latest | Production error monitoring with context, source maps, releases; critical for debugging production issues |
| **Session Management** | httpOnly Cookies (native) | - | Prevents XSS attacks; automatic browser storage; no client-side JavaScript access |
| **ID Generation** | UUID (native) | - | Globally unique identifiers; prevents ID enumeration attacks |
| **Referral Code Generation** | nanoid | 4.x+ | Collision-resistant; customizable alphabet; cryptographically secure; 8 chars sufficient for MVP |
| **Password-Free Auth** | Tokens + Cookies | - | Session token approach; no password hashing/storage complexity; browser binding via cookies |

### Architectural Layers

```
┌──────────────────────────────────────────────────────────┐
│           Express.js HTTP Server (Port 3000)             │
├──────────────────────────────────────────────────────────┤
│  Middleware Layer                                        │
│  ├─ CORS Configuration                                   │
│  ├─ Cookie Parser                                        │
│  ├─ Request Logging                                      │
│  ├─ Rate Limiting (waitlist.join only)                  │
│  └─ Error Boundary (Sentry)                             │
├──────────────────────────────────────────────────────────┤
│  tRPC Router Layer                                       │
│  ├─ waitlist.join (mutation)                            │
│  ├─ waitlist.getMyStats (query)                         │
│  ├─ waitlist.validateReferralCode (query)               │
│  └─ Context Extraction (session token from cookies)     │
├──────────────────────────────────────────────────────────┤
│  Service Layer (Business Logic)                          │
│  ├─ WaitlistService                                      │
│  │  ├─ Join logic with referral handling                │
│  │  ├─ Duplicate detection                              │
│  │  └─ Tier calculation                                  │
│  ├─ ReferralService                                      │
│  │  ├─ Referral relationship creation                   │
│  │  ├─ Referral counting                                │
│  │  └─ Duplicate referral prevention                    │
│  ├─ SessionService                                       │
│  │  ├─ Token generation & validation                    │
│  │  └─ Cookie management                                │
│  └─ SSEManager                                           │
│     ├─ Connection pooling                               │
│     ├─ Event broadcasting                               │
│     └─ Connection lifecycle                             │
├──────────────────────────────────────────────────────────┤
│  Database Layer (ORM/Query Builder)                      │
│  ├─ Prisma Client (recommended) or Raw SQL              │
│  ├─ Connection Pooling (20-30 connections)              │
│  └─ Query Timeouts (10-second default)                  │
├──────────────────────────────────────────────────────────┤
│  PostgreSQL/MySQL Database                              │
│  ├─ waitlist_users table (with indexes)                │
│  ├─ referrals table (with indexes)                     │
│  └─ Connection pool management                          │
├──────────────────────────────────────────────────────────┤
│  Observability & Monitoring                             │
│  ├─ Winston Logger (structured JSON)                    │
│  ├─ Sentry Integration (error tracking)                │
│  ├─ Health Check Endpoint                              │
│  └─ Request Correlation IDs                            │
└──────────────────────────────────────────────────────────┘
```

### Why This Stack

- **tRPC over REST**: Eliminates need for manual API route definition, separate client generation, and type synchronization. Full end-to-end type safety in single TypeScript codebase.
- **Zod at Boundary**: Single source of truth for validation; automatic TypeScript type inference eliminates duplicate type definitions.
- **SSE over WebSockets**: Unidirectional events (counter updates) don't require bidirectional communication; simpler implementation, lower overhead, automatic reconnection.
- **httpOnly Cookies**: Session tokens stored server-side in database, never exposed to JavaScript, bound to browser/device, prevents XSS compromises.
- **PostgreSQL/MySQL**: ACID compliance prevents data corruption; excellent indexing for query performance; JSON support for future schema evolution.
- **Single-Server**: MVP validation doesn't require distributed architecture; simpler operational complexity; horizontal scaling deferred to post-MVP.

---

## Project Directory Structure

### Recommended Organization

```
sparkeefy-waitlist/
- src/
├── backend/
│   ├── index.ts                        # Application entry point, Express setup
│   ├── config.ts                       # Environment validation & config
│   ├── db/
│   │   ├── client.ts                   # Database connection singleton
│   │   ├── schema.prisma              # Prisma schema (if using Prisma)
│   │   └── migrations/                 # Database migration files
│   ├── trpc/
│   │   ├── context.ts                 # tRPC context factory
│   │   ├── router.ts                  # Main tRPC router definition
│   │   ├── middleware.ts              # tRPC middleware (auth, rate limit)
│   │   └── procedures/
│   │       └── waitlist.ts            # All waitlist.* procedures
│   ├── services/
│   │   ├── WaitlistService.ts         # Waitlist business logic
│   │   ├── ReferralService.ts         # Referral business logic
│   │   └── SessionService.ts          # Session token management
│   ├── sse/
│   │   ├── SSEManager.ts              # SSE connection manager
│   │   └── handler.ts                 # SSE endpoint handler
│   ├── utils/
│   │   ├── generators.ts              # Code/token generation
│   │   ├── cookies.ts                 # Cookie utilities & config
│   │   ├── validators.ts              # Custom Zod validators
│   │   ├── tiers.ts                   # Tier calculation logic
│   │   ├── referrals.ts               # Referral counting helpers
│   │   └── links.ts                   # Referral link construction
│   ├── logging/
│   │   ├── logger.ts                  # Winston logger setup
│   │   └── sentry.ts                  # Sentry initialization
│   └── types/
│       └── index.ts                   # Global TypeScript interfaces
├── tests/
│   ├── unit/                           # Unit test files
│   ├── integration/                    # Integration test files
│   └── setup.ts                        # Test database setup
├── .env.example                        # Example environment variables
├── .env                                # (not committed) Local development
├── tsconfig.json                       # TypeScript strict mode config
├── package.json                        # Dependencies & scripts
├── prisma.schema                       # (if using Prisma ORM)
├── docker-compose.yml                  # (optional) Database setup
└── README.md                           # Setup & development guide
```

### Naming Conventions

- **Files**: Strict PascalCase for classes (WaitlistService.ts), camelCase for utilities (generators.ts), index.ts for exports
- **Variables**: camelCase for instances, PascalCase for types/interfaces/classes
- **Database Columns**: snake_case (first_name, marketing_opt_in, referral_code, session_token)
- **TypeScript Fields**: camelCase (firstName, marketingOptIn, referralCode, sessionToken)
- **Constants**: UPPER_SNAKE_CASE for true constants (COOKIE_CONFIG, ALPHABET)
- **API Procedures**: Hierarchical namespace dot notation (waitlist.join, waitlist.getMyStats, waitlist.validateReferralCode)
- **Functions**: Descriptive verb+noun pattern (generateUniqueReferralCode, validateSessionToken, countUserReferrals)

---

## Database Schema & Design

### Table 1: waitlist_users

**Purpose**: Central user registry storing all waitlist entries, referral codes, and session tokens for cookie-based authentication.

**Columns**:

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` (PG) or `UUID()` (MySQL) | Globally unique user identifier; prevents ID enumeration attacks |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL, INDEXED | - | Email is primary user identifier; case-insensitive (stored lowercase); unique constraint prevents duplicates |
| `username` | VARCHAR(100) | NULLABLE | NULL | Optional user display name; no uniqueness constraint (allows duplicates) |
| `first_name` | VARCHAR(100) | NULLABLE | NULL | Optional first name field |
| `last_name` | VARCHAR(100) | NULLABLE | NULL | Optional last name field |
| `phone_number` | VARCHAR(20) | NULLABLE | NULL | Optional phone; international format supported |
| `marketing_opt_in` | BOOLEAN | NOT NULL | FALSE | Newsletter/promotional email consent; explicit opt-in required |
| `additional_remarks` | TEXT | NULLABLE | NULL | User-provided text field for additional information |
| `referral_code` | VARCHAR(8) | UNIQUE, NOT NULL, INDEXED | - | 8-character alphanumeric code; auto-generated on signup; used for referral link |
| `session_token` | VARCHAR(64) | UNIQUE, NOT NULL, INDEXED | - | 64-character hex token (32 bytes); used for httpOnly cookie validation; never sent in response body |
| `session_expires_at` | TIMESTAMP | NOT NULL | `NOW() + INTERVAL 30 days` | Session expiration time; 30-day TTL default; checked on every authenticated request |
| `created_at` | TIMESTAMP | NOT NULL | `NOW()` | User registration timestamp; immutable |
| `updated_at` | TIMESTAMP | NOT NULL | `NOW()` | Last modification timestamp; auto-updated on any field change |

**Index Strategy**:

```sql
-- Email lookup (duplicate detection, stats retrieval by email)
CREATE INDEX idx_waitlist_users_email ON waitlist_users(email);

-- Referral code validation (link resolution, code exists check)
CREATE INDEX idx_waitlist_users_referral_code ON waitlist_users(referral_code);

-- Session token validation (cookie-based auth on every protected request)
CREATE INDEX idx_waitlist_users_session_token ON waitlist_users(session_token);

-- Session expiration cleanup (batch expire old sessions)
CREATE INDEX idx_waitlist_users_session_expires_at ON waitlist_users(session_expires_at);
```

**Rationale**:

- **UUID Primary Key**: Distributed, non-sequential identifier prevents ID enumeration (attackers cannot guess valid IDs)
- **Email Unique Index**: Enforces one registration per email; indexed for O(1) duplicate checking on join
- **referral_code Unique Index**: Enables link resolution via code lookup; unique prevents duplicate codes
- **session_token Unique Index**: Critical for fast session validation on every API request; 64-char hex sufficient entropy
- **session_expires_at Index**: Allows efficient batch cleanup of expired sessions (optional nightly job)

**Design Decisions**:

- Denormalization: referral_code and session_token stored directly in user record (vs separate tables) reduces joins
- Email Case Handling: Always store lowercase (via application-level normalization); comparison case-insensitive
- Composite Fields: No separate name table; flatten firstName/lastName to single record (simplifies MVP)
- TTL Strategy: 30-day default; configurable via SESSION_TTL_DAYS environment variable

---

### Table 2: referrals

**Purpose**: Tracks referrer-referee relationships; enables referral counting, duplicate prevention, and referral chain history.

**Columns**:

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| `id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Unique referral record identifier; for audit trail |
| `referrer_id` | UUID | FOREIGN KEY, NOT NULL, INDEXED | - | ID of user who referred (links to waitlist_users.id); cannot be null |
| `referee_id` | UUID | FOREIGN KEY, NOT NULL, INDEXED | - | ID of user who joined via referral (links to waitlist_users.id); cannot be null |
| `created_at` | TIMESTAMP | NOT NULL | `NOW()` | When referral was credited; immutable; sorted for audit |

**Constraints**:

```sql
-- Foreign key: referrer must exist in waitlist_users
ALTER TABLE referrals
ADD CONSTRAINT fk_referrer
  FOREIGN KEY (referrer_id) REFERENCES waitlist_users(id) ON DELETE CASCADE;

-- Foreign key: referee must exist in waitlist_users
ALTER TABLE referrals
ADD CONSTRAINT fk_referee
  FOREIGN KEY (referee_id) REFERENCES waitlist_users(id) ON DELETE CASCADE;

-- Composite unique constraint: prevent same user from crediting same referrer twice
ALTER TABLE referrals
ADD UNIQUE(referrer_id, referee_id);
```

**Indexes**:

```sql
-- Count referrals per user (for tier calculation, stats retrieval)
-- This is the MOST CRITICAL index for performance
CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);

-- Track which referrers brought in specific user (optional, for audit)
CREATE INDEX idx_referrals_referee_id ON referrals(referee_id);
```

**Rationale**:

- **Composite Unique (referrer_id, referee_id)**: Prevents same user being credited twice by same referrer; enforced at database level (prevents application bugs)
- **referrer_id Index**: Critical for query `SELECT COUNT(*) FROM referrals WHERE referrer_id = ?`; called on every stats retrieval
- **referree_id Index**: Optional but useful for "who referred me?" queries; supports future analytics
- **ON DELETE CASCADE**: If user deleted, all referral records auto-delete; maintains referential integrity
- **No referrer_name Denorm**: Don't store referrer email/name in referrals table; join with waitlist_users if needed for audit

**Design Decisions**:

- **Composite Key Approach**: (referrer_id, referee_id) uniqueness vs separate "referral_count" column; composite key chosen because:
  - Enables full audit trail (see all referrals)
  - Prevents duplicate credit bugs at DB level
  - Allows future analytics (referral chains, influence graphs)
  - Scales better than maintaining denormalized count
- **Immutability**: No UPDATE operations on referrals after creation (only INSERT/DELETE); simplifies auditing

---

### Optional Table: referral_links (Advanced Tracking)

**Status**: NOT REQUIRED for MVP; include only if click-through rate analytics needed post-MVP.

**Purpose**: Track individual link clicks separately from successful signups; enables funnel analytics (clicks → signups → retention).

**Columns**:

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Click event identifier |
| `referral_code` | VARCHAR(8) | Code that was clicked |
| `clicked_at` | TIMESTAMP | When link was clicked |
| `ip_address` | VARCHAR(45) | IPv4/IPv6 for fraud detection |
| `user_agent` | TEXT | Browser/device identifier |

**Status**: OUT-OF-SCOPE for MVP. Defer until conversion metrics required.

---

### Migration Strategy (Prisma Recommended)

**File**: `prisma/schema.prisma`

```prisma
// Prisma schema provides:
// 1. Type-safe database access (prisma generate creates types)
// 2. Automatic migration generation (prisma migrate dev)
// 3. Seed data support for testing
// 4. Built-in connection pooling
```

**Migration Commands**:

```bash
# Generate migration after schema changes
npx prisma migrate dev --name add_users_table

# Apply migrations in production
npx prisma migrate deploy

# Rollback last migration (development only)
npx prisma migrate resolve --rolled-back migration_name
```

**Alternative (Knex.js or Raw SQL)**: If not using Prisma, maintain version-controlled SQL migration files with timestamps (e.g., `migrations/001_init_schema.sql`, `migrations/002_add_indexes.sql`).

---

### Database Connection Configuration

**Connection Pool Settings** (adjust based on Node.js server specs):

- **Pool Size**: 20-30 connections for MVP (sufficient for single-server, low-to-moderate traffic)
- **Max Idle**: 10 seconds (release idle connections quickly)
- **Query Timeout**: 10 seconds (fail fast on slow queries)
- **Statement Timeout**: 15 seconds (database-level protection)

**Connection Initialization** (src/db/client.ts):

- Establish connection pool on server startup
- Health check on boot (verify database accessible)
- Graceful shutdown (drain connections, commit/rollback pending transactions)
- Reconnection logic (exponential backoff on connection failure)

---

## Configuration & Environment Management

### Environment Variables Schema

**File**: `.env` (development) or deployment secrets (production)

Required variables:

```bash
# Database Connection
DATABASE_URL="postgresql://user:password@localhost:5432/waitlist_db"
# or MySQL: "mysql://user:password@localhost:3306/waitlist_db"
# Must be set; application will not start without it

# Server Configuration
NODE_ENV="development"          # or "production"
PORT=3000                        # HTTP server port
HOST="0.0.0.0"                   # Bind to all interfaces

# Frontend Origin (CORS + referral link base)
FRONTEND_URL="http://localhost:3000"  # Development
# or "https://app.com"                 # Production

# Security & Sessions
COOKIE_SECRET="secure-random-32-char-string"  # Used for session token signing
SESSION_TTL_DAYS=30                            # Session expiration time

# Rate Limiting
RATE_LIMIT_WINDOW_MS=3600000    # 1 hour in milliseconds
RATE_LIMIT_MAX_REQUESTS=5       # Max requests per IP in window

# CORS Configuration
CORS_ORIGIN="http://localhost:3000"  # Frontend domain
# Multiple origins separated by comma: "http://localhost:3000,https://app.com"

# Observability
SENTRY_DSN="https://key@sentry.io/12345"  # Sentry error tracking DSN
LOG_LEVEL="info"                          # debug, info, warn, error

# Feature Flags (Optional)
ENABLE_IP_TRACKING=true          # Track IPs for fraud detection
ENABLE_FRAUD_DETECTION=true      # Flag suspicious referral patterns
```

### Environment Validation

**File**: `src/config.ts`

All environment variables must be validated on application startup using Zod. This ensures:

1. **Strict Typing**: Each variable has defined type and constraints
2. **Early Failure**: Invalid config detected before server starts (fail fast)
3. **Defaults**: Sensible defaults for optional variables
4. **Error Messages**: Clear feedback for missing/invalid vars during deployment

**Validation Approach**:

- Create Zod schema defining all environment variables with their types and constraints
- Parse `process.env` against schema on application initialization
- Export validated config object (type-safe throughout codebase)
- Reject application startup if validation fails
- Log validation errors to stderr

**Variables by Environment**:

| Variable | Development | Production | Notes |
|----------|-------------|-----------|-------|
| `DATABASE_URL` | Local PostgreSQL/MySQL | RDS/Cloud SQL endpoint | Required; no default |
| `NODE_ENV` | development | production | Controls security settings (secure cookies, HTTPS enforcement) |
| `PORT` | 3000 | 3000 (behind reverse proxy typically) | Configurable per deployment |
| `FRONTEND_URL` | http://localhost:3000 | https://app.com | Used for CORS and referral link generation |
| `COOKIE_SECRET` | any random string | MUST be strong random string | Change regularly in production |
| `SESSION_TTL_DAYS` | 30 (or 1 for testing) | 30 | Can be reduced for security, increased for convenience |
| `SENTRY_DSN` | Optional (skip locally) | REQUIRED | Essential for production error tracking |
| `LOG_LEVEL` | debug | info | More verbose in development, less spam in production |
| `ENABLE_IP_TRACKING` | true | true | Can be disabled if infrastructure doesn't track IPs |

### Derivable Configuration

Some values computed from environment variables (not set directly):

```typescript
export const COMPUTED_CONFIG = {
  // Security
  isProduction: NODE_ENV === "production",
  secureCookies: NODE_ENV === "production",  // true in prod, false in dev
  
  // URLs
  referralLinkBase: FRONTEND_URL,            // Used to construct full referral URLs
  corsOrigin: CORS_ORIGIN,                   // Parsed into array if multiple
  
  // Durations
  sessionTTLMs: SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,  // Convert days to ms
  rateLimitWindowMs: RATE_LIMIT_WINDOW_MS,   // Already in ms
  
  // Database
  isDatabaseSSL: DATABASE_URL.includes("sslmode=require"),  // Auto-detect SSL
};
```

---

## tRPC Context & Middleware

### Context Factory

**File**: `src/trpc/context.ts`

The tRPC context is created on every request and provides session information to all procedures.

**Context Interface**:

```typescript
interface TRPCContext {
  sessionToken?: string;           // Extracted from httpOnly cookie
  user?: WaitlistUser;            // Hydrated user record (if session valid)
  ipAddress?: string;             // Client IP address
  requestId?: string;             // Unique request identifier for tracing
  req?: Express.Request;          // Raw Express request (optional)
  res?: Express.Response;         // Raw Express response (optional)
}
```

**Context Creation Process**:

1. **Extract Session Token**: Read `sessionToken` cookie from request headers
   - Cookies parsed by Express cookie middleware
   - Token is 64-character hex string
   - May be undefined if user hasn't joined or cookies cleared

2. **Extract IP Address**: Get client IP from request
   - Prefer `x-forwarded-for` header if behind proxy
   - Fall back to `req.socket.remoteAddress`
   - Used for rate limiting and fraud detection

3. **Generate Request ID**: Create unique identifier for tracing
   - Use `x-request-id` header if provided
   - Otherwise generate new UUID
   - Attached to all logs for request correlation

4. **Hydrate User** (if session exists):
   - Query `waitlist_users` where `sessionToken = extracted_token`
   - Verify `sessionExpiresAt > NOW` (check expiration)
   - If not found or expired: session is invalid, user remains undefined
   - DO NOT throw error here; let procedures decide authentication requirement

**Security Note**: Context creation must NOT throw; unauthenticated procedures proceed with `user: undefined`. Protected procedures check `ctx.user` existence and throw 401 if missing.

---

### tRPC Middleware

**File**: `src/trpc/middleware.ts`

Middleware intercepts all procedures (or specific ones) before execution.

**Standard Middlewares**:

1. **Logging Middleware**
   - Logs procedure name, input, execution time, output status
   - Attaches request ID to all logs
   - Format: JSON structured log with timestamp, level, procedure, context

2. **Authentication Middleware**
   - Applies to protected procedures (e.g., `waitlist.getMyStats`)
   - Checks `ctx.user` is defined
   - Throws `TRPCError` with code `UNAUTHORIZED` if missing
   - Runs AFTER context creation

3. **Rate Limiting Middleware**
   - Applies only to `waitlist.join` (mutation causing state changes)
   - Uses sliding window counter (Redis-free approach for MVP)
   - Limit: 5 requests per IP per hour
   - On limit exceeded: throw `TRPCError` with code `TOO_MANY_REQUESTS`
   - Development mode: rate limit disabled (set via config)

4. **Error Boundary Middleware**
   - Wraps all procedure execution
   - Catches exceptions, logs to Winston, reports to Sentry
   - Re-throws as `TRPCError` with sanitized message (no internal details)
   - Ensures all errors surface to client with consistent format

**Middleware Attachment Pattern**:

```
// Procedure-level: specific middleware for specific procedure
t.procedure
  .use(middleware1)
  .use(middleware2)
  .input(schema)
  .query(handler)

// Router-level: applies to all procedures in router
t.router({
  protected: t.procedure.use(requireAuth).query(...),
  public: t.procedure.query(...)
})
```

---

## API Procedures Specification

### Procedure 1: waitlist.join

**Type**: Mutation (causes state change: creates user, creates referral)  
**Authentication**: None (public procedure)  
**Rate Limiting**: 5 requests per IP per hour  
**Real-time Effects**: Triggers SSE event if referral credited  

**Purpose**: Primary endpoint for joining waitlist with optional referral tracking. Handles both new signups and duplicate email scenarios.

**Input Validation**: Zod schema validates:

- `email`: Required, must be valid email format, auto-trimmed and lowercased, max 255 chars
- `username`: Optional, max 100 chars, alphanumeric + underscore/hyphen allowed
- `firstName`: Optional, max 100 chars
- `lastName`: Optional, max 100 chars
- `phoneNumber`: Optional, must match international phone regex, max 20 chars
- `marketingOptIn`: Optional boolean, defaults to false (explicit opt-in required)
- `additionalRemarks`: Optional, max 500 chars
- `referralCode`: Optional, must be exactly 8 chars if provided, alphanumeric

**Processing Logic**:

```
PROCEDURE waitlist.join(input):
  
  1. VALIDATE all inputs against Zod schema
     - If validation fails: return 400 BAD_REQUEST with field-level errors
  
  2. NORMALIZE email: lowercase, trim whitespace
  
  3. CHECK if email already exists in database
     
     IF EMAIL EXISTS:
       └─ If referralCode provided:
          ├─ Check if referral already created (composite unique key)
          ├─ If referral exists: return 409 CONFLICT "Already referred by this user"
          ├─ Validate referralCode exists (referrer exists)
          ├─ If referrer not found: return 400 BAD_REQUEST "Invalid referral code"
          ├─ Create referral record (link referee to referrer)
          ├─ Increment referrer's count (used by SSE broadcast)
          ├─ Broadcast SSE event to referrer's active connections
          └─ Log: referral credited event
       └─ Else: return existing user data (no referral processing)
     
     IF EMAIL DOESN'T EXIST:
       ├─ Generate unique referral code (check collision, retry up to 5 times)
       ├─ Generate session token (64-char hex, cryptographically random)
       ├─ Create waitlist_users record with:
       │  ├─ All provided fields
       │  ├─ referralCode (auto-generated)
       │  ├─ sessionToken (auto-generated)
       │  ├─ sessionExpiresAt = NOW + 30 days
       │  └─ created_at = NOW
       ├─ If referralCode provided:
       │  ├─ Validate referrer exists
       │  ├─ Create referral record
       │  └─ Broadcast SSE event to referrer
       ├─ Set httpOnly session cookie with token
       └─ Return new user data + referral link
  
  4. LOG: user joined event with context
  
  5. RETURN response object
```

**Output Schema**:

```typescript
{
  success: true,
  user: {
    id: UUID,
    email: string,
    referralCode: string,
    referralLink: string,        // Full URL: https://app.com?ref=ABC12XYZ
    actualReferralCount: number, // True count
    displayReferralCount: number,// Math.min(actual, 10) for progress bar
    tier: TierType,              // normal | 1month | 3months | founder
    createdAt: ISO8601,
    ... // other user fields
  },
  newReferralCreated?: boolean,  // true if referral was created in this call
  message: string                // Context message for debugging
}
```

**Cookie Configuration**:

Set httpOnly cookie `sessionToken` with these properties:
- `httpOnly: true` → Prevents JavaScript access (XSS protection)
- `secure: true` → HTTPS only in production (false in development)
- `sameSite: "strict"` → Prevents CSRF attacks
- `maxAge: 2592000000` → 30 days in milliseconds
- `path: "/"` → Available on all routes
- `domain: auto` → Configured by Express

**Error Scenarios**:

| Condition | Status | Code | Message | Notes |
|-----------|--------|------|---------|-------|
| Invalid email format | 400 | BAD_REQUEST | "Invalid email format" | Zod validation error |
| Email already exists (no referral) | 409 | CONFLICT | "Email already joined waitlist" | Return existing user (idempotent) |
| Invalid referral code | 400 | BAD_REQUEST | "Invalid referral code" | Code format incorrect (not 8 chars) |
| Referral code not found | 404 | NOT_FOUND | "Referrer not found" | Code doesn't exist in DB |
| Duplicate referral | 409 | CONFLICT | "Already referred by this user" | Composite unique key violation |
| Rate limit exceeded | 429 | TOO_MANY_REQUESTS | "Too many requests, try again later" | IP has exceeded 5/hour limit |
| Database error | 500 | INTERNAL_SERVER_ERROR | "Failed to join waitlist" | Log actual error to Winston/Sentry |

**Implementation Notes**:

- Referral code generated for ALL users, even if arriving via referral link (users get their own link)
- Email comparison case-insensitive (always normalize to lowercase)
- Referral link URL: `${FRONTEND_URL}?ref=${referralCode}`
- Session cookie set on EVERY successful join (provides idempotency)
- Database-level unique constraint on (referrerId, refereeId) prevents duplicate referrals even if application has bugs

---

### Procedure 2: waitlist.getMyStats

**Type**: Query (read-only, no state change)  
**Authentication**: Required (protected procedure)  
**Rate Limiting**: None (read operation)  
**Real-time Effects**: None (just returns current state)  

**Purpose**: Retrieve authenticated user's referral statistics including count, tier, and next milestone information.

**Input Validation**: Zod schema is empty (no input parameters).

**Processing Logic**:

```
PROCEDURE waitlist.getMyStats():
  
  1. AUTHENTICATE user:
     ├─ Extract ctx.sessionToken from context
     ├─ If missing: throw 401 UNAUTHORIZED "No session found"
     ├─ Query waitlist_users WHERE sessionToken = ctx.sessionToken
     ├─ If not found: throw 401 UNAUTHORIZED "Invalid session token"
     ├─ If sessionExpiresAt < NOW: throw 401 UNAUTHORIZED "Session expired"
     └─ User is authenticated; proceed
  
  2. CALCULATE referral metrics:
     ├─ Query: SELECT COUNT(*) FROM referrals WHERE referrerId = user.id
     ├─ actualCount = result of above query
     ├─ displayCount = Math.min(actualCount, 10) // Capped for progress bar
     ├─ tier = calculateTier(actualCount) // Logic below
     └─ nextTierThreshold = getNextTierThreshold(actualCount)
  
  3. TIER CALCULATION LOGIC:
     ├─ If actualCount >= 10: tier = "founder", nextTier = null
     ├─ Else if actualCount >= 6: tier = "3months", nextTier = 10
     ├─ Else if actualCount >= 3: tier = "1month", nextTier = 6
     └─ Else: tier = "normal", nextTier = 3
  
  4. FORMAT response object (see Output Schema)
  
  5. LOG: stats retrieved event
  
  6. RETURN response object
```

**Output Schema**:

```typescript
{
  user: {
    id: UUID,
    email: string,
    referralCode: string,
    referralLink: string,       // https://app.com?ref=ABC12XYZ
    username?: string,
    firstName?: string,
    lastName?: string,
    phoneNumber?: string,
    marketingOptIn: boolean,
    additionalRemarks?: string,
    createdAt: ISO8601,
    updatedAt: ISO8601
  },
  referralStats: {
    actualReferralCount: number,    // Exact number of successful referrals
    displayReferralCount: number,   // Capped at 10 for progress bar UI
    tier: "normal" | "1month" | "3months" | "founder",
    tierLabel: string,              // Human-readable (e.g., "3 Months Pro Free")
    nextTierAt?: number,            // Referrals needed for next tier (null if at max)
    nextTierLabel?: string          // Label of next tier (null if at max)
  },
  sessionExpiresAt: ISO8601         // When current session expires
}
```

**Example Response (7 Referrals)**:

```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@example.com",
    "referralCode": "ABC12XYZ",
    "referralLink": "https://app.com?ref=ABC12XYZ",
    "firstName": "John",
    "lastName": "Doe",
    "marketingOptIn": true,
    "createdAt": "2026-01-15T10:30:00Z",
    "updatedAt": "2026-01-17T14:22:00Z"
  },
  "referralStats": {
    "actualReferralCount": 7,
    "displayReferralCount": 7,
    "tier": "3months",
    "tierLabel": "3 Months Pro Free",
    "nextTierAt": 3,
    "nextTierLabel": "Founder's Table"
  },
  "sessionExpiresAt": "2026-02-14T10:30:00Z"
}
```

**Error Scenarios**:

| Condition | Status | Code | Message | Notes |
|-----------|--------|------|---------|-------|
| No session cookie | 401 | UNAUTHORIZED | "No session found" | sessionToken not in cookies |
| Invalid session token | 401 | UNAUTHORIZED | "Invalid session token" | Token doesn't match any user |
| Session expired | 401 | UNAUTHORIZED | "Session expired, please rejoin waitlist" | sessionExpiresAt < NOW |
| User deleted | 404 | NOT_FOUND | "User record not found" | Token valid but user was deleted |
| Database error | 500 | INTERNAL_SERVER_ERROR | "Failed to retrieve stats" | Query failed; log actual error |

**Implementation Notes**:

- Session token extracted from httpOnly cookie (never accessible to JavaScript)
- Session expiration checked on every call (enforces 30-day TTL)
- Count query uses indexed `referrer_id` column for O(log n) performance
- displayReferralCount capped at 10 for progress bar UI (prevents UI overflow)
- actualReferralCount continues to increase beyond 10 for founder tier tracking
- No additional password/authentication required (httpOnly cookie sufficient)

---

### Procedure 3: waitlist.validateReferralCode

**Type**: Query (read-only)  
**Authentication**: None (public procedure)  
**Rate Limiting**: None (not a write operation)  
**Real-time Effects**: None  

**Purpose**: Validate referral code existence; used by frontend for UX enhancement (show "Valid code" before user enters email).

**Input Validation**: Zod schema validates:

- `code`: Required, exactly 8 characters, alphanumeric only

**Processing Logic**:

```
PROCEDURE waitlist.validateReferralCode(input):
  
  1. VALIDATE input against Zod schema
     - If validation fails: return 400 BAD_REQUEST
  
  2. QUERY database:
     ├─ SELECT * FROM waitlist_users WHERE referralCode = input.code
     ├─ If found: return { valid: true, referrerEmail: user.email }
     └─ If not found: return { valid: false }
  
  3. LOG: code validation event (optional, not critical)
  
  4. RETURN response object
```

**Output Schema**:

```typescript
{
  valid: boolean,
  referrerEmail?: string,   // Email of referrer (only if valid=true)
  message?: string          // Optional context message
}
```

**Example Responses**:

Valid code:
```json
{
  "valid": true,
  "referrerEmail": "john@example.com",
  "message": "Referral code is valid"
}
```

Invalid code:
```json
{
  "valid": false,
  "message": "Referral code not found"
}
```

**Error Scenarios**:

| Condition | Status | Code | Message | Notes |
|-----------|--------|------|---------|-------|
| Code not found | 200 | N/A | { valid: false } | Not an error; expected response |
| Invalid code format | 400 | BAD_REQUEST | "Referral code must be 8 characters" | Zod validation failure |
| Code has wrong length | 400 | BAD_REQUEST | "Referral code must be 8 characters" | User sent 7 or 9 chars |
| Code has non-alphanumeric | 400 | BAD_REQUEST | "Referral code must be alphanumeric" | User sent special chars |
| Database error | 500 | INTERNAL_SERVER_ERROR | "Failed to validate code" | Query timeout or connection error |

**Implementation Notes**:

- Public endpoint (no authentication required)
- Used for frontend validation before user enters email
- Return referrerEmail for potential UX feature (show referrer's name/email)
- Email may optionally be hidden behind feature flag for privacy
- No rate limiting required (read-only, low resource usage)
- Case-sensitive comparison: "abc12xyz" ≠ "ABC12XYZ" (codes are uppercase)

---

## Input Validation & Zod Schemas

### Top-Level Schemas

**File**: `src/utils/validators.ts` and `src/trpc/procedures/waitlist.ts`

### Schema 1: JoinWaitlistInput

```
Purpose: Validate all inputs for waitlist.join procedure

Fields:
  email (required):
    - Type: string
    - Validation: email format
    - Transform: toLowerCase(), trim()
    - Constraints: max 255 chars
    - Error message: "Invalid email format"
  
  username (optional):
    - Type: string | null | undefined
    - Constraints: max 100 chars
    - Allowed chars: alphanumeric, underscore, hyphen
    - Error message: "Username must be 100 characters or less"
  
  firstName (optional):
    - Type: string | null | undefined
    - Constraints: max 100 chars
    - Error message: "First name must be 100 characters or less"
  
  lastName (optional):
    - Type: string | null | undefined
    - Constraints: max 100 chars
    - Error message: "Last name must be 100 characters or less"
  
  phoneNumber (optional):
    - Type: string | null | undefined
    - Format: International phone format (digits, +, -, spaces, parens)
    - Constraints: max 20 chars
    - Regex: /^[\d+\-\s()]{7,20}$/ (allow 7-20 chars with valid chars)
    - Error message: "Invalid phone number format"
  
  marketingOptIn (optional):
    - Type: boolean
    - Default: false (explicit opt-in required)
    - Error message: N/A (boolean coercion handles most cases)
  
  additionalRemarks (optional):
    - Type: string | null | undefined
    - Constraints: max 500 chars
    - Error message: "Remarks must be 500 characters or less"
  
  referralCode (optional):
    - Type: string | null | undefined
    - Format: Exactly 8 alphanumeric characters
    - Regex: /^[A-Za-z0-9]{8}$/ or use z.string().length(8).regex(/^[A-Za-z0-9]+$/)
    - Error message: "Invalid referral code"
    - Note: Case-sensitive comparison in database; codes are uppercase
```

### Schema 2: GetMyStatsInput

```
Purpose: Validate inputs for waitlist.getMyStats procedure

Structure:
  - Empty object z.object({}).strict()
  - No parameters required
  - Authentication handled by middleware
  
Rationale:
  - All data comes from session context (not user input)
  - .strict() prevents accidental passing of unknown fields
```

### Schema 3: ValidateReferralCodeInput

```
Purpose: Validate inputs for waitlist.validateReferralCode procedure

Fields:
  code (required):
    - Type: string
    - Format: Exactly 8 characters
    - Allowed chars: Alphanumeric only (A-Z, a-z, 0-9)
    - Regex: /^[A-Za-z0-9]{8}$/
    - Error messages:
      - "Referral code must be 8 characters" (length mismatch)
      - "Referral code must be alphanumeric" (invalid chars)
    - Case-sensitive: "abc12xyz" is different from "ABC12XYZ"
```

### Error Response Format

All Zod validation errors automatically converted to tRPC error response:

```json
{
  "code": "BAD_REQUEST",
  "message": "Validation failed",
  "details": [
    {
      "path": ["email"],
      "message": "Invalid email format",
      "code": "invalid_string"
    },
    {
      "path": ["phoneNumber"],
      "message": "Invalid phone number format",
      "code": "invalid_string"
    }
  ]
}
```

### Custom Validators

Extracted to reusable utility functions (src/utils/validators.ts):

```
emailValidator:
  - z.string().email().lowercase().trim()
  - Prevents duplicate registration due to case/whitespace
  
phoneValidator:
  - z.string().regex(/^[\d+\-\s()]{7,20}$/)
  - Supports international formats
  
referralCodeValidator:
  - z.string().length(8).regex(/^[A-Za-z0-9]+$/)
  - Reused in both join and validate procedures
  
usernameValidator:
  - z.string().max(100)
  - No special restrictions (allows unicode)
  
remarkValidator:
  - z.string().max(500)
  - Free-form user input
```

### Coercion & Transform

Zod supports automatic type coercion and transformation:

```typescript
z.string().lowercase().trim()        // Transform: uppercase → lowercase
z.boolean().default(false)           // Coerce + default
z.string().optional().nullable()     // Allow undefined or null
z.number().transform(n => n * 1000)  // Transform to different type
```

---

## Session Management & Security

### Session Token Generation

**File**: `src/utils/generators.ts`

**Algorithm**: cryptographically secure random token generation

```
Function: generateSessionToken()
  
  Returns: Promise<string> - 64-character hex token
  
  Process:
    1. Generate 32 bytes (256 bits) of random data using crypto.randomBytes(32)
    2. Convert to hex string: buffer.toString("hex")
    3. Result: 64-character hex string (each byte → 2 hex chars)
    4. No collisions possible (2^256 combinations)
  
  Security Properties:
    - Cryptographically random (safe for authentication)
    - 256-bit entropy sufficient against brute force (2^128 attempts average)
    - No patterns or predictability
    - Cannot be guessed or enumerated
  
  Usage:
    const token = await generateSessionToken()  // "a7f2d8c9...64 chars total"
    await db.waitlistUser.create({
      ...,
      sessionToken: token,
      sessionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    })
```

### Session Token Validation

**Function**: `validateSessionToken(token: string, db: PrismaClient)`

```
Process:
  1. Check token format: must be exactly 64 chars
  2. Query database: SELECT * FROM waitlist_users WHERE sessionToken = token
  3. If not found: return null (invalid session)
  4. If found: check sessionExpiresAt > NOW
  5. If expired: return null (session expired)
  6. If valid and not expired: return user record
  
  Performance:
    - Indexed lookup on session_token (O(log n))
    - Single database round trip
    - No joins required
```

### Cookie Configuration & Implementation

**File**: `src/utils/cookies.ts`

**Cookie Constants**:

```
COOKIE_CONFIG:
  name: "sessionToken"
  httpOnly: true              // XSS protection
  secure: true                // HTTPS only
  sameSite: "strict"          // CSRF protection
  maxAge: 2592000000          // 30 days in ms
  path: "/"                   // Available on all routes
```

**Cookie Properties Explained**:

| Property | Value | Purpose |
|----------|-------|---------|
| `name` | sessionToken | Cookie name sent in Set-Cookie header |
| `httpOnly` | true | Cookie inaccessible to JavaScript; prevents XSS token theft |
| `secure` | true | Cookie only sent over HTTPS; prevents interception |
| `sameSite` | strict | Cookie not sent in cross-site requests; prevents CSRF |
| `maxAge` | 2592000000 ms | 30-day expiration; matches DB TTL |
| `path` | / | Available on all routes |
| `domain` | auto | Set by Express to request domain |

**Setting Cookie on Success**:

```
Called after successful waitlist.join:
  res.cookie("sessionToken", token, {
    httpOnly: true,
    secure: NODE_ENV === "production",  // true in prod, false in dev
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: "/"
  })
```

**Development Exception**: `secure: false` in development (http://localhost) because HTTPS not available locally. Automatically switches to `true` in production.

**Clearing Session**: When user manually clears cookies or logs out (future feature):

```
res.clearCookie("sessionToken", {
  path: "/",
  // sameSite/secure not needed for clearCookie
})
```

---

### Cookie vs Token Storage (Why Not localStorage)

**Why httpOnly Cookies** (chosen for MVP):

1. **XSS Protection**: JavaScript cannot access httpOnly cookies, even if malicious script injected
2. **Automatic Transmission**: Browser automatically sends cookie on every request (no manual header management)
3. **CSRF Protection**: sameSite=strict prevents cross-site cookie transmission
4. **Server Control**: Server sets cookie (users cannot modify/forge)
5. **Device Binding**: Cookie stored per browser/device (users can't copy token to another device)

**Why NOT localStorage**:

1. **XSS Vulnerability**: Any injected script can read localStorage token
2. **No CSRF Protection**: localStorage token sent manually in header; CSRF tokens needed
3. **Manual Refresh**: Application must manually send token on each request
4. **Malware Access**: Extensions and scripts can steal localStorage

**Conclusion**: httpOnly cookies superior for session security in MVP.

---

### Session Expiration Strategy

**TTL (Time-To-Live)**: 30 days from creation

**Renewal Policy**: Session does NOT auto-renew; expires after 30 days regardless of activity

**Rationale**:
- Simpler implementation (no renewal logic)
- Reduces database writes
- Forces users to rejoin occasionally (good UX reset)
- Acceptable for MVP with low daily active users

**Future Consideration** (post-MVP): Could implement sliding window TTL (extends on each request) for better UX, but adds database writes.

**Cleanup Job** (optional): Nightly batch delete where `sessionExpiresAt < NOW` to keep table clean. Index on `sessionExpiresAt` supports efficient deletion.

---

### Rate Limiting Implementation

**File**: `src/trpc/middleware.ts`

**Policy**:
- **Rate Limit**: 5 requests per IP per hour
- **Applies To**: `waitlist.join` only (write operation)
- **Why**: Prevent spam/brute force; read operations unaffected
- **Development**: Disabled when `NODE_ENV !== "production"`

**Algorithm**: Sliding window counter

```
Approach 1 (In-Memory, for MVP):
  Maintain Map<IP, { count, windowStart }>
  On each request:
    1. Get current time
    2. If (now - windowStart) > 1 hour: reset counter and window
    3. Increment counter
    4. If counter > 5: throw TOO_MANY_REQUESTS error
    5. Clean up old IPs periodically
  
  Pros: Simple, no external dependency
  Cons: Lost on server restart, not shared across instances
  Decision: Acceptable for single-server MVP

Approach 2 (Redis, recommended for production):
  Store key: "ratelimit:ip:{IP}" with value {count}
  Set expiration: 1 hour
  On each request:
    1. INCR ratelimit:ip:{IP}
    2. EXPIRE ratelimit:ip:{IP} 3600 (if count == 1)
    3. If count > 5: throw TOO_MANY_REQUESTS
  
  Pros: Survives restarts, works across instances
  Cons: Extra Redis dependency; deferrable to post-MVP
```

**Error Response**:

```json
{
  "code": "TOO_MANY_REQUESTS",
  "message": "Too many requests, try again later",
  "retryAfter": 3600
}
```

---

### Security Principles Summary

1. **Never Store Passwords**: No password hashing, storage, or comparison
2. **httpOnly Always**: Session tokens only in httpOnly cookies, never in response body
3. **HTTPS Production**: secure cookie flag set in production (enforced via config)
4. **Session Expiration**: Every API call checks `sessionExpiresAt > NOW`
5. **Device Binding**: Session tied to specific browser/device (cookie-based)
6. **Duplicate Prevention**: Composite unique key prevents same referee credited twice
7. **Input Validation**: All inputs validated at tRPC boundary before database interaction
8. **SQL Injection Prevention**: Parameterized queries via Prisma/ORM (no string concatenation)
9. **Rate Limiting**: Prevent spam and brute force on write operations
10. **Error Messages**: No internal details leaked (generic "failed" messages to client)

---

## Real-time Updates Architecture (SSE)

### SSE vs WebSockets Decision

**Why SSE for MVP** (not WebSockets):

- **Unidirectional**: Referral counts flow server→client only; no client input during tracking
- **Lower Overhead**: HTTP-based, no WebSocket protocol upgrade/downgrade
- **Automatic Reconnection**: Built-in EventSource API handles reconnection (WebSocket doesn't)
- **Simpler Server**: No bidirectional state machine; just write events to stream
- **Firewall Friendly**: Uses standard HTTP (port 80/443); some firewalls block WebSocket
- **Browser Support**: Works in all modern browsers; no polyfills needed for MVP

**When WebSocket Needed** (post-MVP): Bidirectional features like live leaderboard (user A sees user B's count update in real-time) would benefit from WebSocket's lower latency, but MVP doesn't require this.

---

### SSE Manager

**File**: `src/sse/SSEManager.ts`

**Purpose**: Central manager maintaining in-memory map of active SSE connections and broadcasting events.

**Data Structure**:

```
sseManager.clients: Map<sessionToken, SSEClient>

SSEClient interface:
  sessionToken: string           // Key for map lookup
  userId: UUID                   // User whose referrals are tracked
  res: Express.Response          // Response stream to write events to
  connectedAt: Date             // Connection timestamp (for logging)
```

**Core Methods**:

1. **addClient(sessionToken, userId, res)**
   - Called when SSE endpoint `/sse/referral-updates` receives request
   - Stores connection in map
   - Logs connection event
   - Sends initial "connection_established" event

2. **removeClient(sessionToken)**
   - Called when connection closes (client disconnect, error, timeout)
   - Deletes entry from map
   - Logs disconnection event
   - Cleanup on connection close must be automatic

3. **broadcastToUser(userId, event)**
   - Called when referral completed for user
   - Iterates through all clients with matching userId
   - Writes SSE-formatted event to each stream
   - Handles errors (removes bad connections)
   - Logs broadcast count for debugging

**Thread Safety**: In-memory Map is synchronous; Node.js single-threaded makes operations atomic.

---

### SSE Event Schema

**Event Structure**: Server-Sent Events format (text/event-stream)

```
Event Frame:
  data: {JSON-stringified event object}
  \n\n  (double newline terminates event)

Event Object:
  {
    "type": "referral_credited" | "connection_established" | "ping",
    "timestamp": "ISO8601 string",
    "data": {
      "actualReferralCount"?: number,
      "displayReferralCount"?: number,
      "tier"?: "normal" | "1month" | "3months" | "founder",
      "refereeEmail"?: string,
      "message"?: string
    }
  }
```

**Event Types**:

1. **connection_established**: Sent once on SSE connection success
   - Indicates stream ready
   - Includes current stats snapshot
   - Allows frontend to sync display

2. **referral_credited**: Sent when new referral completes
   - Contains updated referral counts
   - Contains new tier if tier changed
   - Optional: refereeEmail (who referred them)
   - Frontend updates counter UI in real-time

3. **ping**: Sent every 30 seconds (keep-alive)
   - Prevents proxy timeout (idle connections dropped)
   - No data; just indicates connection alive
   - Frontend ignores; used by infrastructure only

---

### SSE Endpoint Handler

**File**: `src/sse/handler.ts`

**Endpoint**: `GET /sse/referral-updates`

**Processing Flow**:

```
1. AUTHENTICATE:
   ├─ Extract sessionToken from cookies
   ├─ If missing: return 401 Unauthorized
   ├─ Query user by session token
   ├─ Verify session not expired
   └─ If invalid: return 401 Unauthorized

2. SET HEADERS (SSE protocol requirements):
   ├─ Content-Type: "text/event-stream"
   ├─ Cache-Control: "no-cache" (no caching)
   ├─ Connection: "keep-alive"
   ├─ Access-Control-Allow-Origin: FRONTEND_URL (CORS)
   └─ Access-Control-Allow-Credentials: "true"

3. ADD TO MANAGER:
   ├─ sseManager.addClient(sessionToken, user.id, res)
   ├─ Adds to active connections map

4. SEND INITIAL EVENT:
   ├─ Calculate current stats (referral count, tier)
   ├─ Send "connection_established" event with current data
   └─ Allows frontend to initialize display

5. KEEP ALIVE:
   ├─ Set interval to send "ping" event every 30 seconds
   ├─ Prevents proxy/firewall from timing out idle connection
   └─ Continue until connection closed

6. CLEANUP ON CLOSE:
   ├─ Client disconnect: req.on("close", ...)
   ├─ Network error: req.on("error", ...)
   ├─ Call sseManager.removeClient(sessionToken)
   ├─ Clear ping interval
   └─ End response stream

7. ERROR HANDLING:
   ├─ Connection write error: remove client from manager
   ├─ Database query error: 500 Internal Server Error response
   └─ All errors logged to Winston/Sentry
```

**CORS Configuration**: 

SSE endpoint serves from same domain as tRPC (`/trpc/*`), so CORS headers must match frontend origin. If frontend is different origin (e.g., https://app.com, backend https://api.com), set CORS headers on SSE response.

---

### Broadcasting Events

**When Event Triggered** (example: referral completed)

```
In waitlist.join procedure:
  
  1. After creating referral record:
     ├─ Query COUNT referrals for referrer
     ├─ Calculate new tier
     └─ Create event object
  
  2. Broadcast to referrer's SSE connections:
     ├─ sseManager.broadcastToUser(referrer.id, event)
     ├─ Iterates all connections with referrer.id
     ├─ Writes event to each response stream
     └─ Logs "referral_credited" event
  
  3. Frontend receives event:
     ├─ EventSource listener receives data
     ├─ Parses JSON event
     ├─ Updates counter UI: displayCount = Math.min(actual, 10)
     ├─ Updates tier UI if tier changed
     └─ Shows notification (optional UX)
```

**Broadcast Implementation Detail**:

```typescript
broadcastToUser(userId: UUID, event: SSEEvent) {
  let notifiedCount = 0;
  
  for (const [sessionToken, client] of this.clients.entries()) {
    if (client.userId === userId) {
      try {
        // SSE format: "data: {json}\n\n"
        client.res.write(`data: ${JSON.stringify(event)}\n\n`);
        notifiedCount++;
      } catch (err) {
        // Connection broken; remove from manager
        this.removeClient(sessionToken);
      }
    }
  }
  
  logger.debug("SSE broadcasted", {
    userId,
    eventType: event.type,
    notifiedCount,
    totalClientsForUser: this.getActiveConnections(userId)
  });
}
```

**Multiple Connections Per User**: 

User can have multiple browsers/tabs open; each maintains separate SSE connection. When referral completed, event broadcasts to ALL active connections for that user (all tabs/browsers see update simultaneously).

---

### Scalability Consideration (Single Server)

**In-Memory Limitation**: In-memory Map stored in Node.js process. On server restart, all connections drop and reconnect.

**Acceptable for MVP**: Single-server deployment; users simply reconnect (frontend EventSource automatically reconnects). Minor UX disruption.

**Post-MVP Scaling** (multiple server instances): Would need Redis Pub/Sub:

```
Architecture:
  1. Server A: User X joins, creates SSE connection
  2. Server B: User Y refers User X
  3. Server B publishes: redis.publish("referral:{userX.id}", event)
  4. Server A subscribes: redis.subscribe("referral:{userX.id}", callback)
  5. Callback on Server A broadcasts to User X's SSE connections
  6. All servers act as bridges between referral events and SSE streams
```

**Deferred to Post-MVP**: Don't implement Redis Pub/Sub for MVP; single-server sufficient.

---

## Service Layer Architecture

### Service-Oriented Design

Services contain business logic, separated from:
- **tRPC procedures**: API definitions and input/output schemas
- **Database layer**: Raw queries and ORM calls
- **Utilities**: Generic helpers without business context

This separation enables:
- Testing business logic independently
- Reusing logic across multiple procedures
- Clear responsibility boundaries
- Easier refactoring

---

### WaitlistService

**File**: `src/services/WaitlistService.ts`

**Responsibilities**:

1. **Validating User Join**
   - Check email not already registered
   - If registered: return existing user (idempotent)
   - If new: create new user record

2. **Handling Referrals**
   - Validate referral code exists
   - Check referral not already credited
   - Create referral relationship if valid

3. **Tier Calculation**
   - Count referrals for user
   - Determine tier based on count
   - Return tier info

4. **Generating Links**
   - Create referral code (unique)
   - Construct full referral URL
   - Format for response

**Methods**:

```
Method: async joinWaitlist(email, optionalFields, referralCode?, db)
  Returns: { user, newReferralCreated, message }
  Logic:
    1. Check email exists → return existing or null
    2. If null (new user):
       ├─ Generate unique referral code
       ├─ Generate session token
       ├─ Insert record into DB
       ├─ If referralCode: validate and create referral
       └─ Return created user
    3. If exists (duplicate):
       ├─ If referralCode and no prior referral: create referral
       └─ Return existing user

Method: async getUserStats(userId, db)
  Returns: { referralCount, displayCount, tier, tierInfo }
  Logic:
    1. Count referrals for userId
    2. Calculate tier from count
    3. Get tier info (label, description)
    4. Return stats object

Method: async validateReferralCode(code, db)
  Returns: { valid, referrerEmail? }
  Logic:
    1. Query user by referral code
    2. If found: return { valid: true, email }
    3. If not: return { valid: false }
```

---

### ReferralService

**File**: `src/services/ReferralService.ts`

**Responsibilities**:

1. **Creating Referral Relationships**
   - Validate referrer and referee exist
   - Check composite unique key (not already referred)
   - Insert referral record

2. **Counting Referrals**
   - Query count for user
   - Used by tier calculation

3. **Detecting Duplicates**
   - Check if (referrer, referee) pair already exists
   - Return early to prevent duplicate records

**Methods**:

```
Method: async createReferral(referrerId, refereeId, db)
  Returns: Referral record or throws error
  Logic:
    1. Check if referral already exists
    2. If yes: throw "Already referred by this user"
    3. If no: insert into referrals table
    4. Return created record
  Errors:
    - Foreign key error: throw "Referrer/referee not found"
    - Unique constraint: throw "Already referred by this user"

Method: async countUserReferrals(userId, db)
  Returns: number of successful referrals
  Logic:
    1. Query: SELECT COUNT(*) FROM referrals WHERE referrer_id = userId
    2. Uses indexed column for fast query
    3. Return count
  
Method: async getReferralCount(userId, db)
  Returns: { actualCount, displayCount, tier }
  Logic:
    1. Count = countUserReferrals(userId)
    2. displayCount = Math.min(count, 10)
    3. tier = calculateTier(count)
    4. Return object
```

---

### SessionService

**File**: `src/services/SessionService.ts`

**Responsibilities**:

1. **Generating Session Tokens**
   - Create cryptographically random 64-char hex tokens
   - No collisions

2. **Validating Session Tokens**
   - Check token exists in database
   - Check expiration time
   - Return user if valid

3. **Managing Cookie Operations**
   - Set httpOnly cookie with token
   - Clear cookie on logout (future feature)

**Methods**:

```
Method: async generateSessionToken()
  Returns: Promise<string> - 64-char hex token
  Logic:
    1. crypto.randomBytes(32)
    2. Convert to hex string
    3. Verify no collision (optional, statistically impossible)
    4. Return token

Method: async validateSessionToken(token, db)
  Returns: WaitlistUser | null
  Logic:
    1. Check format: exactly 64 chars
    2. Query user by token
    3. Check expiration
    4. Return user or null

Method: setSessionCookie(res, token, secure)
  Returns: void
  Logic:
    1. Set httpOnly cookie with token
    2. Configure secure, sameSite, maxAge
    3. Attach to response

Method: clearSessionCookie(res)
  Returns: void
  Logic:
    1. Clear sessionToken cookie
    2. (For future logout feature)
```

---

### Tier Calculation Service (Utility)

**File**: `src/utils/tiers.ts`

**Responsibilities**: Mapping referral count → tier status

**Configuration**:

```typescript
const TIER_THRESHOLDS = {
  normal: 0,           // 0-2 referrals
  "1month": 3,         // 3-5 referrals
  "3months": 6,        // 6-9 referrals
  founder: 10          // 10+ referrals
}

const TIER_INFO = {
  normal: {
    tier: "normal",
    label: "Waitlist Joined",
    description: "Standard waitlist member"
  },
  "1month": {
    tier: "1month",
    label: "1 Month Pro Free",
    description: "1 month of pro access when product launches"
  },
  "3months": {
    tier: "3months",
    label: "3 Months Pro Free",
    description: "3 months of pro access when product launches"
  },
  founder: {
    tier: "founder",
    label: "Founder's Table",
    description: "Lifetime pro access and special recognition"
  }
}
```

**Functions**:

```
Function: calculateTier(referralCount: number): TierType
  Logic:
    if count >= 10: return "founder"
    else if count >= 6: return "3months"
    else if count >= 3: return "1month"
    else: return "normal"

Function: getTierInfo(tier: TierType): TierInfo
  Logic: Return tier config object (label, description)

Function: getNextTierThreshold(count: number): number | null
  Logic:
    if count >= 10: return null (max tier)
    else if count >= 6: return 10
    else if count >= 3: return 6
    else: return 3
```

**Usage in Procedures**:

```
In waitlist.getMyStats:
  actualCount = countReferrals(user.id)
  tier = calculateTier(actualCount)
  tierInfo = getTierInfo(tier)
  nextTierAt = getNextTierThreshold(actualCount)
  displayCount = Math.min(actualCount, 10)
```

---

## Error Handling & Exception Strategy

### tRPC Error Types

tRPC provides built-in error codes matching HTTP semantics:

| Code | HTTP Status | Meaning | Usage |
|------|------------|---------|-------|
| `PARSE_ERROR` | 400 | Request body parsing failed | Malformed JSON |
| `BAD_REQUEST` | 400 | Input validation failed | Zod schema mismatch |
| `UNAUTHORIZED` | 401 | Authentication failed | Missing/invalid session |
| `FORBIDDEN` | 403 | Authorized but action denied | (Not used in MVP) |
| `NOT_FOUND` | 404 | Resource doesn't exist | Referral code not found |
| `CONFLICT` | 409 | Resource conflict | Email already exists, duplicate referral |
| `PRECONDITION_FAILED` | 412 | Precondition violated | (Not used typically) |
| `PAYLOAD_TOO_LARGE` | 413 | Request body too large | (Not used in MVP) |
| `METHOD_NOT_SUPPORTED` | 405 | HTTP method wrong | (Not used in MVP) |
| `TIMEOUT` | 408 | Request timeout | Database slow query |
| `CONFLICT` | 409 | Resource conflict | Duplicate records |
| `TOO_MANY_REQUESTS` | 429 | Rate limit exceeded | IP exceeded 5/hour limit |
| `CLIENT_CLOSED_REQUEST` | 499 | Client closed connection | (Rare) |
| `INTERNAL_SERVER_ERROR` | 500 | Server-side error | Database error, unexpected exception |

### Error Throwing in Procedures

```typescript
// Bad request (validation)
throw new TRPCError({
  code: "BAD_REQUEST",
  message: "Invalid email format"
});

// Not found (resource missing)
throw new TRPCError({
  code: "NOT_FOUND",
  message: "Referrer not found"
});

// Conflict (duplicate)
throw new TRPCError({
  code: "CONFLICT",
  message: "Email already joined waitlist"
});

// Unauthorized (auth failure)
throw new TRPCError({
  code: "UNAUTHORIZED",
  message: "Session expired"
});

// Rate limited
throw new TRPCError({
  code: "TOO_MANY_REQUESTS",
  message: "Too many requests, try again later"
});

// Internal error (with cause)
throw new TRPCError({
  code: "INTERNAL_SERVER_ERROR",
  message: "Failed to join waitlist",
  cause: err  // Logs to Sentry internally
});
```

### Database Error Mapping

Common PostgreSQL/MySQL error codes mapped to user-friendly messages:

| Database Error Code | Meaning | tRPC Error | Message |
|-------------------|---------|-----------|---------|
| 23505 (PG) | Unique constraint violation | CONFLICT | "Email already exists" |
| 23503 (PG) | Foreign key violation | BAD_REQUEST | "Invalid referrer" |
| 23502 (PG) | Not null constraint | INTERNAL_SERVER_ERROR | "Missing required field" |
| 1062 (MySQL) | Duplicate key | CONFLICT | "Email already exists" |
| 1452 (MySQL) | FK constraint | BAD_REQUEST | "Invalid referrer" |
| Timeout | Query timeout | INTERNAL_SERVER_ERROR | "Request timeout" |

**Mapping Implementation**:

```typescript
catch (err) {
  if (err.code === "23505") { // Unique constraint
    throw new TRPCError({
      code: "CONFLICT",
      message: "Email already joined waitlist"
    });
  }
  if (err.code === "23503") { // Foreign key
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid referrer"
    });
  }
  // Generic fallback
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "Database error occurred",
    cause: err
  });
}
```

### Error Response Format

All errors follow consistent format:

```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": [
    {
      "path": ["fieldName"],
      "message": "Field-specific error",
      "code": "validation_error"
    }
  ]
}
```

### Error Logging

**Every error logged to Winston** with context:

```typescript
logger.error("Failed to join waitlist", {
  email: input.email.substring(0, 5) + "***",  // Partial email for privacy
  errorMessage: err.message,
  errorCode: err.code,
  procedure: "waitlist.join",
  timestamp: new Date().toISOString()
});
```

Then reported to Sentry (captured by error boundary middleware).

---

## Observability & Logging

### Winston Logger Configuration

**File**: `src/logging/logger.ts`

**Setup**: Structured JSON logging with multiple transports

**Log Format**:

```json
{
  "timestamp": "2026-01-17T14:22:00Z",
  "level": "info",
  "service": "waitlist-backend",
  "environment": "production",
  "message": "User joined waitlist",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "referralCode": "ABC12XYZ",
  "action": "waitlist.join",
  "metadata": {
    "hasReferral": true,
    "referrerId": "550e8400-e29b-41d4-a716-446655440001"
  }
}
```

**Transports**:

1. **Console** (development): Colorized, human-readable
2. **Error File** (`logs/error.log`): Only errors; max 5MB each, keep 5 files
3. **Combined File** (`logs/combined.log`): All logs; max 5MB each, keep 5 files

**Log Levels** (in order of severity):

| Level | Meaning | When to Use | Example |
|-------|---------|-----------|---------|
| `error` | Critical failure | Exceptions, database errors, bugs | "Database connection failed" |
| `warn` | Unexpected but recoverable | Validation failures, edge cases | "Session token validation failed" |
| `info` | Important business events | User actions, milestones reached | "User joined waitlist, referral credited" |
| `debug` | Detailed diagnostic info | Query results, state changes | "User tier updated to 3months" |

**Default Log Level**: `info` (suppress debug logs in production)

---

### Key Events to Log

**All events log with context**: `{ userId, email, action, timestamp, metadata }`

1. **User Joined Waitlist** (INFO)
   ```json
   {
     "message": "User joined waitlist",
     "userId": "...",
     "email": "user@example.com",
     "referralCode": "ABC12XYZ",
     "hasMarketing": true,
     "joinedViaReferral": false,
     "action": "waitlist.join"
   }
   ```

2. **Referral Credited** (INFO)
   ```json
   {
     "message": "Referral credited",
     "referrerId": "...",
     "refereeId": "...",
     "refereeEmail": "referee@example.com",
     "newReferralCount": 3,
     "newTier": "1month",
     "action": "referral.created"
   }
   ```

3. **Stats Retrieved** (DEBUG)
   ```json
   {
     "message": "Stats retrieved",
     "userId": "...",
     "referralCount": 7,
     "tier": "3months",
     "action": "waitlist.getMyStats"
   }
   ```

4. **Session Validation** (DEBUG on success, WARN on failure)
   ```json
   {
     "message": "Session validated",
     "sessionToken": "aaa...***",  // Redact for privacy
     "userId": "...",
     "expiresAt": "2026-02-14...",
     "action": "session.validated"
   }
   ```

5. **Validation Failure** (WARN)
   ```json
   {
     "message": "Input validation failed",
     "field": "email",
     "error": "Invalid email format",
     "input": "not-an-email",
     "action": "validation.failed"
   }
   ```

6. **SSE Events** (DEBUG)
   ```json
   {
     "message": "SSE client connected",
     "userId": "...",
     "sessionToken": "aaa...",
     "action": "sse.connect"
   }
   ```

7. **Errors** (ERROR)
   ```json
   {
     "message": "Failed to join waitlist",
     "email": "user@exa...",  // Redact for privacy
     "error": "Database connection failed",
     "errorCode": "ECONNREFUSED",
     "action": "waitlist.join",
     "severity": "high",
     "stack": "[error stack trace]"
   }
   ```

---

### Sentry Integration

**File**: `src/logging/sentry.ts`

**Initialization**: Single call on app startup

```typescript
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: NODE_ENV,
  tracesSampleRate: NODE_ENV === "production" ? 0.1 : 1.0,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({ app: true })
  ]
});
```

**Usage**: Errors automatically captured by middleware; can also manually report:

```typescript
Sentry.captureException(err, {
  contexts: {
    custom: {
      email: user.email,
      userId: user.id,
      procedure: "waitlist.join"
    }
  },
  tags: {
    feature: "waitlist",
    environment: NODE_ENV
  }
});
```

**Critical Alerts** (configure in Sentry):

1. **Database Connection Failures**: Error rate spike
2. **Referral Code Generation Failures**: Collision after 5 retries
3. **Session Validation Errors**: Bulk token invalidations
4. **SSE Connection Drops**: High disconnect rate
5. **Rate Limit Breaches**: Spam detection

---

## Utility Functions & Helpers

### Referral Code Generation

**File**: `src/utils/generators.ts`

**Function**: `generateUniqueReferralCode(db: PrismaClient, maxRetries: number = 5): Promise<string>`

**Algorithm**:

```
1. Initialize nanoid with custom alphabet
   - Alphabet: "ABCDEFGHIJKLMNPQRSTUVWXYZ23456789"
   - Length: 8 characters
   - Excludes ambiguous chars: 0/O, 1/I/l
   - Rationale: Reduces user confusion when manually typing code

2. For each retry (up to 5):
   a. Generate 8-character code
   b. Query database: SELECT * FROM waitlist_users WHERE referralCode = code
   c. If not found: return code (unique)
   d. If found: log warning, continue loop
   e. If exceeded max retries: throw error "Failed to generate unique code"

3. Collision probability:
   - Alphabet size: 34 chars
   - Code length: 8 chars
   - Possible combinations: 34^8 ≈ 2.8 × 10^12
   - Expected collision after ~1.6M codes (negligible for MVP)
```

**Return**: 8-character alphanumeric code (e.g., "ABC12XYZ")

### Session Token Generation

**Function**: `generateSessionToken(): Promise<string>`

**Algorithm**:

```
1. Generate 32 bytes (256 bits) of cryptographically random data
   - crypto.randomBytes(32)
   - Sufficient entropy to prevent brute force

2. Convert to hex string
   - buffer.toString("hex")
   - Results in 64-character hex string

3. Return token
   - No collision detection needed
   - 2^256 combinations; collision probability negligible
```

**Return**: 64-character hex token (e.g., "a7f2d8c9...64 chars")

### Email Normalization

**Function**: `normalizeEmail(email: string): string`

```
Process:
  1. Trim whitespace: "  user@example.com  " → "user@example.com"
  2. Lowercase: "User@Example.COM" → "user@example.com"
  3. Return normalized
```

**Rationale**: Email addresses case-insensitive per RFC; normalization prevents "User@Example.com" and "user@example.com" from being treated as different.

### Referral Link Construction

**Function**: `buildReferralLink(referralCode: string): string`

```
Process:
  1. Get base URL from FRONTEND_URL env var
  2. Append query param: ?ref={referralCode}
  3. Example: "https://app.com?ref=ABC12XYZ"
```

**Return**: Full URL with query parameter

### Referral Link Parsing

**Function**: `extractReferralCode(url: string): string | null`

```
Process:
  1. If already 8-char code: return as-is
  2. If full URL: parse query string
  3. Extract "ref" parameter
  4. Return code or null if not found
```

---

## Type Definitions & Interfaces

### Global Types

**File**: `src/types/index.ts`

**Core Interfaces**:

```typescript
// Waitlist User
interface WaitlistUser {
  id: UUID;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  marketingOptIn: boolean;
  additionalRemarks?: string;
  referralCode: string;
  sessionToken: string;
  sessionExpiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Referral Record
interface Referral {
  id: UUID;
  referrerId: UUID;
  refereeId: UUID;
  createdAt: Date;
}

// Tier System
type TierType = "normal" | "1month" | "3months" | "founder";

interface TierInfo {
  tier: TierType;
  label: string;
  description: string;
  minimumReferrals: number;
}

// Referral Stats
interface ReferralStats {
  actualReferralCount: number;
  displayReferralCount: number;
  tier: TierType;
  tierLabel: string;
  nextTierAt?: number;
  nextTierLabel?: string;
}

// SSE Event
interface SSEEvent {
  type: "referral_credited" | "connection_established" | "ping";
  timestamp: string;  // ISO8601
  data: {
    actualReferralCount?: number;
    displayReferralCount?: number;
    tier?: TierType;
    refereeEmail?: string;
    message?: string;
  };
}

// tRPC Context
interface TRPCContext {
  sessionToken?: string;
  user?: WaitlistUser;
  ipAddress?: string;
  requestId?: string;
  req?: Express.Request;
  res?: Express.Response;
}
```

---

## Frontend vs Backend Responsibilities

### Clear Boundary

**Backend (this documentation) implements**:

- User registration (email collection, optional fields)
- Referral code generation
- Session token management
- tRPC API procedures (join, stats, validate)
- Real-time referral count updates via SSE
- All validation and business logic
- Database persistence
- Error handling and logging
- Security (cookies, rate limiting)

**Frontend (NOT in this documentation) implements**:

- HTML form for email/optional fields
- "Get Access" button click handler
- Parsing referral code from URL (?ref=ABC12XYZ)
- Displaying referral link to user
- Share buttons for social platforms (WhatsApp, LinkedIn, Instagram, Twitter/X, Reddit, Discord)
- Copy-to-clipboard functionality
- SSE EventSource connection and listening
- Real-time UI updates based on SSE events
- Counter display and tier visualization
- Error message display
- Form submission and response handling

### API Contract

**Frontend calls backend via tRPC procedures**:

1. **POST /trpc/waitlist.join** with email + optional fields
   - Request includes optional `referralCode` from URL param
   - Response includes `referralCode` and `referralLink`
   - Frontend extracts referralCode for display

2. **GET /trpc/waitlist.getMyStats** (authenticated)
   - Frontend calls after successful join
   - Response includes current stats and tier

3. **GET /trpc/waitlist.validateReferralCode** (optional, public)
   - Frontend validates code before user enters email
   - UX enhancement (shows "Valid" indicator)

4. **EventSource GET /sse/referral-updates** (authenticated)
   - Frontend establishes connection with session cookie
   - Receives real-time events when referrals complete
   - Updates counter UI on each event

---

## Deployment & Production Readiness

### Environment Configuration

**Required in Production**:

- `DATABASE_URL`: Production database endpoint (RDS/Cloud SQL)
- `NODE_ENV`: "production"
- `FRONTEND_URL`: Production domain (https://app.com)
- `SENTRY_DSN`: Sentry project DSN
- `COOKIE_SECRET`: Strong random string (256 bits+ recommended)
- All other env vars with production values

**Verification**: Run `node -e "require('./src/config.ts')"` before deployment to validate all env vars set correctly.

---

### Health Check Endpoint

**Endpoint**: `GET /health`

**Response**:

```json
{
  "status": "ok",
  "uptime": 3600,
  "dbConnected": true,
  "timestamp": "2026-01-17T14:22:00Z"
}
```

**Checks**:
- Server running (always returns something)
- Database connection pool healthy (verify connection)
- Timestamp for staleness detection

**Usage**: Load balancer/orchestrator pings regularly to verify server alive.

---

### Database Migrations

**Tool**: Prisma Migrate (recommended) or Knex.js

**Process**:

1. Define schema changes in prisma/schema.prisma
2. Run `npx prisma migrate dev --name description` locally to generate migration
3. Review generated migration file
4. Commit migration file to version control
5. In production: `npx prisma migrate deploy` runs pending migrations

**Rollback** (development only): `npx prisma migrate resolve --rolled-back migration_name`

**Production Safety**: Always test migrations in staging environment before production deployment.

---

### CORS Configuration

**File**: `src/index.ts` (Express setup)

**Configuration**:

```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL,  // or ["https://app.com", "https://www.app.com"]
  credentials: true,                   // Allow cookies to be sent
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
```

**For SSE**: Must set `Access-Control-Allow-Credentials: true` on `/sse/referral-updates` response.

---

### Monitoring & Alerts

**Set Up Alerts For**:

1. **Error Rate Spike**: Percentage of requests returning 5xx
2. **Database Connection Failures**: Connection pool exhausted or down
3. **Response Time Degradation**: P99 latency exceeds threshold
4. **Missing Environment Variables**: Deployment fails validation
5. **Rate Limit Breaches**: Sudden spike in 429 responses
6. **Session Validation Failures**: Bulk authentication errors (potential security issue)

**Monitoring Tools**:
- Sentry (error tracking)
- Datadog/New Relic/CloudWatch (metrics, logs, traces)
- PagerDuty (alert routing, on-call)

---

### Production Deployment Checklist

**Pre-Deployment**:

- [ ] All tests passing (`npm test`)
- [ ] TypeScript builds without errors (`npm run build`)
- [ ] Linting passes (`npm run lint`)
- [ ] Security audit clean (`npm audit`)
- [ ] Environment variables defined and validated
- [ ] Database migrations tested in staging
- [ ] Health endpoint verified working
- [ ] CORS origins whitelisted correctly
- [ ] Sentry DSN configured
- [ ] Winston logging to files enabled

**Deployment**:

- [ ] Code deployed to production server
- [ ] Database migrations applied (`npx prisma migrate deploy`)
- [ ] Node.js process started (`npm start`)
- [ ] Health check returns 200
- [ ] SSE endpoint accessible
- [ ] tRPC endpoint accepting requests
- [ ] Logs appearing in files/Sentry
- [ ] No critical errors in first 10 minutes

**Post-Deployment**:

- [ ] Test referral flow end-to-end
- [ ] Monitor error rate and response times
- [ ] Verify database connection healthy
- [ ] Check SSE connections establishing
- [ ] Confirm email collection working (if sending emails)

---

## Conclusion

This documentation provides comprehensive specifications for implementing a production-ready waitlist and referral backend system. Key principles:

1. **Type Safety**: All APIs use Zod validation with TypeScript strict mode
2. **Security First**: httpOnly cookies, CSRF protection, rate limiting, SQL injection prevention
3. **Simplicity**: Single-server MVP architecture without premature optimization
4. **Observability**: Structured logging and error tracking from day one
5. **Reliability**: Graceful error handling with user-friendly messages
6. **Maintainability**: Clear separation of concerns (procedures, services, utilities)

Implementation should follow this documentation precisely to ensure consistency, security, and production readiness.