// populateHealthData.js
// Creates 5 realistic users with different health profiles and 6 months of timeline data
// Each user has different sensitivities, protocols, and improvement patterns

const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

// Database connection
const pool = new Pool({
    host: 'health-platform-dev-db.c5njva4wrrhe.us-east-1.rds.amazonaws.com',
    port: 5432,
    database: 'health_platform_dev',
    user: 'healthadmin',
    password: 'TempPassword123!',
    ssl: {
        rejectUnauthorized: false
    }
});

// User profiles with different health journeys
const USER_PROFILES = [
    {
        id: uuidv4(),
        email: 'sarah.aip@test.com',
        firstName: 'Sarah',
        lastName: 'Johnson',
        role: 'patient',
        profile: {
            name: 'Sarah (AIP Protocol)',
            protocols: ['AIP Core'],
            sensitivities: {
                nightshades: { symptoms: ['joint pain', 'inflammation'], delay: [48, 72] },
                eggs: { symptoms: ['digestive issues'], delay: [12, 24] }
            },
            improvements: {
                'vitamin b12': { effects: ['reduced fatigue', 'better mood'], startDay: 30 },
                'turmeric': { effects: ['less inflammation'], startDay: 45 }
            },
            baseline: {
                energy: 4,
                mood: 5,
                pain: 6
            }
        }
    },
    {
        id: uuidv4(),
        email: 'mike.fodmap@test.com',
        firstName: 'Mike',
        lastName: 'Chen',
        role: 'patient',
        profile: {
            name: 'Mike (Low FODMAP)',
            protocols: ['Low FODMAP'],
            sensitivities: {
                'high_fodmap': { symptoms: ['digestive issues', 'bloating'], delay: [4, 12] },
                'dairy': { symptoms: ['digestive issues'], delay: [6, 18] }
            },
            improvements: {
                'probiotics': { effects: ['better digestion'], startDay: 21 },
                'bone broth': { effects: ['gut healing'], startDay: 35 }
            },
            baseline: {
                energy: 6,
                mood: 6,
                digestion: 3
            }
        }
    },
    {
        id: uuidv4(),
        email: 'lisa.histamine@test.com',
        firstName: 'Lisa',
        lastName: 'Rodriguez',
        role: 'patient',
        profile: {
            name: 'Lisa (Low Histamine)',
            protocols: ['Low Histamine'],
            sensitivities: {
                'high_histamine': { symptoms: ['headaches', 'skin issues'], delay: [2, 8] },
                'fermented_foods': { symptoms: ['headaches'], delay: [1, 4] }
            },
            improvements: {
                'vitamin c': { effects: ['fewer headaches'], startDay: 28 },
                'quercetin': { effects: ['reduced skin issues'], startDay: 40 }
            },
            baseline: {
                energy: 5,
                mood: 4,
                headaches: 7
            }
        }
    },
    {
        id: uuidv4(),
        email: 'john.paleo@test.com',
        firstName: 'John',
        lastName: 'Williams',
        role: 'patient',
        profile: {
            name: 'John (Paleo)',
            protocols: ['Paleo'],
            sensitivities: {
                'grains': { symptoms: ['fatigue', 'brain fog'], delay: [8, 24] },
                'dairy': { symptoms: ['congestion', 'inflammation'], delay: [12, 36] }
            },
            improvements: {
                'omega3': { effects: ['better focus', 'less inflammation'], startDay: 25 },
                'magnesium': { effects: ['better sleep', 'less anxiety'], startDay: 35 }
            },
            baseline: {
                energy: 5,
                mood: 5,
                focus: 4
            }
        }
    },
    {
        id: uuidv4(),
        email: 'emma.multi@test.com',
        firstName: 'Emma',
        lastName: 'Davis',
        role: 'patient',
        profile: {
            name: 'Emma (Multiple Protocols)',
            protocols: ['No Nightshades', 'Low Oxalate'],
            sensitivities: {
                'nightshades': { symptoms: ['joint pain', 'skin issues'], delay: [24, 48] },
                'high_oxalate': { symptoms: ['kidney stones risk', 'joint pain'], delay: [72, 120] }
            },
            improvements: {
                'calcium': { effects: ['better bone health'], startDay: 20 },
                'anti_inflammatory_herbs': { effects: ['less joint pain'], startDay: 50 }
            },
            baseline: {
                energy: 4,
                mood: 5,
                pain: 7
            }
        }
    }
];

