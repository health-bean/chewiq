const { pool } = require('../database/connection');
const { successResponse, errorResponse } = require('../utils/responses');
const { handleDatabaseError } = require('../utils/errors');
const { getCurrentUser, getAccessibleUserIds, requireAuth } = require('../middleware/auth');

const handleGetTimelineEntries = async (queryParams, event) => {
    console.log('=== handleGetTimelineEntries called ===');
    console.log('Query params:', queryParams);
    
    try {
        console.log('Getting current user...');
        const user = await getCurrentUser(event);
        console.log('User:', user);
        
        let accessibleUserIds;
        
        if (user) {
            console.log('User found, getting accessible user IDs...');
            accessibleUserIds = await getAccessibleUserIds(event);
        } else {
            console.log('No user found - this should not happen with new auth system');
            return errorResponse('Authentication required', 401);
        }
        
        console.log('Accessible user IDs:', accessibleUserIds);
        
        console.log('Connecting to database...');
        const client = await pool.connect();
        const { date = null, limit = 50 } = queryParams;
        
        console.log('Building query with date:', date, 'limit:', limit);
        
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
        let paramIndex = 2;
        
        if (date) {
            query += ` AND je.entry_date = $${paramIndex}`;
            values.push(date);
            paramIndex++;
        }
        
        query += ` ORDER BY je.entry_date DESC, te.entry_time DESC LIMIT $${paramIndex}`;
        values.push(limit);
        
        console.log('Final query:', query);
        console.log('With values:', values);
        console.log('Parameter count:', values.length);
        
        const result = await client.query(query, values);
        console.log('Query result:', result.rows.length, 'rows');
        
        client.release();
        
        const response = successResponse({
            entries: result.rows,
            total: result.rows.length
        });
        
        console.log('Returning response with', result.rows.length, 'entries');
        return response;
        
    } catch (error) {
        console.error('=== ERROR in handleGetTimelineEntries ===');
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        const appError = handleDatabaseError(error, 'fetch timeline entries');
        console.error('Handled error:', appError);
        
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
        let userId;
        
        if (user) {
            userId = user.id;
        } else {
            console.log('No user found - authentication required');
            return errorResponse('Authentication required', 401);
        }
        
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
        
        const checkResult = await client.query(checkQuery, [userId, entryDate]);
        
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
            
            const journalResult = await client.query(journalQuery, [userId, entryDate]);
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
            await checkProtocolCompliance(selectedFoods, userId, client) : null;
        
        const timelineValues = [
            journalEntryId, userId, entryTime,
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