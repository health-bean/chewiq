const { pool } = require('../database/connection');
const { successResponse, errorResponse } = require('../utils/responses');
const { handleDatabaseError } = require('../utils/errors');
const { getCurrentUser } = require('../middleware/auth');

// Get all available protocols
const handleGetProtocols = async (queryParams, event) => {
    try {
        const client = await pool.connect();
        
        const query = `
            SELECT 
                id,
                name,
                description,
                category,
                duration_weeks,
                has_phases,
                created_at
            FROM protocols
            ORDER BY name ASC
        `;
        
        const result = await client.query(query);
        client.release();
        
        return successResponse({
            protocols: result.rows,
            total: result.rows.length
        });
        
    } catch (error) {
        console.error('Error in handleGetProtocols:', error);
        const appError = handleDatabaseError(error, 'fetch protocols');
        return errorResponse(appError.message, appError.statusCode);
    }
};

// Get user's active protocols
const handleGetUserProtocols = async (queryParams, event) => {
    try {
        const user = await getCurrentUser(event);
        if (!user) {
            return errorResponse('Authentication required', 401);
        }
        
        const client = await pool.connect();
        
        const query = `
            SELECT 
                up.id as user_protocol_id,
                up.protocol_id,
                p.name as protocol_name,
                p.description,
                p.category,
                p.duration_weeks,
                p.has_phases,
                up.is_active,
                up.started_at,
                up.ended_at
            FROM user_protocols up
            JOIN protocols p ON up.protocol_id = p.id
            WHERE up.user_id = $1
            ORDER BY up.is_active DESC, up.started_at DESC
        `;
        
        const result = await client.query(query, [user.id]);
        client.release();
        
        const activeProtocols = result.rows.filter(p => p.is_active);
        const inactiveProtocols = result.rows.filter(p => !p.is_active);
        
        return successResponse({
            active_protocols: activeProtocols,
            inactive_protocols: inactiveProtocols,
            total_active: activeProtocols.length,
            total_inactive: inactiveProtocols.length
        });
        
    } catch (error) {
        console.error('Error in handleGetUserProtocols:', error);
        const appError = handleDatabaseError(error, 'fetch user protocols');
        return errorResponse(appError.message, appError.statusCode);
    }
};

// Assign protocol to user
const handleAssignProtocol = async (body, event) => {
    try {
        const user = await getCurrentUser(event);
        if (!user) {
            return errorResponse('Authentication required', 401);
        }
        
        const { protocol_id } = body;
        if (!protocol_id) {
            return errorResponse('protocol_id is required', 400);
        }
        
        const client = await pool.connect();
        
        // Check if protocol exists
        const protocolCheck = await client.query(
            'SELECT id, name FROM protocols WHERE id = $1',
            [protocol_id]
        );
        
        if (protocolCheck.rows.length === 0) {
            client.release();
            return errorResponse('Protocol not found', 404);
        }
        
        // Insert or update user protocol assignment
        const query = `
            INSERT INTO user_protocols (user_id, protocol_id, is_active, started_at)
            VALUES ($1, $2, true, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id, protocol_id)
            DO UPDATE SET 
                is_active = true,
                started_at = CURRENT_TIMESTAMP,
                ended_at = NULL
            RETURNING *
        `;
        
        const result = await client.query(query, [user.id, protocol_id]);
        client.release();
        
        return successResponse({
            message: `Successfully assigned ${protocolCheck.rows[0].name} protocol`,
            user_protocol: result.rows[0]
        });
        
    } catch (error) {
        console.error('Error in handleAssignProtocol:', error);
        const appError = handleDatabaseError(error, 'assign protocol');
        return errorResponse(appError.message, appError.statusCode);
    }
};

// Deactivate user protocol
const handleDeactivateProtocol = async (body, event) => {
    try {
        const user = await getCurrentUser(event);
        if (!user) {
            return errorResponse('Authentication required', 401);
        }
        
        const { protocol_id } = body;
        if (!protocol_id) {
            return errorResponse('protocol_id is required', 400);
        }
        
        const client = await pool.connect();
        
        const query = `
            UPDATE user_protocols 
            SET is_active = false, ended_at = CURRENT_TIMESTAMP
            WHERE user_id = $1 AND protocol_id = $2 AND is_active = true
            RETURNING *
        `;
        
        const result = await client.query(query, [user.id, protocol_id]);
        client.release();
        
        if (result.rows.length === 0) {
            return errorResponse('Active protocol assignment not found', 404);
        }
        
        return successResponse({
            message: 'Protocol deactivated successfully',
            user_protocol: result.rows[0]
        });
        
    } catch (error) {
        console.error('Error in handleDeactivateProtocol:', error);
        const appError = handleDatabaseError(error, 'deactivate protocol');
        return errorResponse(appError.message, appError.statusCode);
    }
};

module.exports = {
    handleGetProtocols,
    handleGetUserProtocols,
    handleAssignProtocol,
    handleDeactivateProtocol
};
