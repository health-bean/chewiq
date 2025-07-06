const { pool } = require('../database/connection');
const { successResponse, errorResponse } = require('../utils/responses');
const { handleDatabaseError } = require('../utils/errors');
const { getAccessibleUserIds, requireAuth } = require('../middleware/auth');

const handleGetProtocols = async (queryParams, event) => {
    // Require authentication (disabled for development)
    // const authError = await requireAuth(event);
    // if (authError) {
    //     return authError;
    // }

    try {
        // Get all user IDs this user can access (patient sees own, practitioner sees patients)
        const accessibleUserIds = await getAccessibleUserIds(event);
        
        const client = await pool.connect();
        
        const query = `
            SELECT 
                id,
                name,
                description,
                category,
                phases,
                official,
                version
            FROM protocols 
            WHERE 
                is_global = true 
                OR created_by = ANY($1)
                OR created_by IS NULL
            ORDER BY official DESC, name ASC
        `;
        
        const result = await client.query(query, [accessibleUserIds]);
        client.release();
        
        return successResponse({
            protocols: result.rows,
            total: result.rows.length
        });
        
    } catch (error) {
        const appError = handleDatabaseError(error, 'fetch protocols');
        return errorResponse(appError.message, appError.statusCode);
    }
};

module.exports = {
    handleGetProtocols
};