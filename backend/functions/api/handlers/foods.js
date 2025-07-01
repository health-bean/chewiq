const { pool } = require('../database/connection');
const { successResponse, errorResponse } = require('../utils/responses');
const { handleDatabaseError } = require('../utils/errors');

const handleSearchFoods = async (queryParams, event) => {
    try {
        const client = await pool.connect();
        const { search = '', protocol_id = null } = queryParams;
        
        let query = `
            SELECT 
                fp.id,
                fp.name,
                fp.category,
                fp.nightshade,
                fp.histamine,
                fp.oxalate,
                fp.lectin,
                fp.fodmap,
                fp.salicylate
        `;
        
        if (protocol_id) {
            query += `,
                p.protocol_type,
                p.category as protocol_category,
                COALESCE(pfr.status, 'unknown') as protocol_status,
                pfr.phase as protocol_phase,
                pfr.notes as protocol_notes
            FROM food_properties fp
            JOIN protocols p ON p.id = $2
            LEFT JOIN protocol_food_rules pfr ON fp.id = pfr.food_id AND pfr.protocol_id = $2
            WHERE fp.name ILIKE $1
            ORDER BY fp.name ASC
            LIMIT 50
            `;
        } else {
            query += `
            FROM food_properties fp
            WHERE fp.name ILIKE $1
            ORDER BY fp.name ASC
            LIMIT 50
            `;
        }
        
        const values = protocol_id ? [`%${search}%`, protocol_id] : [`%${search}%`];
        const result = await client.query(query, values);
        client.release();
        
        return successResponse({
            foods: result.rows,
            total: result.rows.length,
            search_term: search,
            protocol_id: protocol_id
        });
        
    } catch (error) {
        const appError = handleDatabaseError(error, 'search foods');
        return errorResponse(appError.message, appError.statusCode);
    }
};

const handleGetProtocolFoods = async (queryParams, event) => {
    return successResponse({
        test: "Protocol foods function is working",
        received_protocol_id: queryParams.protocol_id || "none"
    });
};

module.exports = {
    handleSearchFoods,
    handleGetProtocolFoods
};
