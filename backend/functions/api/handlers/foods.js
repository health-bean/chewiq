const { pool } = require('../database/connection');
const { successResponse, errorResponse } = require('../utils/responses');
const { handleDatabaseError } = require('../utils/errors');

const handleSearchFoods = async (queryParams) => {
    try {
        const client = await pool.connect();
        const protocol_id = queryParams.protocol_id || queryParams.dietary_protocol_id;
        const search = queryParams.search || '';
        const searchPattern = `%${search}%`;
        
        // For now, use only mat_food_search since mat_protocol_foods has issues
        const query = `
            SELECT 
                simplified_food_id as id,
                display_name as name,
                category_name as category,
                preparation_state,
                is_organic,
                'unknown' as protocol_status
            FROM mat_food_search
            WHERE display_name ILIKE $1
            ORDER BY display_name ASC
            LIMIT 10
        `;
        const values = [searchPattern];
        
        const result = await client.query(query, values);
        client.release();
        
        const foods = result.rows.map(row => ({
            id: row.id,
            name: row.name,
            category: row.category,
            preparation_state: row.preparation_state,
            is_organic: row.is_organic,
            protocol_status: row.protocol_status
        }));
        
        return successResponse({
            foods,
            total: foods.length,
            search_term: search
        });
        
    } catch (error) {
        const appError = handleDatabaseError(error, 'search foods');
        return errorResponse(appError.message, appError.statusCode);
    }
};

const handleGetProtocolFoods = async (queryParams) => {
    try {
        const protocol_id = queryParams.protocol_id || queryParams.dietary_protocol_id;
        
        if (!protocol_id) {
            return errorResponse('protocol_id or dietary_protocol_id parameter is required', 400);
        }
        
        // Since mat_protocol_foods is empty, return a placeholder response
        return successResponse({
            foods: [],
            foods_by_category: {},
            foods_by_status: {
                allowed: [],
                avoid: [],
                reintroduction: [],
                unknown: []
            },
            compliance_stats: {
                total: 0,
                allowed: 0,
                avoid: 0,
                reintroduction: 0,
                unknown: 0
            },
            protocol_id
        });
        
    } catch (error) {
        const appError = handleDatabaseError(error, 'fetch protocol foods');
        return errorResponse(appError.message, appError.statusCode);
    }
};

module.exports = {
    handleSearchFoods,
    handleGetProtocolFoods
};
