/**
 * Seed demo data for all demo users
 * Creates realistic health data for each demo user profile
 */

const { pool } = require('../functions/api/database/connection');

// Demo user profiles with their unique characteristics
const demoUsers = [
  {
    email: 'sarah.aip@test.com',
    profile: 'AIP Protocol',
    conditions: ['autoimmune', 'inflammation'],
    commonFoods: ['bone broth', 'sweet potato', 'coconut oil', 'grass-fed beef'],
    commonSymptoms: ['joint pain', 'fatigue', 'brain fog'],
    commonSupplements: ['vitamin D', 'omega-3', 'probiotics']
  },
  {
    email: 'mike.fodmap@test.com', 
    profile: 'Low FODMAP',
    conditions: ['IBS', 'digestive issues'],
    commonFoods: ['rice', 'chicken', 'carrots', 'spinach'],
    commonSymptoms: ['bloating', 'abdominal pain', 'gas'],
    commonSupplements: ['digestive enzymes', 'peppermint oil', 'fiber']
  },
  {
    email: 'lisa.histamine@test.com',
    profile: 'Low Histamine',
    conditions: ['histamine intolerance', 'allergies'],
    commonFoods: ['fresh meat', 'rice', 'broccoli', 'olive oil'],
    commonSymptoms: ['headaches', 'skin rash', 'nasal congestion'],
    commonSupplements: ['DAO enzyme', 'quercetin', 'vitamin C']
  },
  {
    email: 'john.paleo@test.com',
    profile: 'Paleo Diet',
    conditions: ['metabolic health', 'weight management'],
    commonFoods: ['salmon', 'avocado', 'nuts', 'berries'],
    commonSymptoms: ['energy dips', 'cravings', 'mood swings'],
    commonSupplements: ['magnesium', 'B-complex', 'fish oil']
  },
  {
    email: 'emma.multi@test.com',
    profile: 'Multiple Protocols',
    conditions: ['multiple sensitivities', 'complex health'],
    commonFoods: ['quinoa', 'vegetables', 'lean protein', 'herbal teas'],
    commonSymptoms: ['varied symptoms', 'sensitivity reactions', 'digestive issues'],
    commonSupplements: ['multivitamin', 'adaptogenic herbs', 'gut support']
  }
];

// Generate user ID from email (same logic as backend)
const generateDemoUserId = (email) => {
  const crypto = require('crypto');
  const hash = crypto.createHash('sha256').update(email).digest('hex');
  
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    hash.substring(12, 16),
    hash.substring(16, 20),
    hash.substring(20, 32)
  ].join('-');
};

// Generate realistic timeline entries
const generateTimelineEntries = (userProfile, userId, daysBack = 30) => {
  const entries = [];
  const today = new Date();
  
  for (let day = 0; day < daysBack; day++) {
    const entryDate = new Date(today);
    entryDate.setDate(today.getDate() - day);
    const dateStr = entryDate.toISOString().split('T')[0];
    
    // Generate 3-8 entries per day
    const entriesPerDay = Math.floor(Math.random() * 6) + 3;
    
    for (let i = 0; i < entriesPerDay; i++) {
      const hour = Math.floor(Math.random() * 16) + 6; // 6 AM to 10 PM
      const minute = Math.floor(Math.random() * 60);
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      
      // Random entry type
      const entryTypes = ['food', 'symptom', 'supplement'];
      const entryType = entryTypes[Math.floor(Math.random() * entryTypes.length)];
      
      let content, severity;
      
      switch (entryType) {
        case 'food':
          content = {
            name: userProfile.commonFoods[Math.floor(Math.random() * userProfile.commonFoods.length)],
            amount: ['small', 'medium', 'large'][Math.floor(Math.random() * 3)],
            notes: Math.random() > 0.7 ? 'Felt good after eating' : null
          };
          break;
          
        case 'symptom':
          const symptom = userProfile.commonSymptoms[Math.floor(Math.random() * userProfile.commonSymptoms.length)];
          severity = Math.floor(Math.random() * 5) + 1; // 1-5 for symptoms
          content = {
            name: symptom,
            severity: severity,
            notes: severity > 3 ? 'More intense than usual' : null
          };
          break;
          
        case 'supplement':
          content = {
            name: userProfile.commonSupplements[Math.floor(Math.random() * userProfile.commonSupplements.length)],
            dosage: ['1 capsule', '2 capsules', '1 tablet', '1 tsp'][Math.floor(Math.random() * 4)],
            timing: ['with meal', 'before meal', 'after meal'][Math.floor(Math.random() * 3)]
          };
          break;
      }
      
      entries.push({
        userId,
        entryDate: dateStr,
        entryTime: timeStr,
        entryType,
        content: JSON.stringify(content),
        severity,
        protocolCompliant: Math.random() > 0.3 // 70% compliant
      });
    }
  }
  
  return entries;
};

// Main seeding function
const seedDemoData = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Starting demo data seeding...');
    
    for (const userProfile of demoUsers) {
      const userId = generateDemoUserId(userProfile.email);
      console.log(`\n👤 Seeding data for ${userProfile.email} (${userId})`);
      
      // Check if user already has data
      const existingEntries = await client.query(
        'SELECT COUNT(*) as count FROM timeline_entries WHERE user_id = $1',
        [userId]
      );
      
      if (parseInt(existingEntries.rows[0].count) > 0) {
        console.log(`   ⏭️  User already has ${existingEntries.rows[0].count} entries, skipping...`);
        continue;
      }
      
      // Generate timeline entries
      const timelineEntries = generateTimelineEntries(userProfile, userId);
      console.log(`   📝 Generated ${timelineEntries.length} timeline entries`);
      
      // Insert entries in batches
      for (const entry of timelineEntries) {
        // First, ensure journal entry exists for the date
        await client.query(`
          INSERT INTO journal_entries (user_id, entry_date)
          VALUES ($1, $2)
          ON CONFLICT (user_id, entry_date) DO NOTHING
        `, [entry.userId, entry.entryDate]);
        
        // Get journal entry ID
        const journalResult = await client.query(
          'SELECT id FROM journal_entries WHERE user_id = $1 AND entry_date = $2',
          [entry.userId, entry.entryDate]
        );
        
        if (journalResult.rows.length > 0) {
          const journalEntryId = journalResult.rows[0].id;
          
          // Insert timeline entry
          await client.query(`
            INSERT INTO timeline_entries (
              user_id, journal_entry_id, entry_time, entry_type, 
              content, severity, protocol_compliant
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [
            entry.userId,
            journalEntryId,
            entry.entryTime,
            entry.entryType,
            entry.content,
            entry.severity,
            entry.protocolCompliant
          ]);
        }
      }
      
      console.log(`   ✅ Successfully seeded ${timelineEntries.length} entries for ${userProfile.profile}`);
    }
    
    console.log('\n🎉 Demo data seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run if called directly
if (require.main === module) {
  seedDemoData()
    .then(() => {
      console.log('✅ Seeding complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedDemoData };
