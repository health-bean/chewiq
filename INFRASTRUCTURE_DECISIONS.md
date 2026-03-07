# FILO Health Infrastructure & Architecture Decisions

## Date: March 7, 2026

## Tech Stack Decision

### Current Stack (MVP - Phase 1)
- **Frontend**: Next.js (already in use)
- **Hosting**: Vercel
- **Database**: PostgreSQL (current) → Migrate to Supabase
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime
- **Cost**: $0-45/month

### Future Stack (Phase 2+)
- **iOS App**: SwiftUI native (HealthKit integration)
- **Desktop App**: Tauri (Rust + Web, 3MB vs Electron's 100MB)
- **Heavy Compute**: Fly.io workers (only when needed)

## Hosting Platform: Vercel

### Why Vercel?
1. Perfect fit for Next.js (zero-config deployment)
2. Excellent developer experience
3. Global CDN and edge functions
4. Generous free tier for MVP
5. Easy scaling path

### Vercel Limitations & Mitigation

#### 1. Serverless Function Timeout
- **Hobby**: 10 seconds max
- **Pro**: 60 seconds max ($20/mo)
- **Impact**: Correlation analysis on large datasets
- **Mitigation**: 
  - Start with real-time (on-demand) correlation
  - Move to background jobs when datasets grow
  - Use Supabase pg_cron for scheduled tasks

#### 2. No Persistent Background Jobs
- **Impact**: Daily correlation recalculation, notifications
- **Mitigation**: Use Supabase pg_cron (built-in PostgreSQL cron)

#### 3. Stateless Functions
- **Impact**: No in-memory caching between requests
- **Mitigation**: 
  - Use Supabase for state management
  - Add Redis (Upstash) if needed for caching

#### 4. Database Connection Pooling
- **Impact**: Connection exhaustion with moderate traffic
- **Mitigation**: Supabase handles connection pooling automatically

## Database: Supabase (PostgreSQL)

### Why Supabase?
1. Managed PostgreSQL with connection pooling
2. Built-in authentication (reduces code)
3. Real-time subscriptions (WebSocket support)
4. Row-level security (RLS)
5. pg_cron for background jobs
6. Edge Functions for heavy compute
7. Storage for file uploads
8. Free tier: 500MB database, 2GB bandwidth

### Migration Path
1. **Now**: Keep current PostgreSQL setup
2. **Phase 1**: Deploy to Vercel with current DB
3. **Phase 2**: Migrate to Supabase (mostly config changes)
4. **Phase 3**: Enable Supabase Auth, Realtime, pg_cron

## Correlation Analysis Strategy

### Phase 1: Real-Time (On-Demand)
**User visits Insights page → Calculate correlations immediately**

```
User visits /insights
  ↓
API calculates correlations (2-5 seconds)
  ↓
Returns fresh insights
```

**Pros**: 
- Always fresh data
- Simpler to build
- Better UX for early users

**Cons**: 
- Slower page loads as data grows
- May hit 10s timeout with large datasets

**When to use**: MVP with <100 users, <6 months of data per user

### Phase 2: Hybrid Approach
**Pre-calculated + on-demand refresh**

```
User visits /insights
  ↓
Show cached correlations (instant load)
  ↓
If new data logged today: Show "Refresh Insights" button
  ↓
User clicks → Run fresh analysis (2-5s)
  ↓
Update cache
```

**Pros**:
- Instant page loads
- Fresh data available on-demand
- Scales better

**Cons**:
- Slightly more complex
- Insights may be up to 24 hours old

**When to use**: 100-1,000 users, some with 6+ months of data

### Phase 3: Background Jobs
**Nightly recalculation via Supabase pg_cron**

```
Every night at 2am:
  ↓
For each user: Recalculate correlations
  ↓
Store in cache table
  ↓
User sees results instantly next morning
```

**Pros**:
- Instant page loads
- No timeout issues
- Scales to any dataset size

**Cons**:
- Insights up to 24 hours old
- Requires background job infrastructure

**When to use**: 1,000+ users, heavy correlation workloads

## Scaling Timeline

### Months 1-3: MVP (Current Phase)
- **Users**: 10-100
- **Stack**: Vercel + PostgreSQL
- **Correlations**: Real-time (on-demand)
- **Cost**: $0 (Vercel Hobby + local PostgreSQL)
- **Action**: None needed

### Months 4-6: Growing
- **Users**: 100-1,000
- **Stack**: Vercel + Supabase
- **Correlations**: Hybrid (cached + refresh button)
- **Cost**: $45/mo (Vercel Pro $20 + Supabase Pro $25)
- **Action**: 
  - Migrate to Supabase
  - Add correlation caching
  - Add "Refresh Insights" button

### Months 6-12: Scaling
- **Users**: 1,000-10,000
- **Stack**: Vercel + Supabase + Fly.io workers
- **Correlations**: Background jobs (pg_cron)
- **Cost**: $100-200/mo
- **Action**:
  - Move correlation to pg_cron
  - Add Fly.io for heavy processing
  - Optimize database queries

### Year 2+: Enterprise
- **Users**: 10,000+
- **Stack**: Evaluate based on revenue
- **Options**:
  - Stay on Vercel + offload more to workers
  - Move to Fly.io/Railway for full control
  - Hybrid: Vercel frontend + dedicated backend
- **Cost**: $500+/mo (but generating revenue)

## Architecture Diagram

```
┌─────────────────────────────────────────┐
│ Vercel (Next.js)                        │
│ ├─ Frontend pages (SSR/SSG)             │
│ ├─ API routes (< 10s response)          │
│ ├─ Edge Functions (food search)         │
│ └─ Serverless Functions (CRUD)          │
└─────────────────────────────────────────┘
              ↓ HTTP/WebSocket
┌─────────────────────────────────────────┐
│ Supabase                                │
│ ├─ PostgreSQL (data storage)            │
│ ├─ Auth (user management)               │
│ ├─ Realtime (WebSocket subscriptions)   │
│ ├─ pg_cron (background jobs)            │
│ ├─ Edge Functions (heavy compute)       │
│ └─ Storage (file uploads)               │
└─────────────────────────────────────────┘
              ↓ (Phase 3+)
┌─────────────────────────────────────────┐
│ Fly.io Workers (Optional)               │
│ ├─ Heavy correlation analysis           │
│ ├─ Batch processing                     │
│ └─ Long-running jobs                    │
└─────────────────────────────────────────┘
```

## Native Apps Architecture (Phase 2)

### iOS App (SwiftUI)
```
SwiftUI Native App
  ↓
HealthKit Integration (local)
  ↓
REST API → Vercel Next.js API
  ↓
Supabase PostgreSQL
```

**Benefits**:
- Native performance
- HealthKit access (exercise, sleep, heart rate)
- Offline-first with local storage
- Push notifications

### Desktop App (Tauri)
```
Tauri App (Rust + Web)
  ↓
System WebView (uses existing web UI)
  ↓
REST API → Vercel Next.js API
  ↓
Supabase PostgreSQL
```

**Benefits**:
- 3MB bundle size (vs Electron's 100MB)
- Native performance
- Reuse web UI components
- Cross-platform (macOS, Windows, Linux)

## Current Implementation Status

### ✅ Completed (Sections 1-11.2)
- Database schema and migrations
- Exercise tracking (backend + frontend)
- Food search and database
- Reintroduction workflow (backend)
- Reintroduction frontend (StartReintroductionModal, ReintroductionCard)
- Real-time correlation analysis (on-demand)

### 🚧 In Progress (Section 11)
- Task 11.3: ReintroductionHistory component
- Task 11.4: ReintroductionDetail component
- Task 11.5: ReintroductionRecommendations component
- Task 11.6: Reintroductions page
- Task 11.7: Integrate into insights

### 📋 Remaining
- Section 13: Onboarding Backend
- Section 14: Onboarding Frontend
- Section 16: Integration & Polish
- Section 17: Deployment & Verification

## Key Decisions Summary

1. **Vercel for hosting**: Best fit for Next.js, easy deployment, scales well
2. **Supabase for database**: Managed PostgreSQL + Auth + Realtime + pg_cron
3. **Real-time correlations first**: Simpler to build, optimize later when needed
4. **Hybrid approach later**: Add caching + refresh button when datasets grow
5. **Background jobs last**: Only when we hit timeout limits (6+ months out)
6. **Native apps Phase 2**: SwiftUI for iOS, Tauri for desktop
7. **Fly.io workers optional**: Only if heavy compute becomes bottleneck

## No Changes Needed to Current Code

The current implementation is **production-ready** for Vercel + Supabase:
- ✅ Stateless API routes (Vercel-compatible)
- ✅ PostgreSQL queries (Supabase-compatible)
- ✅ Fast response times (< 10s for MVP)
- ✅ No session storage dependencies
- ✅ Real-time correlation calculation

**Future optimizations** (only if needed):
- Add "Refresh Insights" button (5 min)
- Move correlation to background job (30 min)
- Add caching layer (1 hour)

## Deployment Checklist

### Phase 1: Deploy to Vercel (Now)
- [ ] Push code to GitHub
- [ ] Connect Vercel to repository
- [ ] Set environment variables (DATABASE_URL, etc.)
- [ ] Deploy to production
- [ ] Run database migration on production DB

### Phase 2: Migrate to Supabase (Later)
- [ ] Create Supabase project
- [ ] Export current PostgreSQL data
- [ ] Import to Supabase
- [ ] Update DATABASE_URL environment variable
- [ ] Enable Supabase Auth
- [ ] Configure Row Level Security (RLS)
- [ ] Set up pg_cron for background jobs

### Phase 3: Add Background Jobs (When Needed)
- [ ] Create correlation cache table
- [ ] Write pg_cron job for nightly correlation
- [ ] Add "Refresh Insights" button to UI
- [ ] Monitor performance and adjust schedule

## Cost Breakdown

### MVP (Months 1-3)
- Vercel Hobby: $0
- PostgreSQL (local/self-hosted): $0
- **Total: $0/month**

### Growing (Months 4-6)
- Vercel Pro: $20/month (60s timeout)
- Supabase Pro: $25/month (8GB database, 50GB bandwidth)
- **Total: $45/month**

### Scaling (Months 6-12)
- Vercel Pro: $20/month
- Supabase Pro: $25/month
- Fly.io workers: $50-100/month (2-4 workers)
- Upstash Redis (optional): $10/month
- **Total: $100-200/month**

### Enterprise (Year 2+)
- Vercel Pro/Enterprise: $20-500/month
- Supabase Pro/Team: $25-599/month
- Fly.io: $100-500/month
- Monitoring/Logging: $50-200/month
- **Total: $500-2,000/month** (but generating revenue)

## References

- [Vercel Limits](https://vercel.com/docs/concepts/limits/overview)
- [Supabase Pricing](https://supabase.com/pricing)
- [Fly.io Pricing](https://fly.io/docs/about/pricing/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase pg_cron](https://supabase.com/docs/guides/database/extensions/pg_cron)
