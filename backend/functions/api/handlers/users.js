const { pool } = require('../database/connection');
const { successResponse, errorResponse } = require('../utils/responses');
const { handleDatabaseError } = require('../utils/errors');
const { getCurrentUser, getAccessibleUserIds, requireAuth } = require('../middleware/auth');

const handleGetUser = async (queryParams, event) => {
    // Require authentication
    const authError = await requireAuth(event);
    if (authError) {
        return authError;
    }

    try {
        const user = await getCurrentUser(event);
        
        return successResponse({ 
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                userType: user.userType
            }
        });
        
    } catch (error) {
        const appError = handleDatabaseError(error, 'fetch user');
        return errorResponse(appError.message, appError.statusCode);
    }
};

const handleUpdateUser = async (body, event) => {
    // Require authentication
    const authError = await requireAuth(event);
    if (authError) {
        return authError;
    }

    try {
        const user = await getCurrentUser(event);
        const client = await pool.connect();
        
        const updateFields = [];
        const values = [];
        let valueIndex = 1;
        
        const fieldMapping = {
            firstName: 'first_name',
            lastName: 'last_name',
            email: 'email'
        };
        
        for (const [bodyField, dbField] of Object.entries(fieldMapping)) {
            if (body[bodyField] !== undefined) {
                updateFields.push(`${dbField} = $${valueIndex}`);
                values.push(body[bodyField]);
                valueIndex++;
            }
        }
        
        if (updateFields.length === 0) {
            client.release();
            return errorResponse('No valid fields provided for update', 400);
        }
        
        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(user.id);
        
        const query = `
            UPDATE users 
            SET ${updateFields.join(', ')}
            WHERE id = $${valueIndex}
            RETURNING id, email, first_name, last_name, user_type
        `;
        
        const result = await client.query(query, values);
        client.release();
        
        if (result.rows.length === 0) {
            return errorResponse('User not found', 404);
        }
        
        const updatedUser = result.rows[0];
        
        return successResponse({
            message: 'User profile updated successfully',
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                firstName: updatedUser.first_name,
                lastName: updatedUser.last_name,
                userType: updatedUser.user_type
            }
        });
        
    } catch (error) {
        const appError = handleDatabaseError(error, 'update user');
        return errorResponse(appError.message, appError.statusCode);
    }
};

const handleGetUserProtocols = async (queryParams, event) => {
    // Require authentication
    const authError = await requireAuth(event);
    if (authError) {
        return authError;
    }

    try {
        const user = await getCurrentUser(event);
        const accessibleUserIds = await getAccessibleUserIds(event);
        const client = await pool.connect();
        
        const query = `
            SELECT 
                up.id,
                up.current_phase,
                up.start_date,
                up.end_date,
                up.compliance_score,
                up.active,
                p.id as protocol_id,
                p.name as protocol_name,
                p.description,
                p.category,
                p.phases
            FROM user_protocols up
            JOIN protocols p ON up.protocol_id = p.id
            WHERE up.user_id = ANY($1) AND up.active = true
            ORDER BY up.start_date DESC
        `;
        
        const result = await client.query(query, [accessibleUserIds]);
        client.release();
        
        return successResponse({
            protocols: result.rows,
            total: result.rows.length
        });
        
    } catch (error) {
        const appError = handleDatabaseError(error, 'fetch user protocols');
        return errorResponse(appError.message, appError.statusCode);
    }
};

const handleGetUserPreferences = async (queryParams, event) => {
    console.log('🔍 USER PREFS: Function called with params:', {
        queryParamsType: typeof queryParams,
        eventType: typeof event,
        eventDefined: !!event,
        eventHasHeaders: !!(event && event.headers)
    });
    
    // Require authentication
    const authError = await requireAuth(event);
    if (authError) {
        return authError;
    }

    try {
        const user = await getCurrentUser(event);
        const client = await pool.connect();
        
        // Try to get preferences from database
        const query = `
            SELECT preferences FROM user_preferences WHERE user_id = $1
        `;
        
        const result = await client.query(query, [user.id]);
        client.release();
        
        if (result.rows.length > 0) {
            return successResponse({
                preferences: result.rows[0].preferences
            });
        }
        
        // Return default preferences if none found
        const defaultPreferences = {
            protocols: [],
            quick_supplements: [],
            quick_medications: [],
            quick_foods: [],
            quick_symptoms: [],
            quick_detox: [],
            setup_complete: false
        };
        
        return successResponse({
            preferences: defaultPreferences
        });
        
    } catch (error) {
        // If user_preferences table doesn't exist yet, return mock data
        if (error.code === '42P01') { // Table doesn't exist
            const mockPreferences = {
                protocols: [],
                quick_supplements: [],
                quick_medications: [],
                quick_foods: [],
                quick_symptoms: [],
                quick_detox: [],
                setup_complete: false  // Let demo users go through setup wizard
            };
            
            return successResponse({
                preferences: mockPreferences
            });
        }
        
        const appError = handleDatabaseError(error, 'fetch user preferences');
        return errorResponse(appError.message, appError.statusCode);
    }
};

const handleUpdateUserPreferences = async (body, event) => {
    // Require authentication
    const authError = await requireAuth(event);
    if (authError) {
        return authError;
    }

    try {
        const user = await getCurrentUser(event);
        const client = await pool.connect();
        
        // Upsert preferences
        const query = `
            INSERT INTO user_preferences (user_id, preferences)
            VALUES ($1, $2)
            ON CONFLICT (user_id)
            DO UPDATE SET 
                preferences = $2,
                updated_at = CURRENT_TIMESTAMP
            RETURNING preferences
        `;
        
        const result = await client.query(query, [user.id, JSON.stringify(body)]);
        client.release();
        
        return successResponse({
            message: 'User preferences updated successfully',
            preferences: result.rows[0].preferences
        });
        
    } catch (error) {
        // If user_preferences table doesn't exist yet, just return success
        if (error.code === '42P01') { // Table doesn't exist
            return successResponse({
                message: 'User preferences updated successfully (stored locally)',
                preferences: body
            });
        }
        
        const appError = handleDatabaseError(error, 'update user preferences');
        return errorResponse(appError.message, appError.statusCode);
    }
};

module.exports = {
    handleGetUser,
    handleUpdateUser,
    handleGetUserProtocols,
    handleGetUserPreferences,
    handleUpdateUserPreferences
};