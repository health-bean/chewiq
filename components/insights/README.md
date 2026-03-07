# Exercise Insights Component

## Overview

The `ExerciseInsights` component displays exercise-energy correlations to help users understand how different exercises affect their energy levels.

## Features

- **Visual Energy Impact**: Shows a bar chart indicating the magnitude of energy change
- **Color-Coded Indicators**: 
  - Green for energy boosts (positive correlations)
  - Red for energy drains (negative correlations)
- **Detailed Metrics**: Displays exercise type, intensity, average energy change, confidence level, and sample size
- **Smart Sorting**: Automatically sorts exercises by energy impact (highest boost to lowest)
- **Empty State**: Shows helpful message when fewer than 5 exercises are logged

## Usage

```tsx
import { ExerciseInsights } from "@/components/insights/ExerciseInsights";

// In your insights page
<ExerciseInsights insights={exerciseInsights} />
```

## Data Format

The component expects insights with the following structure:

```typescript
{
  id: string;
  type: "exercise-energy";
  trigger: "walking (light)"; // Format: "exerciseType (intensity)"
  effect: "energy_boost" | "energy_drain";
  confidence: 0.85; // 0-1 range
  percentage: 85; // 0-100 range
  occurrences: 10;
  opportunities: 12;
  impactScore: 2.5; // Average energy change in points
}
```

## Requirements Satisfied

- ✅ Requirement 4.1: Display exercise-energy correlations
- ✅ Requirement 4.2: Show exercise type, energy change, correlation strength, sample size
- ✅ Requirement 4.3: Sort by correlation strength
- ✅ Requirement 4.4: Green indicator for positive correlations
- ✅ Requirement 4.5: Red indicator for negative correlations
- ✅ Requirement 4.6: Visual chart showing energy impact
- ✅ Requirement 4.7: Empty state for insufficient data

## Integration

The component is integrated into the main insights page at `app/(app)/insights/page.tsx` and automatically filters exercise-energy insights from the overall insights data.
