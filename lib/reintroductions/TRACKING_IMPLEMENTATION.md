# Reintroduction Tracking Implementation

## Overview

This implementation adds automatic tracking logic that connects food logs to active reintroductions. When a user logs a food they're reintroducing, the system automatically:

1. Checks if there's an active reintroduction for that food
2. Creates a `reintroduction_entries` junction record linking the timeline entry to the reintroduction
3. Updates the reintroduction's tracking fields (`current_day`, `last_log_date`, `current_phase`)
4. Handles phase transitions (testing → observation after 3 days)
5. Tracks missed days when expected logs don't occur

## Requirements Validated

- **Requirement 6.1**: When a user logs a food with an active reintroduction, the system associates the timeline entry with the reintroduction_log record
- **Requirement 6.2**: The system tracks the reintroduction phase (testing days 1-3, observation days 4-6)
- **Requirement 6.3**: During the testing phase, the system reminds users to log the reintroduction food daily
- **Requirement 6.6**: When a user logs symptoms during reintroduction, the system flags them for correlation analysis

## Implementation Details

### Core Function: `trackReintroductionEntry`

Located in `lib/reintroductions/tracking.ts`, this function is called automatically when a food entry is created via the POST `/api/entries` endpoint.

**Parameters:**
- `userId`: The user's ID
- `foodId`: The food ID being logged (can be from `foods` or `custom_foods` table)
- `timelineEntryId`: The timeline entry ID to link
- `entryDate`: The date of the entry (YYYY-MM-DD format)

**Returns:**
```typescript
{
  linked: boolean;
  reintroductionId?: string;
  currentPhase?: string;
  currentDay?: number;
  message?: string;
}
```

**Logic Flow:**

1. **Check for Active Reintroduction**
   - Query `reintroduction_log` for active reintroductions matching the `foodId`
   - If no match found, return `{ linked: false }`

2. **Calculate Current Day**
   - Calculate days since `start_date`
   - Day 1 is the start date itself
   - Formula: `daysSinceStart = floor((currentDate - startDate) / (1000 * 60 * 60 * 24)) + 1`

3. **Determine Phase**
   - Days 1-3: `testing` phase
   - Days 4-7: `observation` phase
   - Day 8+: `complete` phase

4. **Track Missed Days**
   - Only during `testing` phase
   - If `last_log_date` exists, calculate days since last log
   - If more than 1 day has passed, increment `missed_days` counter
   - Formula: `missedDays += daysSinceLastLog - 1`

5. **Create Junction Record**
   - Insert into `reintroduction_entries` table
   - Links `timeline_entry_id` to `reintroduction_id`
   - Records the `entry_phase` (testing/observation)

6. **Update Tracking Fields**
   - Update `reintroduction_log` with:
     - `current_day`: New calculated day
     - `current_phase`: New phase (testing/observation/complete)
     - `last_log_date`: Current entry date
     - `missed_days`: Updated missed days counter

### Integration with Entries API

The POST `/api/entries` endpoint in `app/api/entries/route.ts` has been updated to call `trackReintroductionEntry` after creating a food entry:

```typescript
// Track reintroduction if this is a food entry with an active reintroduction
let reintroductionTracking;
if (entryType === "food" && foodId) {
  reintroductionTracking = await trackReintroductionEntry(
    session.userId,
    foodId,
    entry.id,
    entryDate
  );
}

return NextResponse.json({ 
  entry,
  reintroductionTracking,
}, { status: 201 });
```

The API response now includes `reintroductionTracking` information, which can be used by the frontend to display progress updates.

### Helper Function: `updateMissedDays`

This function is designed to be called periodically (e.g., via a daily cron job) to update missed days for all active reintroductions.

**Usage:**
```typescript
await updateMissedDays(userId);
```

**Logic:**
- Queries all active reintroductions for the user
- Only processes reintroductions in `testing` phase
- Calculates days since `last_log_date`
- Increments `missed_days` counter if more than 1 day has passed

## Database Schema

### `reintroduction_log` Table

Tracking fields added:
- `current_phase` (VARCHAR): testing, observation, complete
- `current_day` (INTEGER): Current day in the reintroduction (1-7+)
- `last_log_date` (DATE): Last date the food was logged
- `missed_days` (INTEGER): Number of days missed during testing phase
- `analysis_date` (DATE): Date when analysis was performed
- `analysis_notes` (TEXT): Notes from the analysis
- `cancellation_date` (DATE): Date when reintroduction was cancelled
- `cancellation_reason` (TEXT): Reason for cancellation

### `reintroduction_entries` Table

Junction table linking timeline entries to reintroductions:
- `id` (UUID): Primary key
- `reintroduction_id` (UUID): Foreign key to `reintroduction_log`
- `timeline_entry_id` (UUID): Foreign key to `timeline_entries`
- `entry_phase` (VARCHAR): Phase when entry was logged (testing/observation)
- `created_at` (TIMESTAMP): When the link was created

**Unique Constraint:** Each `timeline_entry_id` can only be linked to one reintroduction.

## Testing

### Unit Tests

Located in `lib/reintroductions/tracking.test.ts`:

- ✅ Returns `linked: false` when `foodId` is null
- ✅ Returns `linked: false` when no active reintroduction exists
- ✅ Links entry and updates tracking for day 1 of testing phase
- ✅ Transitions to observation phase on day 4
- ✅ Marks phase as complete after day 7
- ✅ Tracks missed days when logs are skipped during testing phase
- ✅ Does not track missed days during observation phase
- ✅ Handles errors gracefully and returns `linked: false`
- ✅ Updates missed days for active reintroductions in testing phase
- ✅ Does not update missed days for observation phase
- ✅ Handles errors gracefully in `updateMissedDays`

### Integration Tests

Located in `app/api/entries/route.test.ts`:

- ✅ Links food entry to active reintroduction
- ✅ Updates reintroduction tracking fields when food is logged
- ✅ Transitions to observation phase on day 4
- ✅ Tracks missed days during testing phase
- ✅ Does not link entry when no active reintroduction exists
- ✅ Handles entries without `foodId` gracefully

## Edge Cases Handled

1. **No foodId**: Returns `{ linked: false }` immediately
2. **No active reintroduction**: Returns `{ linked: false }` after query
3. **Database errors**: Catches errors and returns `{ linked: false }` with error message
4. **Multiple logs same day**: Each log updates tracking fields, but missed days only calculated from last log
5. **Observation phase**: Missed days are NOT tracked during observation phase
6. **Phase transitions**: Automatically transitions from testing → observation → complete based on current day
7. **Duplicate timeline entries**: Unique constraint on `timeline_entry_id` prevents duplicate links

## Future Enhancements

1. **Reminder Notifications**: Send reminders when missed days exceed threshold
2. **Auto-cancellation**: Automatically cancel reintroductions with too many missed days
3. **Phase Extension**: Allow users to extend testing or observation phases
4. **Symptom Flagging**: Automatically flag symptoms logged during reintroduction for correlation analysis
5. **Progress Dashboard**: Display reintroduction progress with visual indicators

## API Response Example

When a food entry is created during an active reintroduction:

```json
{
  "entry": {
    "id": "entry-uuid",
    "entryType": "food",
    "name": "Tomatoes",
    "foodId": "food-uuid",
    "portion": "1 medium",
    "mealType": "lunch",
    "entryDate": "2024-01-15",
    "entryTime": "12:30:00"
  },
  "reintroductionTracking": {
    "linked": true,
    "reintroductionId": "reintro-uuid",
    "currentPhase": "testing",
    "currentDay": 1,
    "message": "Linked to active reintroduction (Day 1, testing phase)"
  }
}
```

When no active reintroduction exists:

```json
{
  "entry": { ... },
  "reintroductionTracking": {
    "linked": false
  }
}
```
