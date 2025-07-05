const { pool } = require('../database/connection');
const { successResponse, errorResponse } = require('../utils/responses');
const { handleDatabaseError } = require('../utils/errors');
const { getCurrentUser } = require('../middleware/auth');

const handleGetTimelineEntries = async (queryParams, event, user = null) => {
    try {
        const currentUser = user || await getCurrentUser(event);
        if (!currentUser) {
            return errorResponse('User not authenticated', 401);
        }
        
        return successResponse({
            entries: [],
            total: 0
        });
        
    } catch (error) {
        console.error('Timeline GET error:', error);
        return errorResponse('Failed to fetch timeline entries', 500);
    }
};

const handleCreateTimelineEntry = async (body, event, user = null) => {
    try {
        const currentUser = user || await getCurrentUser(event);
        
        if (!currentUser) {
            return errorResponse('User not authenticated', 401);
        }
        
        console.log('User authenticated:', currentUser.id);
        
        const {
            entryDate,
            entryTime,
            entryType,
            content,
            severity = null,
            selectedFoods = []
        } = body;
        
        // Simple success response for now
        return successResponse({
            id: 'test-id',
            message: 'Timeline entry created successfully',
            user: currentUser.id
        });
        
    } catch (error) {
        console.error('Timeline POST error:', error);
        return errorResponse('Failed to create timeline entry', 500);
    }
};

module.exports = {
    handleGetTimelineEntries,
    handleCreateTimelineEntry
};
