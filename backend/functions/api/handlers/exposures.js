const { pool } = require('../database/connection');
const { successResponse, errorResponse } = require('../utils/responses');
const { handleDatabaseError } = require('../utils/errors');

const handleSearchExposures = async (queryParams, event) => {
    try {
        const client = await pool.connect();
        const { search = '', limit = 10, prioritize_user_history = 'true' } = queryParams;
        const userId = event.user?.id;
        
        let exposures = [];
        
        // If prioritizing user history and user is authenticated
        if (prioritize_user_history === 'true' && userId) {
            // First get user's exposure history
            const userHistoryQuery = `
                SELECT DISTINCT
                    NULL as id,
                    LOWER(TRIM(content)) as name,
                    'Personal History' as category,
                    'user_history' as source,
                    COUNT(*) as frequency
                FROM timeline_entries
                WHERE user_id = $1 
                  AND entry_type = 'exposure'
                  AND LOWER(TRIM(content)) ILIKE $2
                GROUP BY LOWER(TRIM(content))
                ORDER BY frequency DESC, name ASC
                LIMIT $3
            `;
            
            const searchPattern = `%${search.toLowerCase()}%`;
            const userResult = await client.query(userHistoryQuery, [userId, searchPattern, Math.floor(limit / 2)]);
            
            exposures = userResult.rows.map(row => ({
                id: `user_${row.name}`,
                name: row.name,
                category: row.category,
                description: `You've logged this ${row.frequency} time${row.frequency > 1 ? 's' : ''}`,
                source: 'user_history',
                frequency: row.frequency
            }));
        }
        
        // Then get from exposure_types database (if it exists, otherwise create common exposures)
        const dbQuery = `
            SELECT 
                id,
                name,
                category,
                description
            FROM exposure_types
            WHERE (name ILIKE $1 
               OR description ILIKE $1)
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
        const remainingLimit = limit - exposures.length;
        const values = [searchPattern, exactMatch, remainingLimit];
        
        let dbResult;
        try {
            dbResult = await client.query(dbQuery, values);
        } catch (error) {
            // If exposure_types table doesn't exist, create common exposures
            console.log('exposure_types table not found, using common exposures');
            const commonExposures = [
                { id: 1, name: 'pollen', category: 'Environmental', description: 'Tree, grass, or weed pollen' },
                { id: 2, name: 'dust', category: 'Environmental', description: 'House dust or dust mites' },
                { id: 3, name: 'mold', category: 'Environmental', description: 'Indoor or outdoor mold exposure' },
                { id: 4, name: 'pet_dander', category: 'Environmental', description: 'Cat, dog, or other pet dander' },
                { id: 5, name: 'smoke', category: 'Environmental', description: 'Cigarette, wildfire, or other smoke' },
                { id: 6, name: 'perfume', category: 'Chemical', description: 'Perfume, cologne, or fragrances' },
                { id: 7, name: 'cleaning_products', category: 'Chemical', description: 'Household cleaning chemicals' },
                { id: 8, name: 'paint_fumes', category: 'Chemical', description: 'Paint or solvent fumes' },
                { id: 9, name: 'air_pollution', category: 'Environmental', description: 'Outdoor air pollution or smog' },
                { id: 10, name: 'latex', category: 'Material', description: 'Latex gloves or products' }
            ];
            
            dbResult = {
                rows: commonExposures.filter(exposure => 
                    exposure.name.toLowerCase().includes(search.toLowerCase()) ||
                    exposure.description.toLowerCase().includes(search.toLowerCase())
                ).slice(0, remainingLimit)
            };
        }
        
        // Add database results, avoiding duplicates
        const userExposureNames = new Set(exposures.map(e => e.name.toLowerCase()));
        const dbExposures = dbResult.rows
            .filter(row => !userExposureNames.has(row.name.toLowerCase()))
            .map(row => ({
                ...row,
                source: 'database'
            }));
        
        exposures = [...exposures, ...dbExposures];
        
        client.release();
        
        return successResponse({
            exposures: exposures,
            total: exposures.length,
            search_term: search,
            user_history_included: prioritize_user_history === 'true' && userId
        });
        
    } catch (error) {
        const appError = handleDatabaseError(error, 'search exposures');
        return errorResponse(appError.message, appError.statusCode);
    }
};

module.exports = {
    handleSearchExposures
};
