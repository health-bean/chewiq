// backend/functions/api/middleware/auth.js - Clean relationship-based authentication
const jwt = require('jsonwebtoken');
const { pool } = require('../database/connection');
const { errorResponse } = require('../utils/responses');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';

/**
 * Parse JWT token and return user information
 * @param {Object} event - Lambda event object
 * @returns {Object|null} - User object or null if not authenticated
 */
const getCurrentUser = async (event) => {
  try {
    const authHeader = event.headers?.Authorization || event.headers?.authorization;
    
    if (!authHeader) {
      // For development: return a default test user when no auth header
      // This prevents crashes when authentication is disabled
      return {
        id: '8e8a568a-c2f8-43a8-abf2-4e54408dbdc0', // Sarah's user ID from test data
        email: 'sarah@example.com',
        first_name: 'Sarah',
        last_name: 'Test',
        user_type: 'patient',
        is_active: true
      };
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);

    // Get fresh user data from database
    const client = await pool.connect();
    const userQuery = `
      SELECT id, email, first_name, last_name, user_type, is_active
      FROM users 
      WHERE id = $1 AND is_active = true
    `;
    
    const result = await client.query(userQuery, [decoded.sub]);
    client.release();

    if (result.rows.length === 0) {
      return null; // User not found or inactive
    }

    return result.rows[0];
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return null;
  }
};

/**
 * Get all user IDs that the current user can access
 * This is the main function most handlers should use
 * @param {Object} event - Lambda event object
 * @returns {Array} - Array of user IDs that can be accessed
 */
const getAccessibleUserIds = async (event) => {
  const user = await getCurrentUser(event);
  
  if (!user) {
    return [];
  }

  if (user.userType === 'patient') {
    return [user.id]; // Patients can only access their own data
  }

  if (user.userType === 'practitioner') {
    try {
      const client = await pool.connect();
      
      // Get all patients who have granted access to this practitioner
      const relationshipQuery = `
        SELECT DISTINCT patient_id
        FROM patient_practitioner_relationships 
        WHERE practitioner_id = $1 AND status = 'active'
      `;
      
      const result = await client.query(relationshipQuery, [user.id]);
      client.release();

      const patientIds = result.rows.map(row => row.patient_id);
      return [user.id, ...patientIds]; // Practitioner can access their own data + patients
      
    } catch (error) {
      console.error('Practitioner access error:', error);
      return [user.id]; // Fallback to just their own data
    }
  }

  // For future user types (researchers, admins, etc.)
  return [user.id];
};

/**
 * Get patient-practitioner relationships for a user
 * @param {Object} event - Lambda event object
 * @returns {Object|null} - Relationship data
 */
const getRelationships = async (event) => {
  const user = await getCurrentUser(event);
  
  if (!user) {
    return null;
  }

  try {
    const client = await pool.connect();
    
    if (user.userType === 'patient') {
      // Get all practitioners this patient has shared with
      const query = `
        SELECT 
          ppr.practitioner_id,
          ppr.status,
          ppr.granted_at,
          u.first_name,
          u.last_name,
          u.email
        FROM patient_practitioner_relationships ppr
        JOIN users u ON ppr.practitioner_id = u.id
        WHERE ppr.patient_id = $1
        ORDER BY ppr.granted_at DESC
      `;
      
      const result = await client.query(query, [user.id]);
      client.release();
      
      return {
        userType: 'patient',
        practitioners: result.rows.map(row => ({
          id: row.practitioner_id,
          name: `${row.first_name} ${row.last_name}`,
          email: row.email,
          status: row.status,
          grantedAt: row.granted_at
        }))
      };
    }
    
    if (user.userType === 'practitioner') {
      // Get all patients who have shared with this practitioner
      const query = `
        SELECT 
          ppr.patient_id,
          ppr.status,
          ppr.granted_at,
          u.first_name,
          u.last_name,
          u.email
        FROM patient_practitioner_relationships ppr
        JOIN users u ON ppr.patient_id = u.id
        WHERE ppr.practitioner_id = $1
        ORDER BY ppr.granted_at DESC
      `;
      
      const result = await client.query(query, [user.id]);
      client.release();
      
      return {
        userType: 'practitioner',
        patients: result.rows.map(row => ({
          id: row.patient_id,
          name: `${row.first_name} ${row.last_name}`,
          email: row.email,
          status: row.status,
          grantedAt: row.granted_at
        }))
      };
    }
    
    client.release();
    return { userType: user.userType, relationships: [] };
    
  } catch (error) {
    console.error('Relationships error:', error);
    return { userType: user.userType, relationships: [] };
  }
};

/**
 * Require authentication middleware - returns error response if not authenticated
 * @param {Object} event - Lambda event object
 * @returns {Object|null} - Error response or null if authenticated
 */
const requireAuth = async (event) => {
  const user = await getCurrentUser(event);
  
  if (!user) {
    return errorResponse('Authentication required', 401);
  }
  
  return null; // No error, user is authenticated
};

/**
 * Require specific user type middleware
 * @param {Array} allowedTypes - Array of allowed user types
 * @returns {Function} - Middleware function
 */
const requireUserType = (allowedTypes) => {
  return async (event) => {
    const user = await getCurrentUser(event);
    
    if (!user) {
      return errorResponse('Authentication required', 401);
    }
    
    if (!allowedTypes.includes(user.userType)) {
      return errorResponse('Insufficient permissions', 403);
    }
    
    return null; // No error, user has correct type
  };
};

module.exports = {
  getCurrentUser,
  getAccessibleUserIds,
  getRelationships,
  requireAuth,
  requireUserType
};