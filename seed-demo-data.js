/**
 * Seed demo data for all demo users via API calls
 */

const https = require('https');

const API_BASE = 'https://suhoxvn8ik.execute-api.us-east-1.amazonaws.com/dev';

// Demo users with their credentials
const demoUsers = [
  {
    email: 'sarah.aip@test.com',
    password: 'demo123',
    profile: 'AIP Protocol',
    commonFoods: ['bone broth', 'sweet potato', 'coconut oil', 'grass-fed beef'],
    commonSymptoms: ['joint pain', 'fatigue', 'brain fog'],
    commonSupplements: ['vitamin D', 'omega-3', 'probiotics']
  },
  {
    email: 'mike.fodmap@test.com',
    password: 'demo123',
    profile: 'Low FODMAP',
    commonFoods: ['rice', 'chicken', 'carrots', 'spinach'],
    commonSymptoms: ['bloating', 'abdominal pain', 'gas'],
    commonSupplements: ['digestive enzymes', 'peppermint oil', 'fiber']
  },
  {
    email: 'lisa.histamine@test.com',
    password: 'demo123',
    profile: 'Low Histamine',
    commonFoods: ['fresh meat', 'rice', 'broccoli', 'olive oil'],
    commonSymptoms: ['headaches', 'skin rash', 'nasal congestion'],
    commonSupplements: ['DAO enzyme', 'quercetin', 'vitamin C']
  },
  {
    email: 'john.paleo@test.com',
    password: 'demo123',
    profile: 'Paleo Diet',
    commonFoods: ['salmon', 'avocado', 'nuts', 'berries'],
    commonSymptoms: ['energy dips', 'cravings', 'mood swings'],
    commonSupplements: ['magnesium', 'B-complex', 'fish oil']
  },
  {
    email: 'emma.multi@test.com',
    password: 'demo123',
    profile: 'Multiple Protocols',
    commonFoods: ['quinoa', 'vegetables', 'lean protein', 'herbal teas'],
    commonSymptoms: ['varied symptoms', 'sensitivity reactions', 'digestive issues'],
    commonSupplements: ['multivitamin', 'adaptogenic herbs', 'gut support']
  }
];

// Helper function to make API calls
const makeRequest = (url, method, data = null, headers = {}) => {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
};

// Login and get token
const loginUser = async (email, password) => {
  const response = await makeRequest(`${API_BASE}/api/v1/auth/login`, 'POST', {
    email,
    password
  });
  
  if (response.status === 200 && response.data.token) {
    return response.data.token;
  }
  
  throw new Error(`Login failed for ${email}: ${JSON.stringify(response.data)}`);
};

// Check if user has existing data
const checkExistingData = async (token) => {
  const response = await makeRequest(`${API_BASE}/api/v1/timeline/entries`, 'GET', null, {
    'Authorization': `Bearer ${token}`
  });
  
  if (response.status === 200) {
    return response.data.entries?.length || 0;
  }
  
  return 0;
};

// Generate timeline entries for a user
const generateTimelineEntries = (userProfile, daysBack = 14) => {
  const entries = [];
  const today = new Date();
  
  for (let day = 0; day < daysBack; day++) {
    const entryDate = new Date(today);
    entryDate.setDate(today.getDate() - day);
    
    // Generate 2-5 entries per day
    const entriesPerDay = Math.floor(Math.random() * 4) + 2;
    
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
            amount: ['small', 'medium', 'large'][Math.floor(Math.random() * 3)]
          };
          break;
          
        case 'symptom':
          const symptom = userProfile.commonSymptoms[Math.floor(Math.random() * userProfile.commonSymptoms.length)];
          severity = Math.floor(Math.random() * 5) + 1;
          content = {
            name: symptom,
            severity: severity
          };
          break;
          
        case 'supplement':
          content = {
            name: userProfile.commonSupplements[Math.floor(Math.random() * userProfile.commonSupplements.length)],
            dosage: ['1 capsule', '2 capsules', '1 tablet'][Math.floor(Math.random() * 3)]
          };
          break;
      }
      
      entries.push({
        entry_date: entryDate.toISOString().split('T')[0],
        entry_time: timeStr,
        entry_type: entryType,
        content: content,
        severity: severity,
        protocol_compliant: Math.random() > 0.3
      });
    }
  }
  
  return entries;
};

// Create timeline entry
const createTimelineEntry = async (token, entry) => {
  const response = await makeRequest(`${API_BASE}/api/v1/timeline/entries`, 'POST', entry, {
    'Authorization': `Bearer ${token}`
  });
  
  return response.status === 200 || response.status === 201;
};

// Main seeding function
const seedDemoData = async () => {
  console.log('🌱 Starting demo data seeding via API...\n');
  
  for (const user of demoUsers) {
    try {
      console.log(`👤 Processing ${user.email} (${user.profile})`);
      
      // Login
      console.log('   🔐 Logging in...');
      const token = await loginUser(user.email, user.password);
      
      // Check existing data
      console.log('   📊 Checking existing data...');
      const existingCount = await checkExistingData(token);
      
      if (existingCount > 0) {
        console.log(`   ⏭️  User already has ${existingCount} entries, skipping...\n`);
        continue;
      }
      
      // Generate entries
      console.log('   📝 Generating timeline entries...');
      const entries = generateTimelineEntries(user);
      console.log(`   📝 Generated ${entries.length} entries`);
      
      // Create entries
      console.log('   💾 Creating entries...');
      let successCount = 0;
      let errorCount = 0;
      
      for (const entry of entries) {
        try {
          const success = await createTimelineEntry(token, entry);
          if (success) {
            successCount++;
          } else {
            errorCount++;
          }
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`     ❌ Error creating entry:`, error.message);
          errorCount++;
        }
      }
      
      console.log(`   ✅ Created ${successCount} entries (${errorCount} errors)\n`);
      
    } catch (error) {
      console.error(`❌ Error processing ${user.email}:`, error.message, '\n');
    }
  }
  
  console.log('🎉 Demo data seeding completed!');
};

// Run the seeding
seedDemoData().catch(console.error);
