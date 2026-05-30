# Payment Gateway Simulator

A backend API simulating a real-world payment gateway. Built with Node.js, Express, TypeScript, and Prisma.

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express
- **ORM**: Prisma with Prisma Accelerate
- **Database**: PostgreSQL
- **Validation**: Zod
- **Auth**: JWT
- **Security**: Helmet, CORS, express-rate-limit
- **Logging**: Winston

## API Routes

### Payments
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/payments` | Create a new payment |
| POST | `/payments/:id/refunds` | Process a refund |
| POST | `/payments/:id/disputes` | Raise a dispute |

### Merchants
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/merchants/:id/payments` | Get paginated payments for a merchant |
| PATCH | `/merchants/:id/payments/status` | Bulk update payment status |

### Disputes
| Method | Route | Description |
|--------|-------|-------------|
| PATCH | `/disputes/:id/resolve` | Resolve a dispute |

### Settlements
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/settlements` | Run a settlement batch for a merchant |

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/v1/auth/token` | Get a JWT token |

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (or Prisma Accelerate connection string)

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file:

```
DATABASE_URL=your_prisma_or_postgres_connection_string
JWT_SECRET=your_jwt_secret
```

### Run Migrations

```bash
npx prisma migrate dev
```

### Start the Server

```bash
npm run dev
```

Server runs on `http://localhost:4000`.

## Authentication

All routes (except `/v1/auth/token`) require a Bearer token:

```
Authorization: Bearer <token>
```

Get a token by calling `POST /v1/auth/token`.

## Key Features

- **Cursor pagination** on payment list endpoints
- **Fee calculation** with merchant tier-based fee schedules
- **Transaction breakdowns** stored per payment
- **Idempotency** via client-generated `referenceCode`
- **Atomic operations** using Prisma transactions
- **Rate limiting**: 100 req/15min globally, 5 req/15min on payment routes
