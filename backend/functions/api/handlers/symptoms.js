const { pool } = require('../database/connection');
const { successResponse, errorResponse } = require('../utils/responses');
const { handleDatabaseError } = require('../utils/errors');

const handleSearchSymptoms = async (queryParams, event) => {
    try {
        const client = await pool.connect();
        const { search = '', limit = 10 } = queryParams;
        
        const query = `
            SELECT 
                id,
                name,
                category,
                description,
                synonyms
            FROM symptoms_database
            WHERE name ILIKE $1 
               OR $2 = ANY(synonyms)
               OR description ILIKE $1
            AND is_active = true
            ORDER BY 
                CASE 
                    WHEN name ILIKE $3 THEN 1
                    WHEN $2 = ANY(synonyms) THEN 2
                    ELSE 3
                END,
                name ASC
            LIMIT $4
        `;
        
        const searchPattern = `%${search}%`;
        const exactMatch = `${search}%`;
        const values = [searchPattern, search, exactMatch, limit];
        
        const result = await client.query(query, values);
        client.release();
        
        return successResponse({
            symptoms: result.rows,
            total: result.rows.length,
            search_term: search
        });
        
    } catch (error) {
        const appError = handleDatabaseError(error, 'search symptoms');
        return errorResponse(appError.message, appError.statusCode);
    }
};

module.exports = {
    handleSearchSymptoms
};