// Symptom severity mapping
const SYMPTOM_SEVERITY = {
    'joint pain': [5, 8],
    'inflammation': [4, 7],
    'digestive issues': [4, 7],
    'bloating': [3, 6],
    'headaches': [5, 9],
    'skin issues': [3, 6],
    'fatigue': [6, 9],
    'brain fog': [4, 7],
    'congestion': [3, 5],
    'reduced fatigue': [2, 4],
    'better mood': [1, 3],
    'less inflammation': [2, 4],
    'better digestion': [1, 3],
    'gut healing': [1, 3],
    'fewer headaches': [1, 3],
    'reduced skin issues': [1, 3],
    'better focus': [1, 3],
    'less joint pain': [1, 3],
    'better sleep': [1, 3],
    'less anxiety': [1, 3]
};

// Load existing foods and protocols from database
async function loadDatabaseData() {
    try {
        console.log('📊 Loading existing database data...');
        
        // Load foods
        const foodsResult = await pool.query(`
            SELECT name, category, nightshade, histamine, oxalate, lectin 
            FROM food_properties 
            ORDER BY name
        `);
        
        // Load protocols
        const protocolsResult = await pool.query(`
            SELECT id, name, category 
            FROM protocols 
            ORDER BY name
        `);
        
        console.log(`✅ Loaded ${foodsResult.rows.length} foods and ${protocolsResult.rows.length} protocols`);
        
        return {
            foods: foodsResult.rows,
            protocols: protocolsResult.rows
        };
    } catch (error) {
        console.error('❌ Error loading database data:', error);
        throw error;
    }
}

// Create users in database
async function createUsers() {
    console.log('👥 Creating test users...');
    
    for (const user of USER_PROFILES) {
        try {
            await pool.query(`
                INSERT INTO users (id, email, first_name, last_name, role, created_at)
                VALUES ($1, $2, $3, $4, $5, NOW())
                ON CONFLICT (email) DO NOTHING
            `, [user.id, user.email, user.firstName, user.lastName, user.role]);
            
            console.log(`✅ Created user: ${user.firstName} ${user.lastName} (${user.email})`);
        } catch (error) {
            console.error(`❌ Error creating user ${user.email}:`, error);
        }
    }
}

// Generate timeline entries for a user on a specific day
function generateDayEntries(user, date, dayIndex, foods) {
    const entries = [];
    const profile = user.profile;
    
    // Base meal foods (breakfast, lunch, dinner)
    const baseFoods = foods.filter(f => 
        ['protein', 'vegetable', 'fruit'].includes(f.category)
    );
    
    // Morning entries (8-10 AM)
    const breakfastTime = `0${8 + Math.floor(Math.random() * 2)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`;
    const breakfastFoods = selectMealFoods(baseFoods, profile, 'breakfast');
    
    entries.push({
        user_id: user.id,
        entry_date: date.toISOString().split('T')[0],
        entry_time: breakfastTime,
        entry_type: 'food',
        content: breakfastFoods.join(', '),
        protocol_compliant: isProtocolCompliant(breakfastFoods, profile.protocols, foods)
    });
    
    // Lunch entries (12-2 PM)
    const lunchTime = `${12 + Math.floor(Math.random() * 2)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`;
    const lunchFoods = selectMealFoods(baseFoods, profile, 'lunch');
    
    entries.push({
        user_id: user.id,
        entry_date: date.toISOString().split('T')[0],
        entry_time: lunchTime,
        entry_type: 'food',
        content: lunchFoods.join(', '),
        protocol_compliant: isProtocolCompliant(lunchFoods, profile.protocols, foods)
    });
    
    // Dinner entries (6-8 PM)
    const dinnerTime = `${18 + Math.floor(Math.random() * 2)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`;
    const dinnerFoods = selectMealFoods(baseFoods, profile, 'dinner');
    
    entries.push({
        user_id: user.id,
        entry_date: date.toISOString().split('T')[0],
        entry_time: dinnerTime,
        entry_type: 'food',
        content: dinnerFoods.join(', '),
        protocol_compliant: isProtocolCompliant(dinnerFoods, profile.protocols, foods)
    });
    
    // Add supplements (if user has started them)
    Object.keys(profile.improvements).forEach(supplement => {
        const improvement = profile.improvements[supplement];
        if (dayIndex >= improvement.startDay) {
            const suppTime = `0${7 + Math.floor(Math.random() * 2)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`;
            
            entries.push({
                user_id: user.id,
                entry_date: date.toISOString().split('T')[0],
                entry_time: suppTime,
                entry_type: 'supplement',
                content: supplement,
                protocol_compliant: true
            });
        }
    });
    
    // Add trigger foods occasionally (creating sensitivity patterns)
    if (Math.random() > 0.7) { // 30% chance
        const triggerFoods = getTriggerFoods(profile, foods);
        if (triggerFoods.length > 0) {
            const triggerFood = triggerFoods[Math.floor(Math.random() * triggerFoods.length)];
            const triggerTime = `${15 + Math.floor(Math.random() * 4)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`;
            
            entries.push({
                user_id: user.id,
                entry_date: date.toISOString().split('T')[0],
                entry_time: triggerTime,
                entry_type: 'food',
                content: triggerFood,
                protocol_compliant: false
            });
        }
    }
    
    return entries;
}

