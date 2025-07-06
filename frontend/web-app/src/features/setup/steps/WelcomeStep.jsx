import React from 'react';

const WelcomeStep = ({ updateSetupData, onNext }) => (
  <div className="space-y-6">
    <div className="text-center">
      <h3 className="text-2xl font-bold text-gray-900 mb-2">Welcome to FILO!</h3>
      <p className="text-gray-600">Let's set up your health journey. How would you like to begin?</p>
    </div>

    <div className="space-y-4">
      <button
        onClick={() => {
          updateSetupData({ setupType: 'quick' });
          onNext();
        }}
        className="w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors"
      >
        <div className="font-semibold text-gray-900">🚀 Quick Start (2 min)</div>
        <div className="text-sm text-gray-600">Jump right in and explore</div>
      </button>

      <button
        onClick={() => {
          updateSetupData({ setupType: 'full' });
          onNext();
        }}
        className="w-full p-4 text-left border-2 border-blue-500 bg-blue-50 rounded-lg"
      >
        <div className="font-semibold text-gray-900">📋 Full Setup (5 min)</div>
        <div className="text-sm text-gray-600">Get the complete personalized experience</div>
      </button>
    </div>
  </div>
);

export default WelcomeStep;