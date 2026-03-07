# FILO Health: Comprehensive Development Plan

## Vision
FILO is a holistic health tracking platform that helps people with chronic illness understand how **everything** affects **everything else**: food, sleep, supplements, stress, exercise, medications, and environmental exposures.

---

## Current State Assessment

### ✅ What's Working
1. **Core Infrastructure**
   - Next.js 15 + TypeScript + Drizzle ORM
   - PostgreSQL database with comprehensive schema
   - Claude AI integration for conversational logging
   - iron-session authentication
   - Mobile-responsive UI

2. **Data Collection**
   - ✅ Conversational chat interface (natural language logging)
   - ✅ Timeline view (daily entries)
   - ✅ Quick-add sheet (form-based logging)
   - ✅ Entry types: food, symptom, supplement, medication, exposure, detox
   - ✅ Journal entries: sleep, energy, mood, stress, pain scores

3. **Insights Engine**
   - ✅ Food → Symptom correlations
   - ✅ Food property patterns (oxalate, histamine, etc.)
   - ✅ Supplement → Symptom improvements
   - ✅ Medication → Side effects
   - ✅ Sleep quality correlations
   - ✅ Stress → Symptom amplification
   - ✅ Meal timing patterns

4. **Protocol Management**
   - ✅ Protocol selection (AIP, Low Histamine, etc.)
   - ✅ Protocol rules engine
   - ✅ Phase tracking (elimination phases)
   - ✅ Protocol state management
   - ✅ Food compliance checking

### ❌ What's Missing or Broken

#### Critical Gaps
1. **No Exercise Tracking** - Missing exercise entry type and energy correlations
2. **No Reintroduction Workflow** - Schema exists but no UI/UX
3. **No Onboarding** - Users land in empty app with no guidance
4. **No Data Export** - Can't share findings with doctors
5. **No Food Search** - Hard to log foods accurately
6. **Limited Mobile Experience** - No PWA, no offline support

#### UX Issues
7. **No Visual Insights** - Just text lists (hard to spot trends)
8. **No Progress Tracking** - Can't see improvement over time
9. **No Guided Workflows** - Users don't know what to do next
10. **Empty States** - No helpful prompts when data is missing

#### Advanced Features
11. **No Multi-Factor Insights** - Can't see compound triggers (e.g., "high histamine + stress + poor sleep")
12. **No Predictive Insights** - Can't warn "You're likely to have a flare-up tomorrow"
13. **No Community Features** - Can't share protocols or learn from others
14. **No Practitioner Dashboard** - Can't share access with healthcare providers

---

## Development Roadmap

### Phase 1: Complete Core Functionality (2-3 weeks)
**Goal**: Make the app fully functional for the core use case

#### 1.1 Exercise Tracking & Energy Correlations
**Priority**: HIGH | **Effort**: 2 days

**What**:
- Add exercise entry type to schema and UI
- Implement exercise-energy correlation analyzer
- Show exercise insights on insights page

**Why**: Completes the holistic health picture. Exercise is a major factor in chronic illness management.

**Tasks**:
- [ ] Add exercise to timeline entry types
- [ ] Update chat AI to extract exercise entries
- [ ] Add exercise icon to timeline
- [ ] Implement `analyzeExerciseEnergy()` in correlations engine
- [ ] Update insights UI to show exercise-energy correlations
- [ ] Add exercise to demo seed data

---

#### 1.2 Reintroduction Workflow
**Priority**: HIGH | **Effort**: 5 days

**What**:
- Guided workflow for reintroducing eliminated foods
- Track reintroduction status (active, passed, failed, inconclusive)
- Show reintroduction history and recommendations

**Why**: This is the endgame of elimination protocols. Users need to know "Can I eat this food again?"

**Tasks**:
- [ ] Create `/reintroductions` page
- [ ] Build "Start Reintroduction" flow
  - Select food to reintroduce
  - Set start date
  - Show protocol guidelines (e.g., "Test for 3 days, wait 3 days")
- [ ] Track symptoms during reintroduction period
- [ ] Auto-analyze results (passed/failed based on symptom correlation)
- [ ] Show reintroduction history with outcomes
- [ ] Add reintroduction status to food search/logging
- [ ] Update chat AI to handle reintroduction questions

**UI Mockup**:
```
┌─────────────────────────────────────┐
│ Reintroductions                     │
├─────────────────────────────────────┤
│ Active Reintroduction               │
│ ┌─────────────────────────────────┐ │
│ │ 🥚 Eggs                         │ │
│ │ Day 2 of 3 • Testing Phase     │ │
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │ │
│ │ 67% complete                    │ │
│ │                                 │ │
│ │ Symptoms tracked: 2             │ │
│ │ Severity: Mild (3/10)           │ │
│ └─────────────────────────────────┘ │
│                                     │
│ History                             │
│ ✅ Chicken - Passed (Jan 15)       │
│ ❌ Tomatoes - Failed (Jan 8)       │
│ ⏸️  Almonds - Inconclusive (Jan 1) │
│                                     │
│ [+ Start New Reintroduction]       │
└─────────────────────────────────────┘
```

---

#### 1.3 User Onboarding Flow
**Priority**: HIGH | **Effort**: 3 days

**What**:
- Welcome screen for new users
- Guided setup: name, protocol selection, goals
- Tutorial on how to use the app
- Sample data option

**Why**: Users are lost without guidance. Onboarding increases activation and retention.

**Tasks**:
- [ ] Create onboarding flow (multi-step)
  - Step 1: Welcome + explain FILO
  - Step 2: Select protocol (or skip)
  - Step 3: Set goals (optional)
  - Step 4: Quick tutorial (how to log, where to find insights)
  - Step 5: Option to load sample data
- [ ] Add onboarding state to user profile
- [ ] Show contextual tips for first-time actions
- [ ] Add "Help" or "?" buttons throughout app

---

#### 1.4 Food Search & Database
**Priority**: MEDIUM | **Effort**: 3 days

**What**:
- Searchable food database in chat and quick-add
- Autocomplete for common foods
- Show food properties (oxalate, histamine, etc.) when logging
- Flag non-compliant foods based on active protocol

**Why**: Accurate food logging is critical for accurate insights.

**Tasks**:
- [ ] Build food search API endpoint
- [ ] Add autocomplete to chat interface
- [ ] Add food search to quick-add sheet
- [ ] Show food properties in search results
- [ ] Show protocol compliance badges (✅ allowed, ⚠️ caution, ❌ avoid)
- [ ] Allow custom food entry (not in database)

---

### Phase 2: Enhanced UX & Insights (2-3 weeks)
**Goal**: Make insights actionable and easy to understand

#### 2.1 Visual Insights & Charts
**Priority**: MEDIUM | **Effort**: 4 days

**What**:
- Simple, glanceable visualizations
- Calendar heatmap (good days vs bad days)
- Symptom trend lines
- Progress indicators

**Why**: Visual patterns are easier to spot than text lists.

**Design Principles**:
- Keep it simple (no complex multi-axis charts)
- Use color coding (green = good, red = bad)
- Show trends, not raw data
- Mobile-first design

**Tasks**:
- [ ] Add lightweight charting library (recharts or chart.js)
- [ ] Build calendar heatmap component
  - Color-code days by overall symptom severity
  - Click day to see details
- [ ] Add symptom trend sparklines
  - Show "↗️ improving" or "↘️ worsening" indicators
- [ ] Add progress cards
  - "40% fewer headaches this month"
  - "Sleep quality up 15%"
- [ ] Add time range selector (7d, 30d, 90d, all time)

---

#### 2.2 Multi-Factor Insights
**Priority**: MEDIUM | **Effort**: 5 days

**What**:
- Detect compound triggers (e.g., "high histamine + stress + poor sleep → severe headaches")
- Show interaction effects
- Prioritize insights by impact

**Why**: Chronic illness is rarely caused by a single factor. Multi-factor insights are more accurate.

**Tasks**:
- [ ] Build multi-factor correlation analyzer
- [ ] Detect 2-factor interactions (food + stress, food + sleep, etc.)
- [ ] Detect 3-factor interactions (if enough data)
- [ ] Calculate impact scores (which combinations matter most)
- [ ] Update insights UI to show compound triggers
- [ ] Add "Why this matters" explanations

---

#### 2.3 Progress Tracking & Goals
**Priority**: MEDIUM | **Effort**: 3 days

**What**:
- Set health goals (e.g., "Reduce headaches by 50%")
- Track progress toward goals
- Celebrate wins

**Why**: Motivation and hope are critical for chronic illness management.

**Tasks**:
- [ ] Add goals to user profile
- [ ] Build progress tracking dashboard
- [ ] Show goal progress on insights page
- [ ] Send encouragement when goals are met
- [ ] Add "Wins" section (improvements over time)

---

#### 2.4 Data Export & Sharing
**Priority**: MEDIUM | **Effort**: 3 days

**What**:
- Export data as PDF report for doctors
- Export raw data as CSV
- Share-able insight links (optional)

**Why**: Users need to share findings with healthcare providers.

**Tasks**:
- [ ] Build PDF export (timeline + insights + charts)
- [ ] Build CSV export (raw data)
- [ ] Add "Export" button to insights page
- [ ] Add date range selector for exports
- [ ] (Optional) Build shareable insight links

---

### Phase 3: Mobile & Offline (1-2 weeks)
**Goal**: Make the app work seamlessly on mobile

#### 3.1 Progressive Web App (PWA)
**Priority**: HIGH | **Effort**: 3 days

**What**:
- Install as app on phone
- Offline support for viewing data
- Push notifications (optional)

**Why**: Health tracking needs to work anywhere, anytime.

**Tasks**:
- [ ] Add PWA manifest
- [ ] Add service worker for offline caching
- [ ] Add install prompt
- [ ] Test offline functionality
- [ ] (Optional) Add push notifications for reminders

---

#### 3.2 Mobile-Optimized UI
**Priority**: MEDIUM | **Effort**: 2 days

**What**:
- Larger touch targets
- Bottom sheet interactions
- Swipe gestures
- Mobile-optimized charts

**Why**: Most logging happens on mobile.