// Generate symptom entries based on food triggers
function generateSymptomEntries(user, allEntries) {
    const symptomEntries = [];
    const profile = user.profile;
    
    // Get all food entries for this user
    const foodEntries = allEntries.filter(e => e.entry_type === 'food');
    
    foodEntries.forEach(foodEntry => {
        // Check if this food entry contains trigger foods
        Object.keys(profile.sensitivities).forEach(sensitivityKey => {
            const sensitivity = profile.sensitivities[sensitivityKey];
            
            if (foodContainsTrigger(foodEntry.content, sensitivityKey)) {
                // Generate symptoms with delay
                sensitivity.symptoms.forEach(symptom => {
                    // Random chance of symptom occurring (80% for strong correlations)
                    if (Math.random() > 0.2) {
                        const delayHours = sensitivity.delay[0] + Math.floor(Math.random() * (sensitivity.delay[1] - sensitivity.delay[0]));
                        const symptomDate = new Date(foodEntry.entry_date + 'T' + foodEntry.entry_time);
                        symptomDate.setHours(symptomDate.getHours() + delayHours);
                        
                        // Only add if within our date range
                        if (symptomDate <= new Date('2024-06-30')) {
                            const severity = SYMPTOM_SEVERITY[symptom] || [4, 7];
                            const symptomSeverity = severity[0] + Math.floor(Math.random() * (severity[1] - severity[0]));
                            
                            symptomEntries.push({
                                user_id: user.id,
                                entry_date: symptomDate.toISOString().split('T')[0],
                                entry_time: symptomDate.toTimeString().split(' ')[0],
                                entry_type: 'symptom',
                                content: symptom,
                                severity: symptomSeverity,
                                protocol_compliant: null
                            });
                        }
                    }
                });
            }
        });
    });
    
    return symptomEntries;
}

// Helper functions
function selectMealFoods(foods, profile, mealType) {
    // Select 2-4 foods for a meal, avoiding known triggers most of the time
    const selectedFoods = [];
    const availableFoods = foods.filter(f => !isTriggerFood(f.name, profile));
    
    const numFoods = 2 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < numFoods && i < availableFoods.length; i++) {
        const food = availableFoods[Math.floor(Math.random() * availableFoods.length)];
        if (!selectedFoods.includes(food.name)) {
            selectedFoods.push(food.name);
        }
    }
    
    return selectedFoods;
}

function getTriggerFoods(profile, foods) {
    const triggers = [];
    
    Object.keys(profile.sensitivities).forEach(sensitivityKey => {
        const matchingFoods = foods.filter(f => {
            switch (sensitivityKey) {
                case 'nightshades':
                    return f.nightshade === true;
                case 'high_histamine':
                    return f.histamine === 'high';
                case 'high_fodmap':
                    return ['onions', 'garlic', 'beans', 'wheat'].includes(f.name);
                case 'grains':
                    return f.category === 'grain';
                case 'dairy':
                    return ['milk', 'cheese', 'yogurt', 'butter'].includes(f.name);
                case 'eggs':
                    return f.name === 'eggs';
                case 'fermented_foods':
                    return ['sauerkraut', 'kimchi', 'kefir', 'aged cheese'].includes(f.name);
                case 'high_oxalate':
                    return f.oxalate === 'high';
                default:
                    return false;
            }
        });
        
        triggers.push(...matchingFoods.map(f => f.name));
    });
    
    return [...new Set(triggers)]; // Remove duplicates
}

function isTriggerFood(foodName, profile) {
    return Object.keys(profile.sensitivities).some(sensitivityKey => {
        switch (sensitivityKey) {
            case 'nightshades':
                return ['tomatoes', 'potatoes', 'bell peppers', 'eggplant'].includes(foodName);
            case 'high_histamine':
                return ['tuna', 'bacon', 'shellfish', 'aged cheese'].includes(foodName);
            case 'dairy':
                return ['milk', 'cheese', 'yogurt', 'butter'].includes(foodName);
            case 'eggs':
                return foodName === 'eggs';
            default:
                return false;
        }
    });
}

