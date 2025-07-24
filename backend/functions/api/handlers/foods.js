const { pool } = require('../database/connection');
const { successResponse, errorResponse } = require('../utils/responses');
const { handleDatabaseError } = require('../utils/errors');
const { getCurrentUser } = require('../middleware/auth');

const handleSearchFoods = async (queryParams, event) => {
    try {
        const client = await pool.connect();
        const protocol_id = queryParams.protocol_id || queryParams.dietary_protocol_id;
        const search = queryParams.search || '';
        const searchPattern = `%${search}%`;
        
        // Get current user to check their active protocols
        const user = await getCurrentUser(event);
        let userProtocols = [];
        
        if (user) {
            const protocolQuery = `
                SELECT up.protocol_id, p.name as protocol_name
                FROM user_protocols up
                JOIN protocols p ON up.protocol_id = p.id
                WHERE up.user_id = $1 AND up.is_active = true
            `;
            const protocolResult = await client.query(protocolQuery, [user.id]);
            userProtocols = protocolResult.rows;
        }
        
        // Enhanced search query with protocol compliance
        const query = `
            SELECT 
                mfs.food_id as id,
                mfs.display_name as name,
                mfs.category_name as category,
                mfs.subcategory_name as subcategory,
                mfs.preparation_state,
                mfs.is_organic,
                mfs.properties,
                -- Get protocol compliance for user's active protocols
                COALESCE(
                    json_agg(
                        CASE 
                            WHEN pfr.protocol_id IS NOT NULL THEN
                                json_build_object(
                                    'protocol_id', pfr.protocol_id,
                                    'protocol_name', p.name,
                                    'status', pfr.status,
                                    'phase', pfr.phase,
                                    'notes', pfr.notes
                                )
                            ELSE NULL
                        END
                    ) FILTER (WHERE pfr.protocol_id IS NOT NULL),
                    '[]'::json
                ) as protocol_compliance
            FROM mat_food_search mfs
            LEFT JOIN protocol_food_rules pfr ON mfs.food_id = pfr.food_id 
                AND pfr.protocol_id = ANY($2::uuid[])
            LEFT JOIN protocols p ON pfr.protocol_id = p.id
            WHERE mfs.display_name ILIKE $1
            GROUP BY mfs.food_id, mfs.display_name, mfs.category_name, mfs.subcategory_name, 
                     mfs.preparation_state, mfs.is_organic, mfs.properties
            ORDER BY mfs.display_name ASC
            LIMIT 10
        `;
        
        const protocolIds = userProtocols.map(p => p.protocol_id);
        const values = [searchPattern, protocolIds];
        
        console.log('Executing food search query with protocol compliance:', query);
        console.log('With values:', values);
        
        const result = await client.query(query, values);
        client.release();
        
        console.log(`Found ${result.rows.length} food results`);
        
        const foods = result.rows.map(row => {
            const food = {
                id: row.id,
                name: row.name,
                category: row.category,
                subcategory: row.subcategory,
                preparation_state: row.preparation_state,
                is_organic: row.is_organic,
                properties: row.properties
            };
            
            // Add protocol compliance with gentle language
            if (row.protocol_compliance && row.protocol_compliance.length > 0) {
                food.protocol_status = row.protocol_compliance.map(compliance => ({
                    protocol_name: compliance.protocol_name,
                    status: compliance.status,
                    phase: compliance.phase,
                    notes: compliance.notes,
                    // Add gentle language following correlation insights pattern
                    display_message: getProtocolDisplayMessage(compliance.status, compliance.protocol_name, compliance.notes),
                    icon: getProtocolIcon(compliance.status)
                }));
            } else if (userProtocols.length > 0) {
                // User has protocols but this food has no rules - show as unknown
                food.protocol_status = userProtocols.map(protocol => ({
                    protocol_name: protocol.protocol_name,
                    status: 'unknown',
                    display_message: `🔍 Not yet evaluated for your ${protocol.protocol_name} protocol`,
                    icon: '🔍'
                }));
            }
            
            return food;
        });
        
        return successResponse({
            foods,
            total: foods.length,
            search_term: search,
            user_protocols: userProtocols.map(p => p.protocol_name)
        });
        
    } catch (error) {
        console.error('Error in handleSearchFoods:', error);
        const appError = handleDatabaseError(error, 'search foods');
        return errorResponse(appError.message, appError.statusCode);
    }
};

