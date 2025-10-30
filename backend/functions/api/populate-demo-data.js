const { pool } = require('./database/connection');

exports.handler = async (event) => {
    try {
        const sarah_id = '8e8a568a-c2f8-43a8-abf2-4e54408dbdc0';
        const mike_id = 'bb5c54ee-0304-4e7b-8ad4-b464f5b1e37f';
        
        // Clear old data
        await pool.query('DELETE FROM timeline_entries WHERE user_id IN ($1, $2)', [sarah_id, mike_id]);
        console.log('🗑️  Cleared old timeline entries');
        
        const entries = [];
        const baseDate = new Date();
        baseDate.setDate(baseDate.getDate() - 60);
        
        // Create 60 days of pattern data
        for (let day = 0; day < 60; day++) {
            const currentDate = new Date(baseDate);
            currentDate.setDate(baseDate.getDate() + day);
            
            if (day % 7 !== 0) { // Skip some days for realism
                
                // SARAH (AIP) - Morning routine
                entries.push({
                    user_id: sarah_id,
                    date: currentDate.toISOString().split('T')[0],
                    time: '07:30:00',
                    type: 'supplement',
                    content: {name: 'Bone Broth Collagen', type: 'supplement', notes: 'Morning gut healing'}
                });
                
                // Safe breakfast
                const safeBreakfast = ['Chicken Breast', 'Sweet Potato', 'Avocado'][Math.floor(Math.random() * 3)];
                entries.push({
                    user_id: sarah_id,
                    date: currentDate.toISOString().split('T')[0],
                    time: '08:00:00',
                    type: 'food',
                    content: {food_name: safeBreakfast, category: 'safe', protocol_compliance: 'included'}
                });
                
                // Nightshade triggers (every 8 days) - creates clear pattern
                if (day % 8 === 0) {
                    entries.push({
                        user_id: sarah_id,
                        date: currentDate.toISOString().split('T')[0],
                        time: '12:30:00',
                        type: 'food',
                        content: {food_name: 'Tomatoes', category: 'nightshade', protocol_compliance: 'avoid'}
                    });
                    entries.push({
                        user_id: sarah_id,
                        date: currentDate.toISOString().split('T')[0],
                        time: '15:00:00',
                        type: 'symptom',
                        content: {symptom_name: 'joint pain', severity: 7, context: 'post_meal'}
                    });
                }
                
                // High oxalate triggers (every 10 days) - creates pattern
                if (day % 10 === 0) {
                    entries.push({
                        user_id: sarah_id,
                        date: currentDate.toISOString().split('T')[0],
                        time: '13:00:00',
                        type: 'food',
                        content: {food_name: 'Spinach, raw', category: 'leafy_green', protocol_compliance: 'caution'}
                    });
                    entries.push({
                        user_id: sarah_id,
                        date: currentDate.toISOString().split('T')[0],
                        time: '16:30:00',
                        type: 'symptom',
                        content: {symptom_name: 'headache', severity: 6, context: 'afternoon'}
                    });
                }
                
                // High lectin triggers (every 12 days)
                if (day % 12 === 0) {
                    entries.push({
                        user_id: sarah_id,
                        date: currentDate.toISOString().split('T')[0],
                        time: '14:00:00',
                        type: 'food',
                        content: {food_name: 'Black Beans', category: 'legume', protocol_compliance: 'avoid'}
                    });
                    entries.push({
                        user_id: sarah_id,
                        date: currentDate.toISOString().split('T')[0],
                        time: '17:00:00',
                        type: 'symptom',
                        content: {symptom_name: 'joint pain', severity: 8, context: 'post_meal'}
                    });
                }
                
                // Helpful supplements
                if (day % 3 === 0) {
                    entries.push({
                        user_id: sarah_id,
                        date: currentDate.toISOString().split('T')[0],
                        time: '20:00:00',
                        type: 'supplement',
                        content: {name: 'Magnesium Glycinate 400mg', type: 'supplement', notes: 'Better sleep and inflammation'}
                    });
                }
                
                // Sleep quality tracking
                const sleepQuality = (day % 8 === 0) ? 4 : 8; // Poor sleep after triggers
                entries.push({
                    user_id: sarah_id,
                    date: currentDate.toISOString().split('T')[0],
                    time: '22:00:00',
                    type: 'sleep',
                    content: {quality: sleepQuality, hours: 7.5, notes: 'Sleep tracking'}
                });
            }
            
            // MIKE (FODMAP) data
            if (day % 7 !== 1) {
                
                // Morning probiotic
                entries.push({
                    user_id: mike_id,
                    date: currentDate.toISOString().split('T')[0],
                    time: '07:00:00',
                    type: 'supplement',
                    content: {name: 'Probiotics 50B CFU', type: 'supplement', notes: 'Gut health support'}
                });
                
                // Safe breakfast
                const safeBreakfast = ['White Rice', 'Chicken Breast', 'Blueberries'][Math.floor(Math.random() * 3)];
                entries.push({
                    user_id: mike_id,
                    date: currentDate.toISOString().split('T')[0],
                    time: '08:30:00',
                    type: 'food',
                    content: {food_name: safeBreakfast, category: 'safe', protocol_compliance: 'included'}
                });
                
                // FODMAP triggers (every 6 days) - creates clear pattern
                if (day % 6 === 0) {
                    entries.push({
                        user_id: mike_id,
                        date: currentDate.toISOString().split('T')[0],
                        time: '12:00:00',
                        type: 'food',
                        content: {food_name: 'Onions', category: 'high_fodmap', protocol_compliance: 'avoid'}
                    });
                    entries.push({
                        user_id: mike_id,
                        date: currentDate.toISOString().split('T')[0],
                        time: '14:00:00',
                        type: 'symptom',
                        content: {symptom_name: 'bloating', severity: 8, context: 'post_meal'}
                    });
                    entries.push({
                        user_id: mike_id,
                        date: currentDate.toISOString().split('T')[0],
                        time: '15:30:00',
                        type: 'symptom',
                        content: {symptom_name: 'digestive issues', severity: 7, context: 'afternoon'}
                    });
                }
                
                // Garlic triggers (every 9 days)
                if (day % 9 === 0) {
                    entries.push({
                        user_id: mike_id,
                        date: currentDate.toISOString().split('T')[0],
                        time: '18:00:00',
                        type: 'food',
                        content: {food_name: 'Garlic', category: 'high_fodmap', protocol_compliance: 'avoid'}
                    });
                    // Next day symptoms
                    const nextDay = new Date(currentDate);
                    nextDay.setDate(currentDate.getDate() + 1);
                    entries.push({
                        user_id: mike_id,
                        date: nextDay.toISOString().split('T')[0],
                        time: '09:00:00',
                        type: 'symptom',
                        content: {symptom_name: 'digestive issues', severity: 6, context: 'morning'}
                    });
                }
                
                // Helpful digestive enzymes
                if (day % 4 === 0) {
                    entries.push({
                        user_id: mike_id,
                        date: currentDate.toISOString().split('T')[0],
                        time: '19:00:00',
                        type: 'supplement',
                        content: {name: 'Digestive Enzymes', type: 'supplement', notes: 'Helps with digestion'}
                    });
                }
                
                // Stress affects symptoms (every 12 days)
                if (day % 12 === 0) {
                    entries.push({
                        user_id: mike_id,
                        date: currentDate.toISOString().split('T')[0],
                        time: '16:00:00',
                        type: 'stress',
                        content: {level: 8, context: 'work_deadline', notes: 'High stress day'}
                    });
                    // Amplified symptoms
                    entries.push({
                        user_id: mike_id,
                        date: currentDate.toISOString().split('T')[0],
                        time: '17:00:00',
                        type: 'symptom',
                        content: {symptom_name: 'digestive issues', severity: 9, context: 'stress_related'}
                    });
                }
                
                // Energy tracking
                const energyLevel = (day % 6 === 0) ? 3 : 7; // Low energy after FODMAP triggers
                entries.push({
                    user_id: mike_id,
                    date: currentDate.toISOString().split('T')[0],
                    time: '18:00:00',
                    type: 'energy',
                    content: {level: energyLevel, context: 'evening', notes: 'Energy tracking'}
                });
            }
        }
        
        console.log(`💾 Inserting ${entries.length} timeline entries...`);
        
        // Insert entries in batches
        for (const entry of entries) {
            const entryId = require('crypto').randomUUID();
            await pool.query(`
                INSERT INTO timeline_entries (
                    id, user_id, entry_date, entry_time, entry_type, structured_content, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [
                entryId,
                entry.user_id,
                entry.date,
                entry.time,
                entry.type,
                JSON.stringify(entry.content),
                new Date()
            ]);
        }
        
        // Verify data
        const result = await pool.query('SELECT entry_type, COUNT(*) FROM timeline_entries GROUP BY entry_type ORDER BY COUNT(*) DESC');
        console.log('📊 Timeline entry distribution:');
        result.rows.forEach(row => {
            console.log(`  ${row.entry_type}: ${row.count} entries`);
        });
        
        const sarahCount = await pool.query('SELECT COUNT(*) FROM timeline_entries WHERE user_id = $1', [sarah_id]);
        const mikeCount = await pool.query('SELECT COUNT(*) FROM timeline_entries WHERE user_id = $1', [mike_id]);
        
        console.log('👥 User data:');
        console.log(`  Sarah (AIP): ${sarahCount.rows[0].count} entries`);
        console.log(`  Mike (FODMAP): ${mikeCount.rows[0].count} entries`);
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Demo data created successfully',
                totalEntries: entries.length,
                sarahEntries: sarahCount.rows[0].count,
                mikeEntries: mikeCount.rows[0].count,
                entryTypes: result.rows
            })
        };
        
    } catch (error) {
        console.error('Error creating demo data:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
