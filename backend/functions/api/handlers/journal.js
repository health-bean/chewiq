const { pool } = require('../database/connection');
const { successResponse, errorResponse } = require('../utils/responses');
const { handleDatabaseError } = require('../utils/errors');

const handleGetJournalEntries = async (queryParams, event) => {
    let client;
    try {
        client = await pool.connect();
        const userId = event.user.id;
        const { limit = 30, offset = 0 } = queryParams;
        
        const query = `
            SELECT 
                id,
                entry_date,
                reflection_data,
                consent_to_anonymize,
                created_at,
                updated_at
            FROM journal_entries
            WHERE user_id = $1
            ORDER BY entry_date DESC
            LIMIT $2 OFFSET $3
        `;
        
        const result = await client.query(query, [userId, limit, offset]);
        
        return successResponse({
            entries: result.rows,
            total: result.rows.length
        });
        
    } catch (error) {
        const appError = handleDatabaseError(error, 'get journal entries');
        return errorResponse(appError.message, appError.statusCode);
    } finally {
        if (client) {
            client.release();
        }
    }
};

const handleGetJournalEntry = async (date, event) => {
    let client;
    try {
        console.log('🔍 Journal API: Getting entry for date:', date);
        console.log('🔍 Journal API: Event user:', event.user ? 'present' : 'missing');
        
        client = await pool.connect();
        const userId = event.user?.id;
        
        if (!userId) {
            console.error('❌ Journal API: No user ID found in event');
            return errorResponse('User not authenticated', 401);
        }
        
        console.log('🔍 Journal API: User ID:', userId);
        console.log('🔍 Journal API: Date parameter:', date);
        
        const query = `
            SELECT 
                id,
                entry_date,
                reflection_data,
                consent_to_anonymize,
                created_at,
                updated_at
            FROM journal_entries
            WHERE user_id = $1 AND entry_date = $2
        `;
        
        console.log('🔍 Journal API: Executing query with params:', [userId, date]);
        const result = await client.query(query, [userId, date]);
        
        console.log('🔍 Journal API: Query result rows:', result.rows.length);
        
        if (result.rows.length === 0) {
            console.log('✅ Journal API: No entry found, returning null');
            return successResponse({
                entry: null,
                date: date
            });
        }
        
        console.log('✅ Journal API: Entry found, returning data');
        return successResponse({
            entry: result.rows[0]
        });
        
    } catch (error) {
        console.error('❌ Journal API Error:', error);
        console.error('❌ Journal API Error stack:', error.stack);
        const appError = handleDatabaseError(error, 'get journal entry');
        return errorResponse(appError.message, appError.statusCode);
    } finally {
        if (client) {
            client.release();
        }
    }
};