**Tasks**:
- [ ] Audit mobile UX
- [ ] Increase touch target sizes (min 44x44px)
- [ ] Add swipe gestures (swipe to delete, swipe between days)
- [ ] Optimize charts for small screens
- [ ] Test on real devices

---

### Phase 4: Advanced Features (2-4 weeks)
**Goal**: Differentiate from competitors

#### 4.1 Predictive Insights
**Priority**: LOW | **Effort**: 5 days

**What**:
- Predict flare-ups based on recent patterns
- Warn users before symptoms worsen
- Suggest preventive actions

**Why**: Prevention is better than treatment.

**Tasks**:
- [ ] Build predictive model (simple heuristics first)
- [ ] Detect early warning signs
- [ ] Show predictions on dashboard
- [ ] Suggest preventive actions
- [ ] Track prediction accuracy

---

#### 4.2 Practitioner Dashboard
**Priority**: LOW | **Effort**: 7 days

**What**:
- Separate dashboard for healthcare providers
- View patient data (with permission)
- Add notes and recommendations
- Track patient progress

**Why**: Enables collaboration with healthcare providers.

**Tasks**:
- [ ] Build practitioner role system
- [ ] Build patient invitation flow
- [ ] Build practitioner dashboard
- [ ] Add practitioner notes feature
- [ ] Add patient progress reports

---

#### 4.3 Community Features
**Priority**: LOW | **Effort**: 10 days

**What**:
- Share protocols and recipes
- Learn from others with similar conditions
- Anonymous community support

**Why**: Chronic illness is isolating. Community provides support and knowledge.

**Tasks**:
- [ ] Build community forum
- [ ] Add protocol sharing
- [ ] Add recipe sharing
- [ ] Add moderation tools
- [ ] Add privacy controls

---

## Technical Debt & Infrastructure

### Immediate Priorities
1. **Add comprehensive error handling** - Many API routes lack proper error handling
2. **Add loading states** - Some pages show blank screens while loading
3. **Add input validation** - Client and server-side validation needed
4. **Add rate limiting** - Protect API routes from abuse
5. **Add monitoring** - Error tracking (Sentry) and analytics (PostHog)

### Testing Strategy
1. **Unit tests** - Critical business logic (correlation engine, pattern detection)
2. **Integration tests** - API routes and database operations
3. **E2E tests** - Critical user flows (signup, logging, viewing insights)
4. **Manual testing** - UX and accessibility testing

### Performance Optimization
1. **Database indexing** - Add indexes for common queries
2. **Query optimization** - Reduce N+1 queries
3. **Caching** - Cache food properties, protocol rules
4. **Image optimization** - If adding photos
5. **Bundle size** - Code splitting and lazy loading

---

## Success Metrics

### Activation Metrics
- % of users who complete onboarding
- % of users who log first entry within 24 hours
- % of users who log 7+ days of data

### Engagement Metrics
- Daily active users (DAU)
- Weekly active users (WAU)
- Average entries per user per week
- Time to first insight (days of logging needed)

### Value Metrics
- % of users who identify at least 1 trigger
- % of users who report symptom improvement
- % of users who share data with healthcare provider
- Net Promoter Score (NPS)

---

## Prioritization Framework

### Must Have (Phase 1)
- Exercise tracking
- Reintroduction workflow
- Onboarding
- Food search

### Should Have (Phase 2)
- Visual insights
- Multi-factor correlations
- Progress tracking
- Data export

### Nice to Have (Phase 3-4)
- PWA
- Predictive insights
- Practitioner dashboard
- Community features

---

## Timeline Estimate

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Phase 1 | 2-3 weeks | Exercise, reintroductions, onboarding, food search |
| Phase 2 | 2-3 weeks | Visual insights, multi-factor, progress, export |
| Phase 3 | 1-2 weeks | PWA, mobile optimization |
| Phase 4 | 2-4 weeks | Predictive, practitioner, community |

**Total**: 7-12 weeks for full roadmap

---

## Next Steps

1. **Validate priorities** - Which features matter most to your target users?
2. **Start with Phase 1.1** - Exercise tracking (quick win, completes insights engine)
3. **Build iteratively** - Ship small, get feedback, iterate
4. **Focus on core value** - Help people identify what makes them sick/well

---

## Questions to Answer

1. **Target user**: Who is the primary user? (e.g., people with histamine intolerance, AIP followers, general chronic illness)
2. **Business model**: Free? Subscription? One-time purchase?
3. **Competitive advantage**: What makes FILO better than MySymptoms, Cara, or other health trackers?
4. **Distribution**: How will users find FILO? (SEO, social media, healthcare provider referrals)
5. **Validation**: Have you talked to potential users? What do they need most?

---

## Recommendation: Start Here

**Week 1-2: Exercise Tracking + Reintroduction Workflow**
- These complete the core functionality
- High value, medium effort
- Makes the app feature-complete for elimination protocols

**Week 3: Onboarding + Food Search**
- Improves first-time user experience
- Reduces friction in logging

**Week 4-5: Visual Insights + Progress Tracking**
- Makes insights actionable
- Increases engagement and retention

Then reassess based on user feedback.
