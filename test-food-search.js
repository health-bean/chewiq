// test-food-search.js - Script to test food search functionality
require('dotenv').config();
const { Pool } = require('pg');

// Create a connection pool with SSL enabled but not verifying certificates
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: {
        rejectUnauthorized: false // Accept self-signed certificates
    }
});

async function testFoodSearch() {
    const client = await pool.connect();
    try {
        console.log('Connected to database successfully');
        
        // Test search for "chicken" with different column names
        const searchTerm = 'chicken';
        const searchPattern = `%${searchTerm}%`;
        
        // Test 1: Check if mat_food_search has data
        console.log('\n--- CHECKING MAT_FOOD_SEARCH DATA ---');
        try {
            const countResult = await client.query('SELECT COUNT(*) FROM mat_food_search');
            console.log(`Total rows in mat_food_search: ${countResult.rows[0].count}`);
            
            // Get column names
            const columnsResult = await client.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'mat_food_search'
            `);
            
            console.log('Column names in mat_food_search:');
            columnsResult.rows.forEach(row => {
                console.log(`  - ${row.column_name}`);
            });
            
            // Try to find chicken in display_name
            const searchResult = await client.query(`
                SELECT * FROM mat_food_search 
                WHERE display_name ILIKE $1 
                LIMIT 5
            `, [searchPattern]);
            
            console.log(`\nSearch results for "chicken" in display_name (${searchResult.rows.length} results):`);
            searchResult.rows.forEach(row => {
                console.log(`  - ${row.display_name || row.food_name}`);
            });
            
            // Try direct search with LIKE
            const directSearchResult = await client.query(`
                SELECT * FROM mat_food_search 
                WHERE display_name LIKE '%chicken%' 
                LIMIT 5
            `);
            
            console.log(`\nDirect search results for "chicken" (${directSearchResult.rows.length} results):`);
            directSearchResult.rows.forEach(row => {
                console.log(`  - ${row.display_name || row.food_name}`);
            });
            
            // Try case-insensitive search
            const caseInsensitiveResult = await client.query(`
                SELECT * FROM mat_food_search 
                WHERE LOWER(display_name) LIKE LOWER('%chicken%') 
                LIMIT 5
            `);
            
            console.log(`\nCase-insensitive search results (${caseInsensitiveResult.rows.length} results):`);
            caseInsensitiveResult.rows.forEach(row => {
                console.log(`  - ${row.display_name || row.food_name}`);
            });
            
            // Try searching all text columns
            console.log('\n--- SEARCHING ALL TEXT COLUMNS FOR "CHICKEN" ---');
            for (const column of columnsResult.rows) {
                if (column.column_name !== 'display_name') {
                    try {
                        const colSearchResult = await client.query(`
                            SELECT COUNT(*) FROM mat_food_search 
                            WHERE ${column.column_name}::text ILIKE $1
                        `, [searchPattern]);
                        
                        if (colSearchResult.rows[0].count > 0) {
                            console.log(`Found ${colSearchResult.rows[0].count} matches in column ${column.column_name}`);
                            
                            // Show examples
                            const examples = await client.query(`
                                SELECT display_name, ${column.column_name} FROM mat_food_search 
                                WHERE ${column.column_name}::text ILIKE $1
                                LIMIT 3
                            `, [searchPattern]);
                            
                            examples.rows.forEach(row => {
                                console.log(`  - ${row.display_name}: ${row[column.column_name]}`);
                            });
                        }
                    } catch (err) {
                        // Skip columns that can't be cast to text
                    }
                }
            }
        } catch (err) {
            console.error('Error testing mat_food_search:', err.message);
        }
        
        // Test 2: Check if mat_protocol_foods has data
        console.log('\n--- CHECKING MAT_PROTOCOL_FOODS DATA ---');
        try {
            const countResult = await client.query('SELECT COUNT(*) FROM mat_protocol_foods');
            console.log(`Total rows in mat_protocol_foods: ${countResult.rows[0].count}`);
            
            if (countResult.rows[0].count === 0) {
                console.log('⚠️ mat_protocol_foods has 0 rows! This is likely why protocol-specific searches fail.');
                
                // Check if the view definition is correct
                console.log('\nChecking mat_protocol_foods definition:');
                const viewDefResult = await client.query(`
                    SELECT pg_get_viewdef('mat_protocol_foods'::regclass, true) as view_def
                `);
                console.log(viewDefResult.rows[0].view_def);
                
                // Check if source tables have data
                console.log('\nChecking source tables for mat_protocol_foods:');
                const protocolsCount = await client.query('SELECT COUNT(*) FROM protocols');
                console.log(`protocols table has ${protocolsCount.rows[0].count} rows`);
                
                const simplifiedFoodsCount = await client.query('SELECT COUNT(*) FROM simplified_foods');
                console.log(`simplified_foods table has ${simplifiedFoodsCount.rows[0].count} rows`);
                
                const protocolFoodRulesCount = await client.query('SELECT COUNT(*) FROM protocol_food_rules');
                console.log(`protocol_food_rules table has ${protocolFoodRulesCount.rows[0].count} rows`);
            } else {
                // Get column names
                const columnsResult = await client.query(`
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_schema = 'public' 
                    AND table_name = 'mat_protocol_foods'
                `);
                
                console.log('Column names in mat_protocol_foods:');
                columnsResult.rows.forEach(row => {
                    console.log(`  - ${row.column_name}`);
                });
                
                // Try to find chicken
                const searchResult = await client.query(`
                    SELECT * FROM mat_protocol_foods 
                    WHERE food_name ILIKE $1 
                    LIMIT 5
                `, [searchPattern]);
                
                console.log(`\nSearch results for "chicken" in food_name (${searchResult.rows.length} results):`);
                searchResult.rows.forEach(row => {
                    console.log(`  - ${row.food_name} (Protocol: ${row.protocol_name}, Status: ${row.protocol_status})`);
                });
            }
        } catch (err) {
            console.error('Error testing mat_protocol_foods:', err.message);
        }
        
        // Test 3: Try the exact query from the handler
        console.log('\n--- TESTING EXACT QUERY FROM HANDLER ---');
        try {
            // Test with a known protocol ID
            const protocolsResult = await client.query('SELECT id FROM protocols LIMIT 1');
            if (protocolsResult.rows.length > 0) {
                const protocolId = protocolsResult.rows[0].id;
                console.log(`Using protocol ID: ${protocolId}`);
                
                const query = `
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
                
                const result = await client.query(query, [searchPattern, protocolId]);
                
                console.log(`Query returned ${result.rows.length} results`);
                result.rows.forEach(row => {
                    console.log(`  - ${row.name} (${row.category}, Status: ${row.protocol_status})`);
                });
                
                if (result.rows.length === 0) {
                    // Try without protocol filter
                    console.log('\nTrying without protocol filter:');
                    const noProtocolQuery = `
                        SELECT 
                            mpf.food_id as id,
                            mpf.food_name as name,
                            mpf.category_name as category,
                            mpf.protocol_status
                        FROM mat_protocol_foods mpf
                        WHERE mpf.food_name ILIKE $1
                        ORDER BY mpf.food_name ASC
                        LIMIT 10
                    `;
                    
                    const noProtocolResult = await client.query(noProtocolQuery, [searchPattern]);
                    
                    console.log(`Query returned ${noProtocolResult.rows.length} results`);
                    noProtocolResult.rows.forEach(row => {
                        console.log(`  - ${row.name} (${row.category}, Status: ${row.protocol_status})`);
                    });
                }
            } else {
                console.log('No protocols found in the database');
            }
        } catch (err) {
            console.error('Error testing exact query:', err.message);
        }
        
    } catch (err) {
        console.error('Database connection error:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

testFoodSearch().catch(console.error);
