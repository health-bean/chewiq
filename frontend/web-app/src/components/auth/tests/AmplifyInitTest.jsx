// Basic test for Amplify initialization
import React, { useEffect, useState } from 'react';
import { Amplify } from 'aws-amplify';

// Import our Amplify initialization
import '../../../config/amplifyInit';

const AmplifyInitTest = () => {
  const [config, setConfig] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      // Get the current Amplify configuration
      const currentConfig = Amplify.getConfig();
      setConfig(currentConfig);
      console.log('✅ Amplify configuration loaded:', currentConfig);
    } catch (err) {
      setError(err.message);
      console.error('❌ Error loading Amplify configuration:', err);
    }
  }, []);

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Amplify Initialization Test</h2>
      
      {error ? (
        <div className="p-4 bg-red-100 border border-red-400 rounded-md mb-4">
          <h3 className="font-semibold text-red-800">Error</h3>
          <p className="text-red-700">{error}</p>
        </div>
      ) : (
        <div className="p-4 bg-green-100 border border-green-400 rounded-md mb-4">
          <h3 className="font-semibold text-green-800">
            {config ? '✅ Amplify Initialized Successfully' : 'Loading...'}
          </h3>
        </div>
      )}
      
      {config && (
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Configuration:</h3>
          <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-60">
            <pre className="text-xs">
              {JSON.stringify(config, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default AmplifyInitTest;
