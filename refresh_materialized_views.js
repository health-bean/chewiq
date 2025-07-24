// refresh_materialized_views.js - Script to check and refresh materialized views
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

async function checkAndRefreshMaterializedViews() {
    const client = await pool.connect();
    try {
        console.log('Connected to database successfully');
        
        // Check if materialized views exist
        console.log('\n--- CHECKING MATERIALIZED VIEWS ---');
        const views = ['mat_food_search', 'mat_protocol_foods'];
        
        for (const view of views) {
            try {
                const result = await client.query(`
                    SELECT EXISTS (
                        SELECT FROM pg_matviews
                        WHERE matviewname = $1
                    )
                `, [view]);
                
                const exists = result.rows[0].exists;
                console.log(`Materialized view ${view}: ${exists ? 'EXISTS' : 'MISSING'}`);
                
                if (exists) {
                    // Check row count before refresh
                    const countResult = await client.query(`SELECT COUNT(*) FROM ${view}`);
                    console.log(`  - Row count before refresh: ${countResult.rows[0].count}`);
                    
                    // Refresh the view
                    console.log(`  - Refreshing ${view}...`);
                    await client.query(`REFRESH MATERIALIZED VIEW ${view}`);
                    
                    // Check row count after refresh
                    const newCountResult = await client.query(`SELECT COUNT(*) FROM ${view}`);
                    console.log(`  - Row count after refresh: ${newCountResult.rows[0].count}`);
                    
                    // Sample data
                    console.log(`  - Sample data from ${view}:`);
                    const sampleResult = await client.query(`SELECT * FROM ${view} LIMIT 3`);
                    console.log(sampleResult.rows);
                } else {
                    console.log(`  - Cannot refresh ${view} because it doesn't exist`);
                }
            } catch (err) {
                console.error(`Error with materialized view ${view}:`, err.message);
            }
        }
        
        // Check column names in materialized views
        console.log('\n--- CHECKING MATERIALIZED VIEW COLUMNS ---');
        for (const view of views) {
            try {
                const result = await client.query(`
                    SELECT column_name, data_type 
                    FROM information_schema.columns 
                    WHERE table_schema = 'public' 
                    AND table_name = $1
                `, [view]);
                
                if (result.rows.length > 0) {
                    console.log(`Columns in ${view}:`);
                    result.rows.forEach(row => {
                        console.log(`  - ${row.column_name} (${row.data_type})`);
                    });
                } else {
                    console.log(`No columns found for view ${view}`);
                }
            } catch (err) {
                console.error(`Error checking columns for ${view}:`, err.message);
            }
        }
        
        // Check if the column names match what's expected in the code
        console.log('\n--- CHECKING FOR COLUMN NAME MISMATCHES ---');
        try {
            // Check mat_protocol_foods for dietary_protocol_id column
            const protocolIdResult = await client.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.columns 
                    WHERE table_schema = 'public' 
                    AND table_name = 'mat_protocol_foods'
                    AND column_name = 'dietary_protocol_id'
                ) as has_dietary_protocol_id,
                EXISTS (
                    SELECT FROM information_schema.columns 
                    WHERE table_schema = 'public' 
                    AND table_name = 'mat_protocol_foods'
                    AND column_name = 'protocol_id'
                ) as has_protocol_id
            `);
            
            const hasDietaryProtocolId = protocolIdResult.rows[0].has_dietary_protocol_id;
            const hasProtocolId = protocolIdResult.rows[0].has_protocol_id;
            
            console.log(`mat_protocol_foods has dietary_protocol_id: ${hasDietaryProtocolId}`);
            console.log(`mat_protocol_foods has protocol_id: ${hasProtocolId}`);
            
            if (!hasDietaryProtocolId && hasProtocolId) {
                console.log('⚠️ MISMATCH: Code is looking for dietary_protocol_id but database has protocol_id');
                console.log('This could be causing your search issues!');
            }
            
            // Check mat_food_search for food_id column
            const foodIdResult = await client.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.columns 
                    WHERE table_schema = 'public' 
                    AND table_name = 'mat_food_search'
                    AND column_name = 'food_id'
                ) as has_food_id,
                EXISTS (
                    SELECT FROM information_schema.columns 
                    WHERE table_schema = 'public' 
                    AND table_name = 'mat_food_search'
                    AND column_name = 'simplified_food_id'
                ) as has_simplified_food_id
            `);
            
            const hasFoodId = foodIdResult.rows[0].has_food_id;
            const hasSimplifiedFoodId = foodIdResult.rows[0].has_simplified_food_id;
            
            console.log(`mat_food_search has food_id: ${hasFoodId}`);
            console.log(`mat_food_search has simplified_food_id: ${hasSimplifiedFoodId}`);
            
            if (!hasFoodId && hasSimplifiedFoodId) {
                console.log('⚠️ MISMATCH: Code is looking for food_id but database has simplified_food_id');
                console.log('This could be causing your search issues!');
            }
        } catch (err) {
            console.error('Error checking for column mismatches:', err.message);
        }
        
    } catch (err) {
        console.error('Database connection error:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

checkAndRefreshMaterializedViews().catch(console.error);

checkAndRefreshMaterializedViews().catch(console.error);
