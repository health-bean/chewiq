import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Button, Card, Input, Textarea, Alert } from '../../../../shared/components/ui';
import { ACTIVITY_LEVELS, SLEEP_QUALITY_OPTIONS, CYCLE_DAY_OPTIONS } from '../../../../shared/constants/constants';
import SmartSymptomSelector from '../../components/common/SmartSymptomSelector';

// UPDATED VERSION - Cache Buster 2025-07-13-21:15

const ReflectionView = ({ 
  reflectionData, 
  updateReflectionData, 
  saveReflectionData,
  hasUnsavedChanges,
  loading,
  selectedDate
}) => {
  console.log('🔍 ReflectionView rendering with data:', reflectionData);
  
  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <CheckCircle2 size={20} className="text-green-600" />
          <h2 className="text-lg font-semibold">End of Day Reflection</h2>
        </div>
        {hasUnsavedChanges && (
          <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
            Unsaved changes
          </span>
        )}
      </div>

      {/* Sleep & Recovery */}
      <Card variant="primary">
        <Card.Header>
          <Card.Title>Sleep & Recovery</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bedtime</label>
                <Input
                  type="time"
                  value={reflectionData.bedtime}
                  onChange={(e) => updateReflectionData({ bedtime: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Wake Time</label>
                <Input
                  type="time"
                  value={reflectionData.wake_time}
                  onChange={(e) => updateReflectionData({ wake_time: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sleep Quality</label>
              <div className="flex space-x-4">
                {SLEEP_QUALITY_OPTIONS.map((quality) => (
                  <label key={quality} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="sleepQuality"
                      value={quality}
                      checked={reflectionData.sleep_quality === quality}
                      onChange={(e) => updateReflectionData({ sleep_quality: e.target.value })}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm capitalize">{quality}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sleep-Related Symptoms
              </label>
              <SmartSymptomSelector
                selectedSymptoms={reflectionData.sleep_symptoms || []}
                onSymptomsChange={(symptoms) => updateReflectionData({ sleep_symptoms: symptoms })}
                placeholder="Any pain, discomfort, or symptoms during sleep..."
                prioritizeUserHistory={true}
              />
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Daily Wellness Check */}
      <Card variant="warning">
        <Card.Header>
          <Card.Title>Daily Wellness Check</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Energy Level: {reflectionData.energy_level}/10
              </label>
              <div className="flex items-center space-x-2 text-xs text-gray-500 mb-1">
                <span>Exhausted</span>
                <div className="flex-1"></div>
                <span>Energized</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="10" 
                value={reflectionData.energy_level}
                onChange={(e) => updateReflectionData({ energy_level: parseInt(e.target.value) })}
                className="w-full" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mood: {reflectionData.mood_level}/10
              </label>
              <div className="flex items-center space-x-2 text-xs text-gray-500 mb-1">
                <span>Low/Stressed</span>
                <div className="flex-1"></div>
                <span>Great/Positive</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="10" 
                value={reflectionData.mood_level}
                onChange={(e) => updateReflectionData({ mood_level: parseInt(e.target.value) })}
                className="w-full" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Physical Comfort: {reflectionData.physical_comfort}/10
              </label>
              <div className="flex items-center space-x-2 text-xs text-gray-500 mb-1">
                <span>Pain/Discomfort</span>
                <div className="flex-1"></div>
                <span>Feeling Good</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="10" 
                value={reflectionData.physical_comfort}
                onChange={(e) => updateReflectionData({ physical_comfort: parseInt(e.target.value) })}
                className="w-full" 
              />
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Activity Level */}
      <Card variant="success">
        <Card.Header>
          <Card.Title>Activity Level</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="flex space-x-4">
            {Object.values(ACTIVITY_LEVELS).map((level) => (
              <label key={level} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="activityLevel"
                  value={level}
                  checked={reflectionData.activity_level === level}
                  onChange={(e) => updateReflectionData({ activity_level: e.target.value })}
                  className="text-green-600 focus:ring-green-500"
                />
                <span className="text-sm capitalize">{level}</span>
              </label>
            ))}
          </div>
        </Card.Content>
      </Card>

      {/* Mindfulness & Meditation */}
      <Card variant="indigo">
        <Card.Header>
          <Card.Title>Mindfulness & Meditation</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meditation Duration: {reflectionData.meditation_duration || 0} minutes
            </label>
            
            <div className="flex items-center space-x-4">
              <input 
                type="range" 
                min="0" 
                max="60" 
                value={reflectionData.meditation_duration || 0}
                onChange={(e) => updateReflectionData({ 
                  meditation_duration: parseInt(e.target.value),
                  meditation_practice: parseInt(e.target.value) > 0 
                })}
                className="flex-1" 
              />
              
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={reflectionData.meditation_duration || 0}
                  onChange={(e) => {
                    const minutes = Math.max(0, parseInt(e.target.value) || 0);
                    updateReflectionData({ 
                      meditation_duration: minutes,
                      meditation_practice: minutes > 0 
                    });
                  }}
                  className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <span className="text-sm text-gray-500">min</span>
              </div>
            </div>
            
            <div className="text-xs text-gray-500 mt-2">
              {(reflectionData.meditation_duration || 0) === 0 
                ? "Set to 0 if you didn't meditate today" 
                : `Great! ${reflectionData.meditation_duration} minutes of mindfulness practice`
              }
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Menstrual Cycle */}
      <Card variant="pink">
        <Card.Header>
          <Card.Title>Menstrual Cycle</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cycle Day</label>
              <div className="flex space-x-2">
                {CYCLE_DAY_OPTIONS.map((day) => (
                  <label key={day} className="flex items-center space-x-1">
                    <input 
                      type="radio" 
                      name="cycleDay" 
                      value={day} 
                      checked={reflectionData.cycle_day === day}
                      onChange={(e) => updateReflectionData({ cycle_day: e.target.value })}
                      className="text-pink-600 focus:ring-pink-500" 
                    />
                    <span className="text-xs">{day}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  checked={reflectionData.ovulation}
                  onChange={(e) => updateReflectionData({ ovulation: e.target.checked })}
                  className="rounded text-pink-600 focus:ring-pink-500" 
                />
                <span className="text-sm">Ovulation</span>
              </label>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Personal Reflection */}
      <Card variant="teal">
        <Card.Header>
          <Card.Title>Personal Reflection</Card.Title>
        </Card.Header>
        <Card.Content>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Daily Notes</label>
            <Textarea
              placeholder="How are you feeling overall today? Any patterns, insights, or anything else noteworthy..."
              value={reflectionData.personal_reflection}
              onChange={(e) => updateReflectionData({ personal_reflection: e.target.value })}
              rows={3}
            />
          </div>
        </Card.Content>
      </Card>

      {/* Save Button */}
      <Button 
        variant="success" 
        size="lg" 
        icon={CheckCircle2} 
        className="w-full"
        loading={loading}
        onClick={saveReflectionData}
      >
        {loading ? 'Saving...' : 'Save Reflection'}
      </Button>

      {/* Success message */}
      {!hasUnsavedChanges && !loading && reflectionData.bedtime && (
        <Alert variant="success" title="Reflection Saved">
          Your reflection for {selectedDate} has been saved successfully.
        </Alert>
      )}
    </div>
  );
};

export default ReflectionView;