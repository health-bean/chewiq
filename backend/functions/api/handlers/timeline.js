const { pool } = require('../database/connection');
const { successResponse, errorResponse } = require('../utils/responses');
const { handleDatabaseError } = require('../utils/errors');
const { getCurrentUser, getAccessibleUserIds, requireAuth } = require('../middleware/auth');

const handleGetTimelineEntries = async (queryParams, event) => {
    // Require authentication (disabled for development)
    // const authError = await requireAuth(event);
    // if (authError) {
    //     return authError;
    // }

    try {
        const user = await getCurrentUser(event);
        const accessibleUserIds = await getAccessibleUserIds(event);
        const client = await pool.connect();
        const { date = null, limit = 50 } = queryParams;
        
        let query = `
            SELECT 
                te.id,
                te.entry_time,
                te.entry_type,
                te.content,
                te.severity,
                te.protocol_compliant,
                te.created_at,
                je.entry_date,
                te.user_id
            FROM timeline_entries te
            JOIN journal_entries je ON te.journal_entry_id = je.id
            WHERE te.user_id = ANY($1)
        `;
        
        const values = [accessibleUserIds];
        
        if (date) {
            query += ` AND je.entry_date = $2`;
            values.push(date);
        }
        
        query += ` ORDER BY je.entry_date DESC, te.entry_time DESC LIMIT $${values.length + 1}`;
        values.push(limit);
        
        const result = await client.query(query, values);
        client.release();
        
        return successResponse({
            entries: result.rows,
            total: result.rows.length
        });
        
    } catch (error) {
        const appError = handleDatabaseError(error, 'fetch timeline entries');
        return errorResponse(appError.message, appError.statusCode);
    }
};

const handleCreateTimelineEntry = async (body, event) => {
    // Require authentication (disabled for development)
    // const authError = await requireAuth(event);
    // if (authError) {
    //     return authError;
    // }

    try {
        const user = await getCurrentUser(event);
        const client = await pool.connect();
        
        const {
            entryDate,
            entryTime,
            entryType,
            content,
            severity = null,
            selectedFoods = []
        } = body;
        
        await client.query('BEGIN');
        
        let journalEntryId;
        
        // First check if journal entry already exists for this user/date
        const checkQuery = `
            SELECT id FROM journal_entries 
            WHERE user_id = $1 AND entry_date = $2
        `;
        
        const checkResult = await client.query(checkQuery, [user.id, entryDate]);
        
        if (checkResult.rows.length > 0) {
            // Use existing journal entry
            journalEntryId = checkResult.rows[0].id;
        } else {
            // Create new journal entry
            const journalQuery = `
                INSERT INTO journal_entries (user_id, entry_date, created_at, updated_at)
                VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                RETURNING id
            `;
            
            const journalResult = await client.query(journalQuery, [user.id, entryDate]);
            journalEntryId = journalResult.rows[0].id;
        }
        
        const timelineQuery = `
            INSERT INTO timeline_entries (
                journal_entry_id, user_id, entry_time, 
                entry_type, content, severity, protocol_compliant
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;
        
        const protocolCompliant = entryType === 'food' ? 
            await checkProtocolCompliance(selectedFoods, user.id, client) : null;
        
        const timelineValues = [
            journalEntryId, user.id, entryTime,
            entryType, content, severity, protocolCompliant
        ];
        
        const timelineResult = await client.query(timelineQuery, timelineValues);
        
        await client.query('COMMIT');
        client.release();
        
        return successResponse({
            message: 'Timeline entry created successfully',
            entry: timelineResult.rows[0]
        }, 201);
        
    } catch (error) {
        const appError = handleDatabaseError(error, 'create timeline entry');
        return errorResponse(appError.message, appError.statusCode);
    }
};

const checkProtocolCompliance = async (selectedFoods, userId, client) => {
    if (!selectedFoods || selectedFoods.length === 0) return null;
    
    try {
        const query = `
            SELECT COUNT(*) as avoid_count
            FROM protocol_food_rules pfr
            JOIN user_protocols up ON pfr.protocol_id = up.protocol_id
            JOIN food_properties fp ON pfr.food_id = fp.id
            WHERE up.user_id = $1 
            AND up.active = true
            AND fp.name = ANY($2)
            AND pfr.status = 'avoid'
        `;
        
        const result = await client.query(query, [userId, selectedFoods]);
        return parseInt(result.rows[0].avoid_count) === 0;
        
    } catch (error) {
        console.error('Protocol compliance check failed:', error);
        return null;
    }
};

module.exports = {
    handleGetTimelineEntries,
    handleCreateTimelineEntry
};