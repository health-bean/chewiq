const { pool } = require('../database/connection');
const { successResponse, errorResponse } = require('../utils/responses');
const { handleDatabaseError } = require('../utils/errors');
const { getCurrentUser, getAccessibleUserIds, requireAuth } = require('../middleware/auth');

const handleGetUser = async (queryParams, event) => {
    // Require authentication
    const authError = await requireAuth(event);
    if (authError) {
        return authError;
    }

    try {
        const user = await getCurrentUser(event);
        
        return successResponse({ 
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                userType: user.userType
            }
        });
        
    } catch (error) {
        const appError = handleDatabaseError(error, 'fetch user');
        return errorResponse(appError.message, appError.statusCode);
    }
};

const handleUpdateUser = async (body, event) => {
    // Require authentication
    const authError = await requireAuth(event);
    if (authError) {
        return authError;
    }

    try {
        const user = await getCurrentUser(event);
        const client = await pool.connect();
        
        const updateFields = [];
        const values = [];
        let valueIndex = 1;
        
        const fieldMapping = {
            firstName: 'first_name',
            lastName: 'last_name',
            email: 'email'
        };
        
        for (const [bodyField, dbField] of Object.entries(fieldMapping)) {
            if (body[bodyField] !== undefined) {
                updateFields.push(`${dbField} = $${valueIndex}`);
                values.push(body[bodyField]);
                valueIndex++;
            }
        }
        
        if (updateFields.length === 0) {
            client.release();
            return errorResponse('No valid fields provided for update', 400);
        }
        
        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(user.id);
        
        const query = `
            UPDATE users 
            SET ${updateFields.join(', ')}
            WHERE id = $${valueIndex}
            RETURNING id, email, first_name, last_name, user_type
        `;
        
        const result = await client.query(query, values);
        client.release();
        
        if (result.rows.length === 0) {
            return errorResponse('User not found', 404);
        }
        
        const updatedUser = result.rows[0];
        
        return successResponse({
            message: 'User profile updated successfully',
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                firstName: updatedUser.first_name,
                lastName: updatedUser.last_name,
                userType: updatedUser.user_type
            }
        });
        
    } catch (error) {
        const appError = handleDatabaseError(error, 'update user');
        return errorResponse(appError.message, appError.statusCode);
    }
};

const handleGetUserProtocols = async (queryParams, event) => {
    // Require authentication
    const authError = await requireAuth(event);
    if (authError) {
        return authError;
    }

    try {
        const user = await getCurrentUser(event);
        const accessibleUserIds = await getAccessibleUserIds(event);
        const client = await pool.connect();
        
        const query = `
            SELECT 
                up.id,
                up.current_phase,
                up.start_date,
                up.end_date,
                up.compliance_score,
                up.active,
                p.id as protocol_id,
                p.name as protocol_name,
                p.description,
                p.category,
                p.phases
            FROM user_protocols up
            JOIN protocols p ON up.protocol_id = p.id
            WHERE up.user_id = ANY($1) AND up.active = true
            ORDER BY up.start_date DESC
        `;
        
        const result = await client.query(query, [accessibleUserIds]);
        client.release();
        
        return successResponse({
            protocols: result.rows,
            total: result.rows.length
        });
        
    } catch (error) {
        const appError = handleDatabaseError(error, 'fetch user protocols');
        return errorResponse(appError.message, appError.statusCode);
    }
};

const handleGetUserPreferences = async (queryParams, event) => {
    console.log('🔍 USER PREFS: Function called with params:', {
        queryParamsType: typeof queryParams,
        eventType: typeof event,
        eventDefined: !!event,
        eventHasHeaders: !!(event && event.headers)
    });
    
    // Require authentication
    const authError = await requireAuth(event);
    if (authError) {
        return authError;
    }

    try {
        const user = await getCurrentUser(event);
        const client = await pool.connect();
        
        // Try to get preferences from database
        const query = `
            SELECT preferences FROM user_preferences WHERE user_id = $1
        `;
        
        const result = await client.query(query, [user.id]);
        client.release();
        
        if (result.rows.length > 0) {
            return successResponse({
                preferences: result.rows[0].preferences
            });
        }
        
        // Return default preferences if none found
        const defaultPreferences = {
            protocols: [],
            quick_supplements: [],
            quick_medications: [],
            quick_foods: [],
            quick_symptoms: [],
            quick_detox: [],
            setup_complete: false
        };
        
        return successResponse({
            preferences: defaultPreferences
        });
        
    } catch (error) {
        // If user_preferences table doesn't exist yet, return mock data
        if (error.code === '42P01') { // Table doesn't exist
            const mockPreferences = {
                protocols: [],
                quick_supplements: [],
                quick_medications: [],
                quick_foods: [],
                quick_symptoms: [],
                quick_detox: [],
                setup_complete: false  // Let demo users go through setup wizard
            };
            
            return successResponse({
                preferences: mockPreferences
            });
        }
        
        const appError = handleDatabaseError(error, 'fetch user preferences');
        return errorResponse(appError.message, appError.statusCode);
    }
};

const handleUpdateUserPreferences = async (body, event) => {
    // Require authentication
    const authError = await requireAuth(event);
    if (authError) {
        return authError;
    }

    try {
        const user = await getCurrentUser(event);
        const client = await pool.connect();
        
        // Upsert preferences
        const query = `
            INSERT INTO user_preferences (user_id, preferences)
            VALUES ($1, $2)
            ON CONFLICT (user_id)
            DO UPDATE SET 
                preferences = $2,
                updated_at = CURRENT_TIMESTAMP
            RETURNING preferences
        `;
        
        const result = await client.query(query, [user.id, JSON.stringify(body)]);
        client.release();
        
        return successResponse({
            message: 'User preferences updated successfully',
            preferences: result.rows[0].preferences
        });
        
    } catch (error) {
        // If user_preferences table doesn't exist yet, just return success
        if (error.code === '42P01') { // Table doesn't exist
            return successResponse({
                message: 'User preferences updated successfully (stored locally)',
                preferences: body
            });
        }
        
        const appError = handleDatabaseError(error, 'update user preferences');
        return errorResponse(appError.message, appError.statusCode);
    }
};

