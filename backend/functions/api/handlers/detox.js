const { pool } = require('../database/connection');
const { successResponse, errorResponse } = require('../utils/responses');
const { handleDatabaseError } = require('../utils/errors');

const handleSearchDetoxTypes = async (queryParams, event) => {
    try {
        const client = await pool.connect();
        const { search = '', limit = 10 } = queryParams;
        
        const query = `
            SELECT 
                id,
                name,
                category,
                duration_suggested,
                description
            FROM detox_types
            WHERE name ILIKE $1 
               OR description ILIKE $1
            AND is_active = true
            ORDER BY 
                CASE 
                    WHEN name ILIKE $2 THEN 1
                    ELSE 2
                END,
                name ASC
            LIMIT $3
        `;
        
        const searchPattern = `%${search}%`;
        const exactMatch = `${search}%`;
        const values = [searchPattern, exactMatch, limit];
        
        const result = await client.query(query, values);
        client.release();
        
        return successResponse({
            detox_types: result.rows,
            total: result.rows.length,
            search_term: search
        });
        
    } catch (error) {
        const appError = handleDatabaseError(error, 'search detox types');
        return errorResponse(appError.message, appError.statusCode);
    }
};

module.exports = {
    handleSearchDetoxTypes
};