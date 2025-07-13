/**
 * Data validation utilities for ensuring clean, serializable data
 */

/**
 * Validates that an object contains only serializable data
 * @param {any} data - Data to validate
 * @param {string} context - Context for error messages
 * @returns {boolean} - True if data is serializable
 */
export const isSerializable = (data, context = 'data') => {
  try {
    JSON.stringify(data);
    return true;
  } catch (error) {
    console.error(`❌ ${context} contains non-serializable data:`, error.message);
    return false;
  }
};

/**
 * Validates and sanitizes a preference item
 * @param {any} item - Item to validate
 * @returns {object|null} - Sanitized item or null if invalid
 */
export const validatePreferenceItem = (item) => {
  if (!item || typeof item !== 'object') {
    return null;
  }

  // Check for React components or functions
  if (item.$$typeof || typeof item.type === 'function' || item._owner) {
    console.warn('⚠️ React component detected in preference data, excluding');
    return null;
  }

  // Only allow specific properties
  const allowedProps = ['id', 'name', 'category', 'color', 'addedAt'];
  const sanitized = {};

  allowedProps.forEach(prop => {
    if (item[prop] !== undefined) {
      const value = item[prop];
      // Only allow primitive values
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        sanitized[prop] = value;
      }
    }
  });

  // Must have at least id and name
  if (!sanitized.id || !sanitized.name) {
    console.warn('⚠️ Preference item missing required id or name:', item);
    return null;
  }

  return sanitized;
};

/**
 * Validates and sanitizes an array of preference items
 * @param {Array} items - Array of items to validate
 * @param {string} context - Context for logging
 * @returns {Array} - Array of sanitized items
 */
export const validatePreferenceArray = (items, context = 'items') => {
  if (!Array.isArray(items)) {
    console.warn(`⚠️ ${context} is not an array, returning empty array`);
    return [];
  }

  const sanitized = items
    .map(item => validatePreferenceItem(item))
    .filter(item => item !== null);

  if (sanitized.length !== items.length) {
    console.warn(`⚠️ ${context}: ${items.length - sanitized.length} invalid items removed`);
  }

  return sanitized;
};

/**
 * Validates complete preferences object before saving
 * @param {object} preferences - Preferences object to validate
 * @returns {object} - Validated and sanitized preferences
 */
export const validatePreferences = (preferences) => {
  if (!preferences || typeof preferences !== 'object') {
    throw new Error('Preferences must be an object');
  }

  const validated = {
    protocols: Array.isArray(preferences.protocols) ? preferences.protocols : [],
    quick_symptoms: validatePreferenceArray(preferences.quick_symptoms, 'symptoms'),
    quick_supplements: validatePreferenceArray(preferences.quick_supplements, 'supplements'),
    quick_medications: validatePreferenceArray(preferences.quick_medications, 'medications'),
    quick_foods: validatePreferenceArray(preferences.quick_foods, 'foods'),
    quick_detox: validatePreferenceArray(preferences.quick_detox, 'detox'),
    setup_complete: Boolean(preferences.setup_complete),
    setup_type: preferences.setup_type || 'full',
    setup_completed_at: preferences.setup_completed_at || new Date().toISOString()
  };

  // Final serialization test
  if (!isSerializable(validated, 'validated preferences')) {
    throw new Error('Preferences failed final serialization test');
  }

  return validated;
};