function foodContainsTrigger(content, sensitivityKey) {
    const contentLower = content.toLowerCase();
    
    switch (sensitivityKey) {
        case 'nightshades':
            return /(tomato|potato|pepper|eggplant)/i.test(content);
        case 'high_histamine':
            return /(tuna|bacon|shellfish|aged cheese|fermented)/i.test(content);
        case 'dairy':
            return /(milk|cheese|yogurt|butter|cream)/i.test(content);
        case 'eggs':
            return /egg/i.test(content);
        case 'grains':
            return /(wheat|rice|oats|barley|quinoa)/i.test(content);
        case 'high_fodmap':
            return /(onion|garlic|bean|wheat|apple)/i.test(content);
        case 'fermented_foods':
            return /(sauerkraut|kimchi|kefir|kombucha)/i.test(content);
        case 'high_oxalate':
            return /(spinach|beet|almond|chocolate)/i.test(content);
        default:
            return false;
    }
}

function isProtocolCompliant(foods, protocols, allFoods) {
    // Simplified compliance check - in reality this would check against protocol_food_rules
    return foods.every(foodName => {
        const food = allFoods.find(f => f.name === foodName);
        if (!food) return true;
        
        // Basic compliance rules
        if (protocols.includes('AIP Core') && food.nightshade) return false;
        if (protocols.includes('Low Histamine') && food.histamine === 'high') return false;
        if (protocols.includes('Low Oxalate') && food.oxalate === 'high') return false;
        
        return true;
    });
}

// Insert timeline entries one by one (simplified)
async function insertTimelineEntries(entries) {
    console.log(`📝 Inserting ${entries.length} timeline entries...`);
    
    let inserted = 0;
    
    for (const entry of entries) {
        try {
            await pool.query(`
                INSERT INTO timeline_entries 
                (user_id, entry_date, entry_time, entry_type, content, severity, protocol_compliant)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [
                entry.user_id,
                entry.entry_date,
                entry.entry_time,
                entry.entry_type,
                entry.content,
                entry.severity,
                entry.protocol_compliant
            ]);
            
            inserted++;
            
            if (inserted % 500 === 0) {
                console.log(`✅ Inserted ${inserted}/${entries.length} entries...`);
            }
        } catch (error) {
            console.error(`❌ Error inserting entry:`, error);
            console.log('Entry data:', entry);
            break; // Stop on first error to debug
        }
    }
    
    console.log(`✅ Successfully inserted ${inserted} timeline entries`);
}

// Main population function
async function populateHealthData() {
    console.log('🚀 Starting health data population...');
    console.log('⚠️  This will create thousands of test entries - make sure this is a development database!');
    
    try {
        // Load existing data
        const { foods, protocols } = await loadDatabaseData();
        
        // Create test users
        await createUsers();
        
        // Generate timeline entries for each user
        const allEntries = [];
        
        for (const user of USER_PROFILES) {
            console.log(`📅 Generating data for ${user.profile.name}...`);
            
            const userEntries = [];
            const currentDate = new Date('2024-01-01');
            let dayIndex = 0;
            
            // Generate 6 months of data
            while (currentDate <= new Date('2024-06-30')) {
                const dayEntries = generateDayEntries(user, currentDate, dayIndex, foods);
                userEntries.push(...dayEntries);
                
                currentDate.setDate(currentDate.getDate() + 1);
                dayIndex++;
            }
            
            // Generate symptom entries based on food triggers
            const symptomEntries = generateSymptomEntries(user, userEntries);
            userEntries.push(...symptomEntries);
            
            console.log(`✅ Generated ${userEntries.length} entries for ${user.profile.name}`);
            allEntries.push(...userEntries);
        }
        
        // Insert all entries
        await insertTimelineEntries(allEntries);
        
        // Print summary
        console.log('\n🎉 Database population complete!');
        console.log('\n📊 Summary:');
        console.log(`👥 Users created: ${USER_PROFILES.length}`);
        console.log(`📝 Timeline entries: ${allEntries.length}`);
        console.log(`🔍 Expected correlations:`);
        
        USER_PROFILES.forEach(user => {
            console.log(`\n${user.profile.name}:`);
            Object.keys(user.profile.sensitivities).forEach(trigger => {
                const sensitivity = user.profile.sensitivities[trigger];
                console.log(`  - ${trigger} → ${sensitivity.symptoms.join(', ')} (${sensitivity.delay[0]}-${sensitivity.delay[1]}hrs)`);
            });
            Object.keys(user.profile.improvements).forEach(supplement => {
                const improvement = user.profile.improvements[supplement];
                console.log(`  - ${supplement} → ${improvement.effects.join(', ')} (after day ${improvement.startDay})`);
            });
        });
        
        console.log('\n🔬 Your correlation analysis should now detect these patterns!');
        
    } catch (error) {
        console.error('❌ Error during population:', error);
    } finally {
        await pool.end();
    }
}

// Run the population
if (require.main === module) {
    populateHealthData().catch(console.error);
}

module.exports = { populateHealthData };