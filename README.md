# Flowstate Supply

A full-stack plumbing and sanitary supply storefront, built with Next.js, TypeScript, Tailwind CSS, Prisma, and MySQL.

## Features

- Searchable product catalog with category filters, sort options, availability, ratings, and featured products.
- Responsive product cards and product-detail views.
- Persistent shopping cart with quantity controls, subtotal, and delivery estimate.
- Guest checkout with address validation and an order confirmation.
- MySQL-backed catalog and transactional order creation with stock checks.
- MySQL-backed newsletter signups with duplicate-safe subscriptions.
- Seed script for an example plumbing and bathroom inventory.
- Accessible navigation, mobile menu, loading states, and clear error feedback.

## Requirements

- Node.js 20.9 or newer
- MySQL 8 or a compatible MySQL database

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a MySQL database and copy `.env.example` to `.env`. Set `DATABASE_URL` to your database connection string:

   ```dotenv
   DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/flowstate_supply"
   ```

3. Generate the Prisma client, create the schema, and load the example catalog:

   ```bash
   npm run db:generate
   npm run db:push
   npm run db:seed
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

Visit [http://localhost:3000](http://localhost:3000).

## Useful commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate the Prisma client |
| `npm run db:push` | Synchronize the Prisma schema to MySQL |
| `npm run db:seed` | Seed the example products |
| `npm run db:studio` | Open Prisma Studio |

## API

- `GET /api/products` — list active products. Supports `category`, `q`, and `sort` query parameters.
- `POST /api/orders` — validate and place a guest order. Stock is checked and decremented in a database transaction.
- `POST /api/newsletter` — validate an email address and save its newsletter subscription.

The checkout records an order but does not process a payment. Connect a payment provider before accepting live payments.
