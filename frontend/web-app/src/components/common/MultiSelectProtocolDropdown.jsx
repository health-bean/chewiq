import React, { useState, useEffect, useRef } from 'react';
import { Loader2, ChevronDown, Check, Filter } from 'lucide-react';
import { Button, Card, Checkbox } from '../../../../shared/components/ui';
import { cn } from '../../../../shared/design-system';

const MultiSelectProtocolDropdown = ({ 
  protocols, 
  selectedProtocols, 
  onProtocolChange,
  loading,
  error 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDisplayText = () => {
    if (!selectedProtocols || selectedProtocols.length === 0) {
      return 'All Protocols';
    }
    
    // Handle "No Protocol" selection
    if (selectedProtocols.includes('no_protocol')) {
      return 'No Protocol';
    }
    
    if (selectedProtocols.length === 1) {
      const protocol = protocols.find(p => p.id === selectedProtocols[0]);
      return protocol?.name || 'Protocol';
    }
    
    if (selectedProtocols.length === 2) {
      const names = selectedProtocols.map(id => {
        const protocol = protocols.find(p => p.id === id);
        return protocol?.name?.split(' ')[0] || 'Protocol';
      });
      return names.join(' + ');
    }
    
    return `${selectedProtocols.length} Protocols`;
  };

  const toggleProtocol = async (protocolId) => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    
    try {
      let newSelection;
      
      // Special handling for "No Protocol" option
      if (protocolId === 'no_protocol') {
        if (selectedProtocols.includes('no_protocol')) {
          // Deselecting "no protocol" - show all protocols
          newSelection = [];
        } else {
          // Selecting "no protocol" - clear all other selections
          newSelection = ['no_protocol'];
        }
      } else {
        // Regular protocol selection
        const currentSelection = selectedProtocols.filter(id => id !== 'no_protocol');
        
        if (currentSelection.includes(protocolId)) {
          // Remove protocol
          newSelection = currentSelection.filter(id => id !== protocolId);
        } else {
          // Add protocol
          newSelection = [...currentSelection, protocolId];
        }
      }
      
      await onProtocolChange(newSelection);
    } catch (error) {
      console.error('Error updating protocol selection:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-2">
        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Loading protocols...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-600 p-2">
        Error loading protocols
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full justify-between text-left",
          isOpen && "ring-2 ring-primary-500"
        )}
        disabled={isUpdating}
      >
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="truncate">{getDisplayText()}</span>
        </div>
        <ChevronDown className={cn(
          "w-4 h-4 text-gray-400 transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50">
          <Card variant="elevated" padding="none" className="shadow-lg max-h-64 overflow-y-auto">
            
            {/* No Protocol Option */}
            <div className="p-2 border-b border-neutral-100">
              <div className={cn(
                "flex items-center space-x-2 p-2 rounded-md cursor-pointer transition-colors",
                selectedProtocols.includes('no_protocol') 
                  ? "bg-primary-50" 
                  : "hover:bg-gray-50"
              )}>
                <Checkbox
                  checked={selectedProtocols.includes('no_protocol')}
                  onChange={() => toggleProtocol('no_protocol')}
                  disabled={isUpdating}
                />
                <span className="text-sm font-medium text-gray-700">
                  No Protocol Filter
                </span>
              </div>
            </div>

            {/* Protocol Options */}
            <div className="p-2">
              {protocols.map((protocol) => {
                const isSelected = selectedProtocols.includes(protocol.id);
                const isDisabled = selectedProtocols.includes('no_protocol') || isUpdating;
                
                return (
                  <div
                    key={protocol.id}
                    className={cn(
                      "flex items-center space-x-2 p-2 rounded-md cursor-pointer transition-colors",
                      isSelected && !isDisabled && "bg-primary-50",
                      isDisabled ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"
                    )}
                    onClick={() => !isDisabled && toggleProtocol(protocol.id)}
                  >
                    <Checkbox
                      checked={isSelected}
                      disabled={isDisabled}
                      onChange={() => !isDisabled && toggleProtocol(protocol.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">
                        {protocol.name}
                      </p>
                      {protocol.description && (
                        <p className="text-xs text-gray-500 truncate">
                          {protocol.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-2 border-t border-neutral-100 bg-neutral-100">
              <p className="text-xs text-neutral-500 text-center">
                {selectedProtocols.length === 0 
                  ? "Showing all protocol data"
                  : `Filtering by ${selectedProtocols.length} protocol${selectedProtocols.length > 1 ? 's' : ''}`
                }
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MultiSelectProtocolDropdown;