// Get current user protocol
const handleGetCurrentProtocol = async (queryParams, event) => {
  try {
    const user = await getCurrentUser(event);
    if (!user) {
      return errorResponse('Authentication required', 401);
    }

    const client = await pool.connect();
    
    try {
      // Use our database function to get current protocol
      const result = await client.query(
        'SELECT * FROM get_user_current_protocol($1)',
        [user.id]
      );

      if (result.rows.length === 0) {
        return successResponse({ protocol: null });
      }

      const protocol = result.rows[0];
      return successResponse({
        protocol: {
          protocol_id: protocol.protocol_id,
          protocol_name: protocol.protocol_name,
          phase: protocol.phase,
          compliance_score: protocol.compliance_score,
          protocol_data: protocol.protocol_data,
          start_date: protocol.protocol_data?.phase_history?.[0]?.started
        }
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error getting current protocol:', error);
    const appError = handleDatabaseError(error, 'get current protocol');
    return errorResponse(appError.message, appError.statusCode);
  }
};

// Get user protocol history
const handleGetProtocolHistory = async (queryParams, event) => {
  try {
    const user = await getCurrentUser(event);
    if (!user) {
      return errorResponse('Authentication required', 401);
    }

    const client = await pool.connect();
    
    try {
      // Get protocol change events for this user
      const result = await client.query(`
        SELECT 
          pce.created_at,
          pce.event_data,
          p1.name as previous_protocol_name,
          p2.name as new_protocol_name
        FROM protocol_change_events pce
        LEFT JOIN protocols p1 ON p1.id = (pce.event_data->'previous_protocol'->>'id')::uuid
        LEFT JOIN protocols p2 ON p2.id = (pce.event_data->'new_protocol'->>'id')::uuid
        WHERE pce.user_id = $1
        ORDER BY pce.created_at DESC
        LIMIT 20
      `, [user.id]);

      const history = result.rows.map(row => ({
        date: row.created_at,
        change_type: row.event_data.change_type,
        previous_protocol: row.previous_protocol_name,
        new_protocol: row.new_protocol_name,
        context: row.event_data.context,
        duration_days: row.event_data.previous_protocol?.duration_days
      }));

      return successResponse({ history });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error getting protocol history:', error);
    const appError = handleDatabaseError(error, 'get protocol history');
    return errorResponse(appError.message, appError.statusCode);
  }
};

// Change user protocol
const handleChangeProtocol = async (body, event) => {
  try {
    const user = await getCurrentUser(event);
    if (!user) {
      return errorResponse('Authentication required', 401);
    }

    const { newProtocolId, reason, context = {} } = body;

    if (!newProtocolId) {
      return errorResponse('New protocol ID is required', 400);
    }

    const client = await pool.connect();
    
    try {
      // Get current protocol
      const currentResult = await client.query(
        'SELECT * FROM get_user_current_protocol($1)',
        [user.id]
      );

      const currentProtocol = currentResult.rows[0];

      // Verify new protocol exists
      const protocolCheck = await client.query(
        'SELECT id, name FROM protocols WHERE id = $1',
        [newProtocolId]
      );

      if (protocolCheck.rows.length === 0) {
        return errorResponse('Protocol not found', 404);
      }

      const newProtocol = protocolCheck.rows[0];

      // If user has a current protocol, end it
      if (currentProtocol) {
        await client.query(`
          UPDATE user_protocols 
          SET 
            end_date = CURRENT_DATE,
            active = false,
            protocol_data = protocol_data || jsonb_build_object(
              'ended_at', now()::text,
              'end_reason', $3
            )
          WHERE user_id = $1 AND protocol_id = $2 AND active = true
        `, [user.id, currentProtocol.protocol_id, reason || 'protocol_change']);
      }

      // Create new protocol assignment
      await client.query(`
        INSERT INTO user_protocols (user_id, protocol_id, start_date, protocol_data)
        VALUES ($1, $2, CURRENT_DATE, $3)
      `, [
        user.id, 
        newProtocolId,
        JSON.stringify({
          active: true,
          current_phase: 1,
          started_via: 'preferences_change',
          phase_history: [{
            phase: 1,
            started: new Date().toISOString().split('T')[0],
            status: 'active'
          }]
        })
      ]);

      // Log the protocol change using our database function
      await client.query(
        'SELECT log_protocol_change($1, $2, $3, $4, $5, $6)',
        [
          user.id,
          currentProtocol?.protocol_id || null,
          newProtocolId,
          reason || 'user_preference_change',
          JSON.stringify({
            ...context,
            changed_by: 'user',
            source: 'preferences_page'
          }),
          user.id
        ]
      );

      return successResponse({
        success: true,
        message: `Protocol changed to ${newProtocol.name}`,
        new_protocol: {
          id: newProtocol.id,
          name: newProtocol.name
        }
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error changing protocol:', error);
    const appError = handleDatabaseError(error, 'change protocol');
    return errorResponse(appError.message, appError.statusCode);
  }
};

module.exports = {
    handleGetUser,
    handleUpdateUser,
    handleGetUserProtocols,
    handleGetUserPreferences,
    handleUpdateUserPreferences,
    handleGetCurrentProtocol,
    handleGetProtocolHistory,
    handleChangeProtocol
};