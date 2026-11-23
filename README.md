# OneAtlas

OneAtlas is a model discovery and comparison app built with Next.js App Router, TypeScript, Tailwind CSS, Prisma, and PostgreSQL. Catalog pages and interactive controls read from the database through the app's route handlers.

## Local setup

1. Install Node.js 20.9 or later and PostgreSQL.
2. Install dependencies with `npm install`.
3. Copy `.env.example` to `.env` and set `DATABASE_URL` to your PostgreSQL connection string.
4. Create the schema and generated Prisma client:

   ```sh
   npx prisma generate
   npx prisma db push
   ```

5. Load the sample directory (180 models, eight labs, six providers, and five benchmarks):

   ```sh
   npx prisma db seed
   ```

6. Start the app with `npm run dev`, then open `http://localhost:3000`.

The seed is repeatable and replaces the catalog records it manages. Do not run it against a database containing data you need to preserve.
The generated prices, model variants, and benchmark scores are demo data for development, not live vendor quotes or independently verified benchmark results.

## Useful commands

- `npm run build` — generate the Prisma client and build Next.js.
- `npm run prisma:generate` — generate Prisma Client.
- `npm run prisma:push` — sync the Prisma schema to the configured PostgreSQL database.
- `npm run prisma:seed` — load the demo catalog.

API endpoints are under `/api`: models and model comparison, rankings, labs/providers, unified search, and catalog stats.
