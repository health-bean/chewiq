export const getEntryIcon = (type) => ({
  food: '🍽️',
  symptom: '⚠️',
  supplement: '💊',
  medication: '💉',
  exposure: '🏭',
  detox: '🧘'
}[type] || '📝');

// Protocol-first coloring - what users actually care about
export const getEntryColor = (type, protocolCompliant) => {
  // For food entries, use protocol compliance colors
  if (type === 'food') {
    if (protocolCompliant === true) return 'protocol-allowed';    // Green
    if (protocolCompliant === false) return 'protocol-avoid';     // Red  
    if (protocolCompliant === 'reintroduction') return 'protocol-reintroduction'; // Orange
    return 'protocol-unknown';  // Gray for unknown compliance
  }
  
  // For all non-food entries, use consistent info blue
  return 'status-info';  // Blue for symptoms, supplements, medications, detox, exposure
};

export const getProtocolDisplayText = (selectedProtocols, protocols) => {
  if (!selectedProtocols || selectedProtocols.length === 0) return 'No protocols selected';
  
  // Handle "No Protocol" selection
  if (selectedProtocols.includes('no_protocol')) {
    return 'No Protocol';
  }
  
  const selectedProtocolObjects = protocols.filter(p => 
    selectedProtocols.includes(p.id)
  );
  
  if (selectedProtocols.length === 1) {
    return selectedProtocolObjects[0]?.name || 'Protocol';
  }
  if (selectedProtocols.length === 2) {
    const names = selectedProtocolObjects.map(p => p.name.split(' ')[0]);
    return names.join(' + ');
  }
  return `${selectedProtocols.length} Active Protocols`;
};