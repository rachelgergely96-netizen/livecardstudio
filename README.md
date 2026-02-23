# LiveCardStudio.com

Next.js App Router implementation for a premium living greeting card platform.

## Tech stack

- Next.js 14 + TypeScript + Tailwind CSS
- NextAuth (Credentials, Google OAuth, Magic Link)
- Prisma + PostgreSQL
- Stripe checkout + webhook pipeline
- Tremendous gift card integration
- S3/R2-compatible storage layer
- Dynamic OG images (`/og/[slug].png`)

## Implemented routes

Pages:

- `/` landing page
- `/login`, `/signup`
- `/dashboard`
- `/create`
- `/card/[slug]/share`
- `/c/[slug]`

API:

- `POST /api/auth/[...nextauth]`
- `POST /api/auth/register`
- `POST /api/cards`
- `GET /api/cards`
- `GET /api/cards/[id]`
- `PUT /api/cards/[id]`
- `DELETE /api/cards/[id]`
- `POST /api/cards/[id]/photos`
- `DELETE /api/cards/[id]/photos/[photoId]`
- `PUT /api/cards/[id]/photos/reorder`
- `POST /api/cards/[id]/generate`
- `POST /api/cards/[id]/publish`
- `GET /api/cards/[id]/stats`
- `POST /api/checkout`
- `POST /api/webhooks/stripe`
- `GET /api/gifts/brands`
- `GET /api/gifts/brands/[id]`
- `POST /api/gifts/purchase`

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment:

```bash
cp .env.example .env
```

3. Run Prisma:

```bash
npm run prisma:generate
npm run prisma:migrate
```

4. Start app:

```bash
npm run dev
```

## Notes

- If Tremendous keys are missing, `/api/gifts/brands` falls back to curated local brands for development.
- If Stripe keys are missing, `/api/checkout` returns a mock checkout URL to keep flow testable.
- Card HTML is generated server-side and stored in S3/R2 when configured, otherwise on local disk (`storage/`).

## Reference assets

Legacy static files are still present in repo root (`index.html`, `card-render.js`, `themes/`) for design and behavior reference.
