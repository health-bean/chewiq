const { pool } = require('../database/connection');
const { successResponse, errorResponse } = require('../utils/responses');
const { handleDatabaseError } = require('../utils/errors');

const handleSearchSupplements = async (queryParams, event) => {
    try {
        const client = await pool.connect();
        const { search = '', limit = 10, prioritize_user_history = 'true' } = queryParams;
        const userId = event.user?.id;
        
        let supplements = [];
        
        // If prioritizing user history and user is authenticated
        if (prioritize_user_history === 'true' && userId) {
            // First get user's supplement history
            const userHistoryQuery = `
                SELECT DISTINCT
                    NULL as id,
                    LOWER(TRIM(content)) as name,
                    'Personal History' as category,
                    'user_history' as source,
                    COUNT(*) as frequency
                FROM timeline_entries
                WHERE user_id = $1 
                  AND entry_type = 'supplement'
                  AND LOWER(TRIM(content)) ILIKE $2
                GROUP BY LOWER(TRIM(content))
                ORDER BY frequency DESC, name ASC
                LIMIT $3
            `;
            
            const searchPattern = `%${search.toLowerCase()}%`;
            const userResult = await client.query(userHistoryQuery, [userId, searchPattern, Math.floor(limit / 2)]);
            
            supplements = userResult.rows.map(row => ({
                id: `user_${row.name}`,
                name: row.name,
                category: row.category,
                description: `You've logged this ${row.frequency} time${row.frequency > 1 ? 's' : ''}`,
                source: 'user_history',
                frequency: row.frequency
            }));
        }
        
        // Then get from supplements database
        const dbQuery = `
            SELECT 
                id,
                name,
                category,
                description,
                synonyms
            FROM supplements_database
            WHERE (name ILIKE $1 
               OR $2 = ANY(synonyms)
               OR description ILIKE $1)
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
        const remainingLimit = limit - supplements.length;
        const values = [searchPattern, search, exactMatch, remainingLimit];
        
        const dbResult = await client.query(dbQuery, values);
        
        // Add database results, avoiding duplicates
        const userSupplementNames = new Set(supplements.map(s => s.name.toLowerCase()));
        const dbSupplements = dbResult.rows
            .filter(row => !userSupplementNames.has(row.name.toLowerCase()))
            .map(row => ({
                ...row,
                source: 'database'
            }));
        
        supplements = [...supplements, ...dbSupplements];
        
        client.release();
        
        return successResponse({
            supplements: supplements,
            total: supplements.length,
            search_term: search,
            user_history_included: prioritize_user_history === 'true' && userId
        });
        
    } catch (error) {
        const appError = handleDatabaseError(error, 'search supplements');
        return errorResponse(appError.message, appError.statusCode);
    }
};

module.exports = {
    handleSearchSupplements
};
