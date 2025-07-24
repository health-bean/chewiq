const { pool } = require('../database/connection');
const { successResponse, errorResponse } = require('../utils/responses');
const { handleDatabaseError } = require('../utils/errors');

const handleSearchFoods = async (queryParams) => {
    try {
        const client = await pool.connect();
        const protocol_id = queryParams.protocol_id || queryParams.dietary_protocol_id;
        const search = queryParams.search || '';
        const searchPattern = `%${search}%`;
        
        // Enhanced search that looks in both simple name and detailed display name
        const query = `
            SELECT 
                food_id as id,
                display_name as name,
                simple_name,
                category_name as category,
                subcategory_name as subcategory,
                preparation_state,
                is_organic,
                properties,
                -- Extract key properties for frontend display
                CASE 
                    WHEN (properties->'growing'->>'organic')::boolean = true THEN true
                    ELSE false
                END as is_organic_detailed,
                CASE 
                    WHEN (properties->'growing'->>'grass_fed')::boolean = true THEN true
                    ELSE false
                END as is_grass_fed,
                CASE 
                    WHEN (properties->'growing'->>'free_range')::boolean = true THEN true
                    ELSE false
                END as is_free_range,
                CASE 
                    WHEN (properties->'growing'->>'wild_caught')::boolean = true THEN true
                    ELSE false
                END as is_wild_caught,
                histamine,
                fodmap,
                nightshade,
                'unknown' as protocol_status
            FROM mat_food_search
            WHERE (display_name ILIKE $1 OR simple_name ILIKE $1)
            ORDER BY 
                -- Prioritize exact matches on simple name
                CASE WHEN simple_name ILIKE $1 THEN 1 ELSE 2 END,
                display_name ASC
            LIMIT 20
        `;
        const values = [searchPattern];
        
        console.log('Executing enhanced food search query:', query);
        console.log('With values:', values);
        
        const result = await client.query(query, values);
        client.release();
        
        console.log(`Found ${result.rows.length} food results`);
        
        const foods = result.rows.map(row => ({
            id: row.id,
            name: row.name, // This is the detailed display name
            simple_name: row.simple_name,
            category: row.category,
            subcategory: row.subcategory,
            preparation_state: row.preparation_state,
            is_organic: row.is_organic_detailed,
            is_grass_fed: row.is_grass_fed,
            is_free_range: row.is_free_range,
            is_wild_caught: row.is_wild_caught,
            health_properties: {
                histamine: row.histamine,
                fodmap: row.fodmap,
                nightshade: row.nightshade
            },
            protocol_status: row.protocol_status
        }));
        
        return successResponse({
            foods,
            total: foods.length,
            search_term: search
        });
        
    } catch (error) {
        console.error('Error in handleSearchFoods:', error);
        const appError = handleDatabaseError(error, 'search foods');
        return errorResponse(appError.message, appError.statusCode);
    }
};

// Alternative approach: Group similar foods with variations
const handleSearchFoodsGrouped = async (queryParams) => {
    try {
        const client = await pool.connect();
        const search = queryParams.search || '';
        const searchPattern = `%${search}%`;
        
        const query = `
            SELECT 
                simple_name,
                array_agg(
                    json_build_object(
                        'id', food_id,
                        'display_name', display_name,
                        'preparation_state', preparation_state,
                        'is_organic', (properties->'growing'->>'organic')::boolean,
                        'is_grass_fed', (properties->'growing'->>'grass_fed')::boolean,
                        'is_free_range', (properties->'growing'->>'free_range')::boolean,
                        'is_wild_caught', (properties->'growing'->>'wild_caught')::boolean,
                        'health_properties', json_build_object(
                            'histamine', histamine,
                            'fodmap', fodmap,
                            'nightshade', nightshade
                        )
                    ) ORDER BY display_name
                ) as variations
            FROM mat_food_search
            WHERE (display_name ILIKE $1 OR simple_name ILIKE $1)
            GROUP BY simple_name, category_name, subcategory_name
            ORDER BY simple_name ASC
            LIMIT 10
        `;
        
        const result = await client.query(query, [searchPattern]);
        client.release();
        
        const foodGroups = result.rows.map(row => ({
            base_name: row.simple_name,
            variations: row.variations
        }));
        
        return successResponse({
            food_groups: foodGroups,
            total: foodGroups.length,
            search_term: search
        });
        
    } catch (error) {
        console.error('Error in handleSearchFoodsGrouped:', error);
        const appError = handleDatabaseError(error, 'search foods grouped');
        return errorResponse(appError.message, appError.statusCode);
    }
};

module.exports = {
    handleSearchFoods,
    handleSearchFoodsGrouped
};