const handleCreateJournalEntry = async (body, event) => {
    let client;
    try {
        console.log('🔍 Journal API: Creating entry with body:', JSON.stringify(body, null, 2));
        
        client = await pool.connect();
        
        // Get user ID from event or fallback to demo_user in body
        let userId;
        
        if (event.user && event.user.id) {
            userId = event.user.id;
            console.log('🔍 Journal API: Using authenticated user ID:', userId);
        } else if (body.demo_user === 'sarah-aip') {
            userId = '8e8a568a-c2f8-43a8-abf2-4e54408dbdc0'; // Hardcoded fallback for sarah-aip
            console.log('🔍 Journal API: Using fallback ID for sarah-aip');
        } else {
            console.log('🔍 Journal API: No user ID available');
            return errorResponse('Authentication required', 401);
        }
        
        // Extract data with robust error handling
        const entry_date = body.entry_date || body.entryDate || new Date().toISOString().split('T')[0];
        const bedtime = body.bedtime || null;
        const wake_time = body.wake_time || null;
        const sleep_quality = body.sleep_quality || null;
        const sleep_symptoms = Array.isArray(body.sleep_symptoms) ? body.sleep_symptoms : [];
        const energy_level = body.energy_level ? parseInt(body.energy_level) : null;
        const mood_level = body.mood_level ? parseInt(body.mood_level) : null;
        const physical_comfort = body.physical_comfort ? parseInt(body.physical_comfort) : null;
        const activity_level = body.activity_level || null;
        const meditation_duration = body.meditation_duration ? parseInt(body.meditation_duration) : 0;
        const meditation_practice = body.meditation_practice || (meditation_duration > 0);
        const cycle_day = body.cycle_day || null;
        const ovulation = body.ovulation || false;
        const personal_reflection = body.personal_reflection || null;
        
        // Structure data according to new JSONB format
        const reflectionData = {
            sleep: {
                bedtime: bedtime,
                wake_time: wake_time,
                sleep_quality: sleep_quality,
                sleep_symptoms: sleep_symptoms
            },
            wellness: {
                energy_level: energy_level,
                mood_level: mood_level,
                physical_comfort: physical_comfort
            },
            activity: {
                activity_level: activity_level
            },
            meditation: {
                meditation_duration: meditation_duration,
                meditation_practice: meditation_practice
            },
            cycle: {
                cycle_day: cycle_day,
                ovulation: ovulation
            },
            notes: {
                personal_reflection: personal_reflection
            }
        };
        
        console.log('🔍 Journal API: User ID:', userId);
        console.log('🔍 Journal API: Entry date:', entry_date);
        console.log('🔍 Journal API: Structured reflection data:', JSON.stringify(reflectionData, null, 2));
        
        await client.query('BEGIN');
        
        // Insert or update journal entry with JSONB structure
        // Make sure we're handling JSONB properly - PostgreSQL expects JSON object, not string
        const journalQuery = `
            INSERT INTO journal_entries (
                user_id, entry_date, reflection_data, consent_to_anonymize
            ) VALUES ($1, $2, $3, $4)
            ON CONFLICT (user_id, entry_date) 
            DO UPDATE SET
                reflection_data = EXCLUDED.reflection_data,
                updated_at = CURRENT_TIMESTAMP
            RETURNING id
        `;
        
        // Don't stringify the JSONB data - PostgreSQL driver handles this conversion
        const journalResult = await client.query(journalQuery, [
            userId, 
            entry_date, 
            reflectionData, // Send as JavaScript object, not JSON string
            false // Default consent_to_anonymize
        ]);
        
        const journalEntryId = journalResult.rows[0].id;
        console.log('🔍 Journal API: Journal entry created/updated with ID:', journalEntryId);
        
        // Handle sleep symptoms - add to timeline_entries
        if (sleep_symptoms && sleep_symptoms.length > 0) {
            console.log('🔍 Journal API: Processing sleep symptoms:', sleep_symptoms.length);
            
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
                        entry_type, structured_content
                    ) VALUES ($1, $2, $3, $4, $5, $6)
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
                    structuredContent // Send as JavaScript object, not JSON string
                ]);
            }
        }
        
        await client.query('COMMIT');
        
        console.log('✅ Journal API: Entry saved successfully');
        return successResponse({
            message: 'Journal entry saved successfully',
            entry_id: journalEntryId,
            sleep_symptoms_added: sleep_symptoms.length
        });
        
    } catch (error) {
        console.error('❌ Journal API Create Error:', error);
        console.error('❌ Journal API Error message:', error.message);
        console.error('❌ Journal API Error stack:', error.stack);
        console.error('❌ Journal API Request body was:', JSON.stringify(body, null, 2));
        
        if (client) {
            try {
                await client.query('ROLLBACK');
            } catch (rollbackError) {
                console.error('❌ Journal API Rollback Error:', rollbackError);
            }
        }
        
        const appError = handleDatabaseError(error, 'create journal entry');
        return errorResponse(appError.message, appError.statusCode);
    } finally {
        if (client) {
            client.release();
        }
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
