# ProtocolComplianceWarning Component

A warning component that displays when a user attempts to log a food that violates their active protocol restrictions.

## Purpose

This component alerts users when they're about to log a food that contains properties not allowed on their current dietary protocol (e.g., AIP, Low Histamine, Low FODMAP). It provides clear information about the specific violations and allows users to either cancel or proceed with logging the food.

## Features

- **Clear Warning Display**: Uses amber/yellow warning colors and an alert triangle icon
- **Specific Violations**: Lists all properties that violate the protocol
- **Protocol Context**: Shows which protocol the violations apply to
- **User Choice**: Provides both "Cancel" and "Proceed Anyway" options
- **Responsive Design**: Mobile-first layout with stacked buttons on small screens
- **Accessibility**: Semantic HTML with proper ARIA considerations

## Usage

```tsx
import { ProtocolComplianceWarning } from "@/components/foods/ProtocolComplianceWarning";

function FoodLoggingFlow() {
  const [showWarning, setShowWarning] = useState(false);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);

  const handleFoodSelect = (food: Food) => {
    // Check protocol compliance
    if (food.protocolStatus === "avoid") {
      setSelectedFood(food);
      setShowWarning(true);
    } else {
      logFood(food);
    }
  };

  const handleProceed = () => {
    if (selectedFood) {
      logFood(selectedFood);
      setShowWarning(false);
    }
  };

  const handleCancel = () => {
    setShowWarning(false);
    setSelectedFood(null);
  };

  return (
    <>
      {showWarning && selectedFood && (
        <ProtocolComplianceWarning
          food={selectedFood}
          protocol={currentProtocol}
          violations={["high histamine", "nightshade"]}
          onProceed={handleProceed}
          onCancel={handleCancel}
        />
      )}
    </>
  );
}
```

## Props

### `food` (required)
- **Type**: `Food`
- **Description**: The food object that violates protocol restrictions
- Contains food name, category, and trigger properties

### `protocol` (required)
- **Type**: `Protocol`
- **Description**: The user's active protocol
- Used to display the protocol name in the warning message

### `violations` (required)
- **Type**: `string[]`
- **Description**: Array of specific property violations
- Examples: `["high histamine", "nightshade", "high oxalate"]`
- Should be human-readable strings describing what's not allowed

### `onProceed` (required)
- **Type**: `() => void`
- **Description**: Callback function when user clicks "Proceed Anyway"
- Should handle logging the food despite the warning

### `onCancel` (required)
- **Type**: `() => void`
- **Description**: Callback function when user clicks "Cancel"
- Should close the warning and return to food selection

## Styling

The component uses:
- **Amber/Yellow color scheme**: Warning colors (amber-50, amber-300, amber-600, amber-800, amber-900)
- **Border**: 2px amber border for emphasis
- **Icon**: AlertTriangle from lucide-react
- **Buttons**: Uses the app's Button component with "ghost" and "danger" variants
- **Responsive**: Stacked buttons on mobile, horizontal on desktop

## Integration Points

This component is designed to be used in:

1. **Chat Interface**: When AI detects a non-compliant food mention
2. **Quick-Add Food Logging**: When user selects a non-compliant food from search
3. **Food Search Results**: Can be shown inline or as a modal

## Requirements Satisfied

- **17.3**: Display warning message with specific violations
- **17.4**: Show "This food contains [property] which is not allowed on [Protocol]"
- **17.5**: Provide "Proceed Anyway" and "Cancel" buttons
- **17.7**: Apply warning styling with icon

## Accessibility

- Uses semantic HTML structure
- Color is not the only indicator (icon + text)
- Buttons have clear, descriptive labels
- Keyboard navigable
- Screen reader friendly with proper text hierarchy

## Example Violations

Common violation strings to pass:
- `"high histamine"`
- `"nightshade"`
- `"high oxalate"`
- `"high lectin"`
- `"high FODMAP"`
- `"high salicylate"`
- `"dairy"`
- `"gluten"`

## Notes

- The component is intentionally non-modal to allow flexibility in implementation
- Parent components can wrap it in a modal/dialog if needed
- The "Proceed Anyway" button uses the "danger" variant to emphasize the action
- Violations should be formatted as human-readable strings, not raw property names
