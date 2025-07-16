#!/usr/bin/env node

/**
 * Test script to debug the journal entries handler
 */

// Load environment variables from .env file
require('dotenv').config({ path: './backend/.env' });

// Set NODE_ENV to development if not set
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const { pool } = require('./backend/functions/api/database/connection');
const { getCurrentUser } = require('./backend/functions/api/middleware/auth');
const { handleCreateJournalEntry } = require('./backend/functions/api/handlers/journal');

async function testJournalEntryHandler() {
  console.log('🔍 Testing journal entry handler with demo user...');
  
  // Create a mock event with demo headers
  const mockEvent = {
    headers: {
      'x-demo-mode': 'true',
      'x-demo-user-id': 'sarah-aip',
      'x-demo-session-id': 'test_session_123'
    }
  };
  
  // Sample journal entry data
  const mockBody = {
    entry_date: new Date().toISOString().split('T')[0],
    bedtime: '22:30',
    wake_time: '07:00',
    sleep_quality: 'good',
    sleep_symptoms: [],
    energy_level: 7,
    mood_level: 8,
    physical_comfort: 6,
    activity_level: 'moderate',
    meditation_duration: 15,
    meditation_practice: true,
    personal_reflection: 'Feeling good today'
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
    
    console.log('Step 2: Calling journal entry handler...');
    console.log('Request body:', JSON.stringify(mockBody, null, 2));
    
    const response = await handleCreateJournalEntry(mockBody, mockEvent);
    
    console.log('✅ Journal entry response status:', response.statusCode);
    console.log('Response body:', JSON.stringify(JSON.parse(response.body), null, 2));
    
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
testJournalEntryHandler().catch(console.error);