const handleGetProtocolFoods = async (queryParams, event) => {
    try {
        const protocol_id = queryParams.protocol_id || queryParams.dietary_protocol_id;
        
        if (!protocol_id) {
            return errorResponse('protocol_id parameter is required', 400);
        }
        
        const client = await pool.connect();
        
        const query = `
            SELECT 
                mfs.food_id as id,
                mfs.display_name as name,
                mfs.category_name as category,
                mfs.subcategory_name as subcategory,
                mfs.preparation_state,
                mfs.is_organic,
                mfs.properties,
                COALESCE(pfr.status, 'unknown') as protocol_status,
                pfr.phase,
                pfr.notes,
                p.name as protocol_name
            FROM mat_food_search mfs
            LEFT JOIN protocol_food_rules pfr ON mfs.food_id = pfr.food_id AND pfr.protocol_id = $1
            LEFT JOIN protocols p ON pfr.protocol_id = p.id
            ORDER BY 
                CASE 
                    WHEN pfr.status = 'allowed' THEN 1
                    WHEN pfr.status = 'moderation' THEN 2
                    WHEN pfr.status = 'conditional' THEN 3
                    WHEN pfr.status = 'reintroduction' THEN 4
                    WHEN pfr.status = 'avoid' THEN 5
                    ELSE 6
                END,
                mfs.category_name ASC,
                mfs.display_name ASC
            LIMIT 200
        `;
        
        const result = await client.query(query, [protocol_id]);
        client.release();
        
        // Group by category and status for frontend
        const foodsByCategory = {};
        const foodsByStatus = {
            allowed: [],
            moderation: [],
            conditional: [],
            reintroduction: [],
            avoid: [],
            unknown: []
        };
        
        result.rows.forEach(row => {
            const food = {
                id: row.id,
                name: row.name,
                category: row.category,
                subcategory: row.subcategory,
                preparation_state: row.preparation_state,
                is_organic: row.is_organic,
                properties: row.properties,
                protocol_status: row.protocol_status,
                phase: row.phase,
                notes: row.notes,
                display_message: getProtocolDisplayMessage(row.protocol_status, row.protocol_name, row.notes),
                icon: getProtocolIcon(row.protocol_status)
            };
            
            const category = row.category || 'Other';
            const status = row.protocol_status || 'unknown';
            
            // Group by category
            if (!foodsByCategory[category]) {
                foodsByCategory[category] = [];
            }
            foodsByCategory[category].push(food);
            
            // Group by status
            foodsByStatus[status].push(food);
        });
        
        return successResponse({
            foods: result.rows,
            foods_by_category: foodsByCategory,
            foods_by_status: foodsByStatus,
            compliance_stats: {
                total: result.rows.length,
                allowed: foodsByStatus.allowed.length,
                moderation: foodsByStatus.moderation.length,
                conditional: foodsByStatus.conditional.length,
                reintroduction: foodsByStatus.reintroduction.length,
                avoid: foodsByStatus.avoid.length,
                unknown: foodsByStatus.unknown.length
            },
            protocol_id
        });
        
    } catch (error) {
        console.error('Error in handleGetProtocolFoods:', error);
        const appError = handleDatabaseError(error, 'fetch protocol foods');
        return errorResponse(appError.message, appError.statusCode);
    }
};

// Helper function to generate gentle protocol display messages
function getProtocolDisplayMessage(status, protocolName, notes) {
    const protocol = protocolName || 'your protocol';
    
    switch (status) {
        case 'allowed':
            return `💡 Generally recommended on your ${protocol}`;
        case 'avoid':
            return `🔍 Not typically included in your ${protocol}`;
        case 'moderation':
            return `⚠️ Consider limiting on your ${protocol}`;
        case 'conditional':
            return notes 
                ? `🔍 Your ${protocol} suggests: ${notes}`
                : `🔍 May be suitable for your ${protocol} under certain conditions`;
        case 'reintroduction':
            return `🔄 Available for reintroduction in your ${protocol}`;
        case 'unknown':
        default:
            return `🔍 Not yet evaluated for your ${protocol}`;
    }
}

// Helper function to get protocol status icons
function getProtocolIcon(status) {
    switch (status) {
        case 'allowed':
            return '💡';
        case 'avoid':
            return '🔍';
        case 'moderation':
            return '⚠️';
        case 'conditional':
            return '🔍';
        case 'reintroduction':
            return '🔄';
        case 'unknown':
        default:
            return '🔍';
    }
}

module.exports = {
    handleSearchFoods,
    handleGetProtocolFoods
};
