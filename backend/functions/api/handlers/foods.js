const { pool } = require('../database/connection');
const { successResponse, errorResponse } = require('../utils/responses');
const { handleDatabaseError } = require('../utils/errors');

const handleSearchFoods = async (queryParams) => {
    try {
        const client = await pool.connect();
        // Support both old and new parameter names for backward compatibility
        const protocol_id = queryParams.protocol_id || queryParams.dietary_protocol_id;
        const search = queryParams.search || '';
        const searchPattern = `%${search}%`;
        
        let query, values;
        
        if (protocol_id) {
            // Use mat_protocol_foods view which already has the protocol relationship data
            query = `
                SELECT 
                    mpf.food_id as id,
                    mpf.food_name as name,
                    mpf.category_name as category,
                    mpf.protocol_status
                FROM mat_protocol_foods mpf
                WHERE mpf.food_name ILIKE $1
                AND mpf.protocol_id = $2
                ORDER BY mpf.food_name ASC
                LIMIT 10
            `;
            values = [searchPattern, protocol_id];
        } else {
            // Use mat_food_search for general food search without protocol context
            query = `
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
            values = [searchPattern];
        }
        
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
        // Support both old and new parameter names for backward compatibility
        const protocol_id = queryParams.protocol_id || queryParams.dietary_protocol_id;
        
        if (!protocol_id) {
            return errorResponse('protocol_id or dietary_protocol_id parameter is required', 400);
        }
        
        const client = await pool.connect();
        
        // Use materialized view for better performance
        const query = `
            SELECT 
                mpf.food_id as id,
                mpf.food_name as name,
                mpf.category_name as category,
                mpf.protocol_status,
                mpf.protocol_phase
            FROM mat_protocol_foods mpf
            WHERE mpf.protocol_id = $1
            ORDER BY 
                CASE 
                    WHEN mpf.protocol_status = 'included' THEN 1
                    WHEN mpf.protocol_status = 'try_in_moderation' THEN 2
                    WHEN mpf.protocol_status = 'avoid_for_now' THEN 3
                    ELSE 4
                END,
                mpf.category_name ASC,
                mpf.food_name ASC
            LIMIT 200
        `;
        
        const result = await client.query(query, [protocol_id]);
        client.release();
        
        // Group by category for frontend
        const foodsByCategory = {};
        const foodsByStatus = {
            allowed: [],
            avoid: [],
            reintroduction: [],
            unknown: []
        };
        
        result.rows.forEach(food => {
            const category = food.category || 'Other';
            const status = food.protocol_status || 'unknown';
            
            // Group by category
            if (!foodsByCategory[category]) {
                foodsByCategory[category] = [];
            }
            foodsByCategory[category].push(food);
            
            // Group by status
            if (status === 'included') foodsByStatus.allowed.push(food);
            else if (status === 'avoid_for_now') foodsByStatus.avoid.push(food);
            else if (status === 'try_in_moderation') foodsByStatus.reintroduction.push(food);
            else foodsByStatus.unknown.push(food);
        });
        
        return successResponse({
            foods: result.rows,
            foods_by_category: foodsByCategory,
            foods_by_status: foodsByStatus,
            compliance_stats: {
                total: result.rows.length,
                allowed: foodsByStatus.allowed.length,
                avoid: foodsByStatus.avoid.length,
                reintroduction: foodsByStatus.reintroduction.length,
                unknown: foodsByStatus.unknown.length
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
