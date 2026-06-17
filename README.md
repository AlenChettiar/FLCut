# Sync Lync

Sync lync is a URL shortener built with Next.js 16, Prisma, PostgreSQL, and TypeScript.


## Tech Stack

- Next.js 16 (App Router, Turbopack)
- TypeScript
- Prisma ORM v7
- PostgreSQL (Neon)
- Tailwind CSS v4
- Auth.js v5 (NextAuth)

## Features

- short URL generation
- custom aliases
- scheduling and expiry of links
- user authentication
- dashboard analytics
- click tracking (unique, bots, referrers, devices, browsers, locations)
- enable / disable links


## Setup

Create a `.env` file:

```env
DATABASE_URL=postgresql://...
AUTH_SECRET=your-secret
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

Install dependencies:

```bash
npm install
```

Run migrations:

```bash
npx prisma migrate dev
```

Generate Prisma client:

```bash
npx prisma generate
```

Start development server:

```bash
npm run dev
```

## API

| Method | Endpoint                     | Description                  |
|--------|------------------------------|------------------------------|
| POST   | `/api/shortenLink`           | Create short link            |
| GET    | `/api/urls`                  | List authenticated user's links |
| GET    | `/api/analytics/[code]`      | Get analytics for a link     |
| POST   | `/api/auth/register`         | Register new user            |
| GET/POST | `/api/auth/[...nextauth]`  | Auth.js session handlers     |

## Data Model

### User

Stores registered accounts.

| Field      |
|------------|
| id         |
| email      |
| password   |
| name       |
| createdAt  |
| updatedAt  |

### ShortLink

Stores the short URL and its lifecycle state. Belongs to a User.

| Field          |
|----------------|
| id             |
| originalUrl    |
| shortCode      |
| secretToken    |
| goLiveAt       |
| expiresAt      |
| clickCap       |
| waitlistUrl    |
| currentClicks  |
| version        |
| userId         |
| createdAt      |
| updatedAt      |

### ClickAnalytics

Stores an immutable event log entry for each redirect.

| Field     |
|-----------|
| id        |
| linkId    |
| timestamp |
| isUnique  |
| referrer  |
| device    |
| browser   |
| country   |
| region    |
| isBot     |



## Architecture

```text
User registers and login
     ↓
Shorten long urls
     ↓
both original and short urls r stored in db
     ↓
upon clicking the short url
     ↓
checks for validity
     ↓
the link is tracked(users location ,ip ,etc is fetched)
     ↓
redirects to original url
```

## Assumptions

- Authentication is required for creating links
- prevent users from shortening already shortend links
- ensure same short urls for a long url


## Tradeoff
- when the user clicks on the shortlink ,instead of redirection it first fetched the deatils of the user for the analytics 
- At scale this will add latency 
- At scale server side redis needs to be used which is complex 
- also could have added a feature where redis stores the urls on server side which have high traffic (like >100 users in a hrs)


## If I Only Had 4 Hours

I would have built:
1. The core requirements(link creation,scheduling,expiry,customAlias)
2. redirection
3. basic dashboard analytics

Probably not in 4 hours:

1. advanced analytics
2. other contraints (like preventing user to create short link of the same domain,data redundancy i.e. to prevent multiple shortlink of the same original url)
3.  authentication 

## Why This Data Model?

made the schema based on intuition 

## Deployment

- Vercel (serverless, Edge proxy)
- Neon PostgreSQL (serverless Postgres)

Required environment variables on Vercel:

```env
DATABASE_URL=
AUTH_SECRET=
NEXT_PUBLIC_BASE_URL=
AUTH_URL=
```

## Future Features

- qr code also with short urls
- enhance UI/UX (light/dark mode, animations, improved responsiveness)
- custom domain support
- reduce latency (to reduce latency we can use redis to prevent db lookups)
- admin panel
- CI/CD workflows 

