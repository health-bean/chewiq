#!/usr/bin/env node

/**
 * Test script to debug the journal entries handler with sleep symptoms
 */

// Load environment variables from .env file
require('dotenv').config({ path: './backend/.env' });

// Set NODE_ENV to development if not set
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const { pool } = require('./backend/functions/api/database/connection');
const { getCurrentUser } = require('./backend/functions/api/middleware/auth');
const { handleCreateJournalEntry } = require('./backend/functions/api/handlers/journal');

async function testJournalEntryWithSymptoms() {
  console.log('🔍 Testing journal entry handler with sleep symptoms...');
  
  // Create a mock event with demo headers
  const mockEvent = {
    headers: {
      'x-demo-mode': 'true',
      'x-demo-user-id': 'sarah-aip',
      'x-demo-session-id': 'test_session_123'
    }
  };
  
  // Sample journal entry data with sleep symptoms
  const mockBody = {
    entry_date: new Date().toISOString().split('T')[0],
    bedtime: '22:30',
    wake_time: '07:00',
    sleep_quality: 'poor',
    sleep_symptoms: [
      { name: 'insomnia', severity: 7 },
      { name: 'restless legs', severity: 5 },
      'night sweats' // Testing string format too
    ],
    energy_level: 4,
    mood_level: 5,
    physical_comfort: 6,
    activity_level: 'low',
    meditation_duration: 15,
    meditation_practice: true,
    personal_reflection: 'Had trouble sleeping last night'
  };
  
  try {
    console.log('Step 1: Testing auth middleware...');
    const user = await getCurrentUser(mockEvent);
    
    if (!user) {
      console.error('❌ Authentication failed - no user returned');
      return;
    }
    
    console.log('✅ Authentication successful!');
    console.log('User:', JSON.stringify(user, null, 2));
    
    // Add user to event like the main handler does
    mockEvent.user = user;
    
    console.log('Step 2: Calling journal entry handler with sleep symptoms...');
    console.log('Request body:', JSON.stringify(mockBody, null, 2));
    
    const response = await handleCreateJournalEntry(mockBody, mockEvent);
    
    console.log('✅ Journal entry response status:', response.statusCode);
    console.log('Response body:', JSON.stringify(JSON.parse(response.body), null, 2));
    
    // Step 3: Verify timeline entries were created for symptoms
    if (response.statusCode === 200) {
      const client = await pool.connect();
      const result = await client.query(`
        SELECT * FROM timeline_entries 
        WHERE user_id = $1 
          AND entry_date = $2
          AND entry_type = 'symptom'
          AND structured_content->>'entry_source' = 'daily_reflection'
      `, [user.id, mockBody.entry_date]);
      
      console.log(`✅ Found ${result.rows.length} timeline entries for sleep symptoms`);
      
      for (const row of result.rows) {
        console.log('Timeline entry:', {
          id: row.id,
          symptom_name: row.structured_content.symptom_name,
          severity: row.structured_content.severity,
          context: row.structured_content.context
        });
      }
      
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Error during test:', error);
    console.error('Error stack:', error.stack);
  } finally {
    // Close the database connection
    await pool.end();
    console.log('Database connection closed');
  }
}

// Run the test
testJournalEntryWithSymptoms().catch(console.error);