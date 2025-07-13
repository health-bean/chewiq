const { pool } = require('../database/connection');
const { successResponse, errorResponse } = require('../utils/responses');
const { handleDatabaseError } = require('../utils/errors');

const handleGetJournalEntries = async (queryParams, event) => {
    try {
        const client = await pool.connect();
        const userId = event.user.id;
        const { limit = 30, offset = 0 } = queryParams;
        
        const query = `
            SELECT 
                id,
                entry_date,
                bedtime,
                wake_time,
                sleep_quality,
                energy_level,
                mood_level,
                physical_comfort,
                activity_level,
                stress_level,
                meditation_practice,
                meditation_minutes,
                cycle_day,
                ovulation,
                created_at,
                updated_at
            FROM journal_entries
            WHERE user_id = $1
            ORDER BY entry_date DESC
            LIMIT $2 OFFSET $3
        `;
        
        const result = await client.query(query, [userId, limit, offset]);
        client.release();
        
        return successResponse({
            entries: result.rows,
            total: result.rows.length
        });
        
    } catch (error) {
        const appError = handleDatabaseError(error, 'get journal entries');
        return errorResponse(appError.message, appError.statusCode);
    }
};

const handleGetJournalEntry = async (date, event) => {
    try {
        const client = await pool.connect();
        const userId = event.user.id;
        
        const query = `
            SELECT 
                id,
                entry_date,
                bedtime,
                wake_time,
                sleep_quality,
                energy_level,
                mood_level,
                physical_comfort,
                activity_level,
                stress_level,
                meditation_practice,
                meditation_minutes,
                cycle_day,
                ovulation,
                created_at,
                updated_at
            FROM journal_entries
            WHERE user_id = $1 AND entry_date = $2
        `;
        
        const result = await client.query(query, [userId, date]);
        client.release();
        
        if (result.rows.length === 0) {
            return successResponse({
                entry: null,
                date: date
            });
        }
        
        return successResponse({
            entry: result.rows[0]
        });
        
    } catch (error) {
        const appError = handleDatabaseError(error, 'get journal entry');
        return errorResponse(appError.message, appError.statusCode);
    }
};

const handleCreateJournalEntry = async (body, event) => {
    try {
        const client = await pool.connect();
        const userId = event.user.id;
        const {
            entry_date,
            bedtime,
            wake_time,
            sleep_quality,
            energy_level,
            mood_level,
            physical_comfort,
            activity_level,
            stress_level,
            meditation_practice,
            meditation_minutes,
            cycle_day,
            ovulation,
            sleep_symptoms = []
        } = body;
        
        await client.query('BEGIN');
        
        // Insert or update journal entry
        const journalQuery = `
            INSERT INTO journal_entries (
                user_id, entry_date, bedtime, wake_time, sleep_quality,
                energy_level, mood_level, physical_comfort, activity_level,
                stress_level, meditation_practice, meditation_minutes,
                cycle_day, ovulation
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            ON CONFLICT (user_id, entry_date) 
            DO UPDATE SET
                bedtime = EXCLUDED.bedtime,
                wake_time = EXCLUDED.wake_time,
                sleep_quality = EXCLUDED.sleep_quality,
                energy_level = EXCLUDED.energy_level,
                mood_level = EXCLUDED.mood_level,
                physical_comfort = EXCLUDED.physical_comfort,
                activity_level = EXCLUDED.activity_level,
                stress_level = EXCLUDED.stress_level,
                meditation_practice = EXCLUDED.meditation_practice,
                meditation_minutes = EXCLUDED.meditation_minutes,
                cycle_day = EXCLUDED.cycle_day,
                ovulation = EXCLUDED.ovulation,
                updated_at = CURRENT_TIMESTAMP
            RETURNING id
        `;
        
        const journalResult = await client.query(journalQuery, [
            userId, entry_date, bedtime, wake_time, sleep_quality,
            energy_level, mood_level, physical_comfort, activity_level,
            stress_level, meditation_practice, meditation_minutes,
            cycle_day, ovulation
        ]);
        
        const journalEntryId = journalResult.rows[0].id;
        
        // Handle sleep symptoms - add to timeline_entries
        if (sleep_symptoms && sleep_symptoms.length > 0) {
            // First, remove existing sleep symptoms for this date
            await client.query(`
                DELETE FROM timeline_entries 
                WHERE user_id = $1 
                  AND entry_date = $2 
                  AND entry_type = 'symptom'
                  AND structured_content->>'entry_source' = 'daily_reflection'
            `, [userId, entry_date]);
            
            // Insert new sleep symptoms
            for (const symptom of sleep_symptoms) {
                const timelineQuery = `
                    INSERT INTO timeline_entries (
                        user_id, journal_entry_id, entry_date, entry_time,
                        entry_type, content, severity, structured_content
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                `;
                
                const structuredContent = {
                    entry_source: 'daily_reflection',
                    symptom_name: symptom.name,
                    severity: symptom.severity,
                    context: 'sleep_related'
                };
                
                await client.query(timelineQuery, [
                    userId,
                    journalEntryId,
                    entry_date,
                    '23:59:00', // Default end-of-day time for reflection symptoms
                    'symptom',
                    symptom.name,
                    symptom.severity,
                    JSON.stringify(structuredContent)
                ]);
            }
        }
        
        await client.query('COMMIT');
        client.release();
        
        return successResponse({
            message: 'Journal entry saved successfully',
            entry_id: journalEntryId,
            sleep_symptoms_added: sleep_symptoms.length
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        client.release();
        const appError = handleDatabaseError(error, 'create journal entry');
        return errorResponse(appError.message, appError.statusCode);
    }
};

const handleUpdateJournalEntry = async (date, body, event) => {
    // For now, just call create which handles upsert
    return handleCreateJournalEntry({ ...body, entry_date: date }, event);
};

module.exports = {
    handleGetJournalEntries,
    handleCreateJournalEntry,
    handleGetJournalEntry,
    handleUpdateJournalEntry
};
