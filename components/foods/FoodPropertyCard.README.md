# FoodPropertyCard Component

A React component that displays food trigger properties with color-coded indicators and informative tooltips.

## Features

- **Color-Coded Indicators**: Visual representation of trigger levels
  - Green: Low/None (safe)
  - Yellow: Moderate (caution)
  - Red: High/Very High (warning)
  - Gray: Unknown
- **Interactive Tooltips**: Hover over any property to see detailed explanations
- **Responsive Design**: Mobile-first layout that adapts to different screen sizes
- **Graceful Handling**: Automatically hides unknown or missing properties
- **Comprehensive Coverage**: Supports all trigger properties including optional ones

## Props

```typescript
interface FoodPropertyCardProps {
  properties: FoodTriggerProperties;
  className?: string;
}
```

### `properties` (required)

The food trigger properties object containing:

**Required Properties:**
- `nightshade`: boolean - Whether the food is a nightshade
- `histamine`: TriggerLevel - Histamine content level
- `oxalate`: TriggerLevel - Oxalate content level
- `lectin`: TriggerLevel - Lectin content level
- `fodmap`: TriggerLevel - FODMAP content level
- `salicylate`: TriggerLevel - Salicylate content level

**Optional Properties:**
- `amines`: TriggerLevel - Amine content level
- `glutamates`: TriggerLevel - Glutamate content level
- `sulfites`: TriggerLevel - Sulfite content level
- `goitrogens`: TriggerLevel - Goitrogen content level
- `purines`: TriggerLevel - Purine content level
- `phytoestrogens`: TriggerLevel - Phytoestrogen content level
- `phytates`: TriggerLevel - Phytate content level
- `tyramine`: TriggerLevel - Tyramine content level

**TriggerLevel Type:**
```typescript
type TriggerLevel = "none" | "low" | "moderate" | "high" | "very_high" | "unknown";
```

### `className` (optional)

Additional CSS classes to apply to the component container.

## Usage

### Basic Usage

```tsx
import { FoodPropertyCard } from "@/components/foods/FoodPropertyCard";

function FoodDetail({ food }) {
  return (
    <div>
      <h1>{food.displayName}</h1>
      <FoodPropertyCard properties={food.triggerProperties} />
    </div>
  );
}
```

### With Custom Styling

```tsx
<FoodPropertyCard 
  properties={food.triggerProperties} 
  className="mt-4 shadow-lg"
/>
```

### In a Food Search Result

```tsx
function FoodSearchResult({ food }) {
  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-semibold">{food.displayName}</h3>
      <p className="text-sm text-slate-600">{food.categoryName}</p>
      <FoodPropertyCard 
        properties={food.triggerProperties} 
        className="mt-3"
      />
    </div>
  );
}
```

## Behavior

### Property Display Logic

1. **Nightshade (Boolean)**:
   - Shows "Yes" (red) if true
   - Shows "No" (green) if false
   - Hidden if undefined

2. **Level-Based Properties**:
   - Only displayed if value is not "unknown"
   - Color-coded based on level:
     - None/Low: Green
     - Moderate: Yellow
     - High/Very High: Red
     - Unknown: Gray (but typically hidden)

3. **Empty State**:
   - If no properties are available to display, shows a message:
     "No trigger property information available for this food."

### Tooltips

Each property badge includes an info icon. Hovering over or clicking a badge displays a tooltip with:
- Detailed explanation of what the property is
- Why it matters for people with sensitivities
- Common symptoms or concerns

**Tooltip Descriptions:**

- **Nightshade**: Explains alkaloids and inflammation triggers
- **Histamine**: Describes histamine intolerance symptoms
- **Oxalate**: Discusses kidney stones and inflammation
- **Lectin**: Explains nutrient absorption interference
- **FODMAP**: Describes IBS-related digestive symptoms
- **Salicylate**: Discusses salicylate sensitivity
- And more for all optional properties...

## Accessibility

- **Keyboard Navigation**: Tooltips can be triggered by clicking (mobile-friendly)
- **Semantic HTML**: Uses proper heading and list structures
- **Color + Text**: Never relies on color alone (includes text labels)
- **Cursor Hints**: `cursor-help` indicates interactive elements

## Responsive Design

The component uses Tailwind's responsive utilities:
- **Mobile**: Properties wrap into multiple rows
- **Tablet/Desktop**: Properties display in a flexible grid
- **Touch-Friendly**: Larger touch targets for mobile users

## Examples

See `FoodPropertyCard.example.tsx` for comprehensive usage examples including:
- High-trigger foods (tomatoes, aged cheese)
- Low-trigger foods (cucumber)
- Foods with optional properties
- Foods with unknown properties
- Custom styling examples

## Testing

Unit tests are available in `FoodPropertyCard.test.tsx` covering:
- Color coding logic for all trigger levels
- Property filtering (hiding unknown values)
- Empty state handling
- Boolean vs. level-based property handling
- Optional property support

Run tests with:
```bash
npm test -- components/foods/FoodPropertyCard.test.tsx
```

## Requirements Satisfied

This component satisfies the following requirements from the Phase 1 spec:

- **16.1**: Displays all associated food trigger properties
- **16.2**: Stores and displays multiple property types (oxalate, histamine, lectin, etc.)
- **16.3**: Uses visual indicators with color coding (low=green, medium=yellow, high=red)
- **16.4**: Omits non-applicable properties from display
- **16.5**: Can be integrated into chat interface for food confirmation
- **16.6**: Can be displayed in quick-add interface as property summary card

## Related Components

- `FoodSearchInput`: Uses this component to display properties in search results
- `CustomFoodForm`: Allows users to set these properties when creating custom foods
- `ProtocolComplianceWarning`: Works alongside this to show protocol violations

## Future Enhancements

Potential improvements for future iterations:
- Add property filtering/sorting options
- Include links to learn more about each property
- Add visual charts for property levels
- Support for custom property definitions
- Internationalization for property descriptions
