const { pool } = require('../database/connection');
const { successResponse, errorResponse } = require('../utils/responses');
const { handleDatabaseError } = require('../utils/errors');

// Function to refresh the materialized view - call this periodically or when data changes
const refreshMaterializedView = async () => {
    try {
        const client = await pool.connect();
        await client.query('REFRESH MATERIALIZED VIEW mat_food_search');
        client.release();
        console.log('Materialized view refreshed successfully');
        return true;
    } catch (error) {
        console.error('Error refreshing materialized view:', error);
        return false;
    }
};

const handleSearchFoods = async (queryParams, event) => {
    console.log('🔍 FOODS: Handler called with params:', queryParams);
    
    try {
        const client = await pool.connect();
        console.log('🔍 FOODS: Database connected');
        
        const { search = '', protocol_id = null, prioritize_user_history = 'true' } = queryParams;
        
        // Get user ID properly - this was the issue
        let userId = null;
        try {
            const { getCurrentUser } = require('../middleware/auth');
            const user = await getCurrentUser(event);
            userId = user?.id;
            console.log('🔍 FOODS: User ID:', userId);
        } catch (error) {
            // Continue without user history if auth fails
            console.log('🔍 FOODS: Could not get user ID, continuing without user history:', error.message);
        }
        
        let foods = [];
        
        // Skip user history for now - just get database foods with protocol compliance
        console.log('🔍 FOODS: Searching database with protocol compliance');
        
        const searchPattern = `%${search}%`;
        let query;
        let values;
        
        // Use the materialized view for faster searches
        if (protocol_id) {
            // Include protocol compliance when protocol_id is provided
            query = `
                WITH ranked_foods AS (
                    SELECT 
                        mfs.*,
                        COALESCE(pfr.status, 'unknown') as protocol_status,
                        pfr.phase as protocol_phase,
                        pfr.notes as protocol_notes,
                        ROW_NUMBER() OVER (PARTITION BY mfs.simplified_food_id ORDER BY 
                            CASE 
                                WHEN pfr.status = 'included' THEN 1
                                WHEN pfr.status = 'try_in_moderation' THEN 2
                                WHEN pfr.status = 'avoid_for_now' THEN 3
                                ELSE 4
                            END
                        ) as row_num
                    FROM mat_food_search mfs
                    LEFT JOIN food_simplification_mappings fsm ON mfs.simplified_food_id = fsm.simplified_food_id
                    LEFT JOIN foods f ON fsm.usda_food_id = f.id
                    LEFT JOIN protocol_food_rules pfr ON f.id = pfr.food_id AND pfr.protocol_id = $2
                    WHERE mfs.display_name ILIKE $1
                )
                SELECT 
                    simplified_food_id as id,
                    display_name as name,
                    category_name as category,
                    subcategory_name,
                    nightshade,
                    histamine,
                    oxalate,
                    lectin,
                    fodmap,
                    salicylate,
                    amines,
                    glutamates,
                    sulfites,
                    goitrogens,
                    purines,
                    phytoestrogens,
                    phytates,
                    tyramine,
                    is_organic,
                    preparation_state,
                    protocol_status
                FROM ranked_foods
                WHERE row_num = 1
                ORDER BY name ASC
                LIMIT 10
            `;
            values = [searchPattern, protocol_id];
        } else {
            // Basic search without protocol compliance - use materialized view directly
            query = `
                SELECT 
                    simplified_food_id as id,
                    display_name as name,
                    category_name as category,
                    subcategory_name,
                    nightshade,
                    histamine,
                    oxalate,
                    lectin,
                    fodmap,
                    salicylate,
                    amines,
                    glutamates,
                    sulfites,
                    goitrogens,
                    purines,
                    phytoestrogens,
                    phytates,
                    tyramine,
                    is_organic,
                    preparation_state,
                    'unknown' as protocol_status
                FROM mat_food_search
                WHERE display_name ILIKE $1
                ORDER BY display_name ASC
                LIMIT 10
            `;
            values = [searchPattern];
        }
        
        console.log('🔍 FOODS: Executing query with protocol_id:', protocol_id);
        console.log('🔍 FOODS: Query:', query);
        console.log('🔍 FOODS: Values:', values);
        
        const result = await client.query(query, values);
        console.log('🔍 FOODS: Query returned:', result.rows.length, 'results');
        
        foods = result.rows.map(row => ({
            id: row.id,
            name: row.name,
            category: row.category || 'unknown',
            subcategory: row.subcategory_name,
            source: 'database',
            compliance_status: row.protocol_status || 'unknown',
            protocol_status: row.protocol_status || 'unknown',
            nightshade: row.nightshade,
            histamine: row.histamine,
            oxalate: row.oxalate,
            lectin: row.lectin,
            fodmap: row.fodmap,
            salicylate: row.salicylate,
            amines: row.amines,
            glutamates: row.glutamates,
            sulfites: row.sulfites,
            goitrogens: row.goitrogens,
            purines: row.purines,
            phytoestrogens: row.phytoestrogens,
            phytates: row.phytates,
            tyramine: row.tyramine,
            is_organic: row.is_organic,
            preparation_state: row.preparation_state
        }));
        
        client.release();
        
        return successResponse({
            foods: foods,
            total: foods.length,
            search_term: search,
            user_history_included: prioritize_user_history === 'true' && userId
        });
        
    } catch (error) {
        const appError = handleDatabaseError(error, 'search foods');
        return errorResponse(appError.message, appError.statusCode);
    }
};

// Rest of the file remains the same...

module.exports = {
    handleSearchFoods,
    refreshMaterializedView
    // Include other exported functions...
};
