import React from 'react';
import { getEntryIcon, getEntryColor } from '../../../../shared/utils/entryHelpers';

const TimelineEntry = ({ entry }) => {
  // Helper function to render content from structured_content
  const renderContent = () => {
    // Try to get content from structured_content first (new format)
    if (entry.structured_content) {
      try {
        const structured = typeof entry.structured_content === 'string' 
          ? JSON.parse(entry.structured_content) 
          : entry.structured_content;
        
        // Extract the main item name
        const itemName = structured.item_name || structured.food_name || structured.symptom_name || 
                        structured.supplement_name || structured.medication_name || structured.exposure_type || 
                        structured.detox_type;
        
        if (itemName) {
          const parts = [itemName];
          
          // Add category if available
          if (structured.category && structured.category !== 'unknown') {
            parts.push(`(${structured.category})`);
          }
          
          // Add severity for symptoms
          if (structured.severity && entry.entry_type === 'symptom') {
            parts.push(`- Severity: ${structured.severity}/10`);
          }
          
          // Add duration for detox
          if (structured.duration_minutes && entry.entry_type === 'detox') {
            parts.push(`- ${structured.duration_minutes} min`);
          }
          
          return parts.join(' ');
        }
      } catch (error) {
        console.warn('Error parsing structured_content:', error);
      }
    }
    
    // Fallback to legacy content field if it exists
    if (entry.content) {
      return renderLegacyContent(entry.content);
    }
    
    // Final fallback
    return `${entry.entry_type} entry`;
  };

  // Helper function to render legacy content (for backward compatibility)
  const renderLegacyContent = (content) => {
    // Handle null/undefined
    if (!content) return 'No content';
    
    // Handle strings (new format or simple text)
    if (typeof content === 'string') {
      return content;
    }
    
    // Handle numbers
    if (typeof content === 'number') {
      return content.toString();
    }
    
    if (typeof content === 'object' && content !== null) {
      // Handle structured food content with name and category
      if (content.name) {
        const parts = [content.name];
        
        // Add category if available
        if (content.category && content.category !== 'unknown') {
          parts.push(`(${content.category})`);
        }
        
        // Add other details
        if (content.amount) parts.push(`- ${content.amount}`);
        if (content.dosage) parts.push(`- ${content.dosage}`);
        if (content.timing) parts.push(`${content.timing}`);
        if (content.severity) parts.push(`Severity: ${content.severity}/10`);
        if (content.notes) parts.push(`Notes: ${content.notes}`);
        
        return parts.join(' ');
      }
      
      // Handle other common object structures
      if (content.description) {
        return content.description;
      }
      
      if (content.value) {
        return String(content.value);
      }
      
      if (content.text) {
        return content.text;
      }
      
      // Handle arrays (legacy format with food objects)
      if (Array.isArray(content)) {
        return content.map(item => {
          if (typeof item === 'string') return item;
          if (typeof item === 'object' && item.name) {
            // Extract food name and category
            const parts = [item.name];
            if (item.category && item.category !== 'unknown') {
              parts.push(`(${item.category})`);
            }
            return parts.join(' ');
          }
          return String(item);
        }).join(', ');
      }
      
      // For objects without standard properties, show key-value pairs
      const entries = Object.entries(content);
      if (entries.length > 0) {
        return entries
          .filter(([key, value]) => value !== null && value !== undefined && value !== '')
          .map(([key, value]) => `${key}: ${String(value)}`)
          .join(', ');
      }
      
      // Last resort - but avoid [object Object]
      return 'Content available';
    }
    
    // Final fallback
    return String(content);
  };

  return (
    <div className={`p-3 rounded-lg border-2 ${getEntryColor(entry.entry_type, entry.protocol_compliant)} reduced-motion`}>
      <div className="flex-start tight-spacing">
        <div className="text-lg">{getEntryIcon(entry.entry_type)}</div>
        <div className="flex-1">
          <div className="flex-center tight-spacing mb-2 flex-wrap">
            <span className="font-medium text-sm text-comfortable">{entry.entry_time}</span>
            <span className="text-xs bg-neutral-50 px-2 py-1 rounded-full capitalize border border-neutral-200">
              {entry.entry_type}
            </span>
            {entry.protocol_compliant === false && (
              <span className="protocol-avoid text-xs px-2 py-1 rounded-full border">
                ⚠️ Protocol Alert
              </span>
            )}
            {entry.protocol_compliant === true && (
              <span className="protocol-allowed text-xs px-2 py-1 rounded-full border">
                ✅ Compliant
              </span>
            )}
          </div>
          <p className="text-sm text-readable">{renderContent()}</p>
          {entry.severity && (
            <div className="text-xs text-neutral-600 mt-1">
              Severity: {entry.severity}/10
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimelineEntry;