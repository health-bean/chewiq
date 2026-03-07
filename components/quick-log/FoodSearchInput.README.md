# FoodSearchInput Component

A React component that provides intelligent food search with autocomplete, protocol compliance checking, and keyboard navigation.

## Features

✅ **Debounced Search** - 200ms delay to reduce API calls  
✅ **Autocomplete Dropdown** - Up to 10 results with food details  
✅ **Protocol Compliance** - Visual indicators for allowed/avoid/moderation status  
✅ **Keyboard Navigation** - Arrow keys, Enter, and Escape support  
✅ **Loading States** - Spinner during search, clear button when typing  
✅ **Accessibility** - Full keyboard support and screen reader friendly  

## Usage

```tsx
import { FoodSearchInput } from "@/components/quick-log/FoodSearchInput";
import type { Food } from "@/types";

function MyComponent() {
  const handleFoodSelect = (food: Food) => {
    console.log("Selected:", food);
    // Handle food selection
  };

  return (
    <FoodSearchInput
      onSelect={handleFoodSelect}
      protocolId="optional-protocol-id"
      placeholder="Search for a food..."
      autoFocus={false}
    />
  );
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onSelect` | `(food: Food) => void` | Yes | Callback when a food is selected |
| `protocolId` | `string` | No | User's protocol ID for compliance checking |
| `placeholder` | `string` | No | Input placeholder text (default: "Search for a food...") |
| `autoFocus` | `boolean` | No | Auto-focus input on mount (default: false) |

## Food Object Structure

```typescript
interface Food {
  id: string;
  displayName: string;
  categoryName: string;
  subcategoryName: string;
  protocolStatus?: "allowed" | "avoid" | "moderation" | "unknown";
  triggerProperties: {
    nightshade: boolean;
    histamine: TriggerLevel;
    oxalate: TriggerLevel;
    lectin: TriggerLevel;
    fodmap: TriggerLevel;
    salicylate: TriggerLevel;
  };
}
```

## API Integration

The component calls the `/api/foods/search` endpoint:

```
GET /api/foods/search?query={query}&limit=10&protocolId={protocolId}
```

**Response:**
```json
{
  "foods": [
    {
      "id": "uuid",
      "displayName": "Tomato",
      "categoryName": "Vegetables",
      "subcategoryName": "Nightshades",
      "protocolStatus": "avoid",
      "triggerProperties": { ... }
    }
  ]
}
```

## Keyboard Shortcuts

- **↓ Arrow Down** - Navigate to next result
- **↑ Arrow Up** - Navigate to previous result
- **Enter** - Select highlighted result
- **Escape** - Close dropdown

## Requirements Validated

This component satisfies the following requirements from the spec:

- **15.6** - Food search input with real-time autocomplete
- **15.7** - Display matching foods after 2 characters
- **20.1** - Search results within 200 milliseconds (via debouncing)

## Implementation Details

### Debouncing
- Uses `setTimeout` with 200ms delay
- Clears previous timer on each keystroke
- Prevents excessive API calls

### Keyboard Navigation
- Maintains `selectedIndex` state for highlighted item
- Scrolls selected item into view automatically
- Prevents default browser behavior for arrow keys

### Click Outside Detection
- Uses `useEffect` with event listener
- Closes dropdown when clicking outside component
- Cleans up listener on unmount

### Loading States
- Shows spinner icon during API call
- Displays clear button (X) when input has text
- Handles error states with visual feedback

## Examples

See `FoodSearchInput.example.tsx` for comprehensive usage examples including:
- Basic usage
- Protocol compliance handling
- Form integration
- Custom styling
- Loading state management

## Testing

The component is designed to work with the existing `/api/foods/search` endpoint which:
- Returns up to 10 results
- Supports fuzzy matching (80% similarity threshold)
- Includes protocol compliance checking
- Handles both standard and custom foods

## Notes

- Minimum 2 characters required to trigger search
- Maximum 10 results displayed (as per requirements)
- Protocol status only shown when `protocolId` is provided
- Component is fully controlled (manages its own state)
