# StartReintroductionModal Component

A modal component that allows users to start a new food reintroduction trial. This component handles the complete workflow of selecting an eliminated food and initiating a 7-day reintroduction protocol.

## Features

- **Eliminated Foods Selection**: Fetches and displays foods that are eliminated from the user's protocol and ready for reintroduction
- **Smart Recommendations**: Shows recommendation reasons for each food (e.g., symptom-free days, low correlation)
- **Validation**: Prevents starting multiple active reintroductions and validates 14-day waiting period between tests
- **Clear Instructions**: Displays detailed 7-day protocol instructions (3 days testing + 4 days observation)
- **Error Handling**: Shows user-friendly error messages for validation failures and API errors
- **Loading States**: Displays loading indicators during data fetching and submission
- **Success Feedback**: Shows success message before closing the modal
- **Accessibility**: Includes proper ARIA labels and keyboard navigation support

## Usage

```tsx
import { StartReintroductionModal } from "@/components/reintroductions/StartReintroductionModal";

function MyComponent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const handleSuccess = () => {
    // Refresh reintroductions list, show notification, etc.
    console.log("Reintroduction started!");
  };

  return (
    <>
      <button onClick={() => setIsModalOpen(true)}>
        Start Reintroduction
      </button>

      <StartReintroductionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
        protocolId="user-protocol-id"
      />
    </>
  );
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | `boolean` | Yes | Controls whether the modal is visible |
| `onClose` | `() => void` | Yes | Callback function called when the modal should close |
| `onSuccess` | `() => void` | No | Callback function called after successfully starting a reintroduction |
| `protocolId` | `string` | Yes | The user's active protocol ID |

## API Integration

The component integrates with two API endpoints:

### GET /api/reintroductions/recommendations

Fetches eliminated foods that are ready for reintroduction. Returns:

```typescript
{
  recommendations: Array<{
    foodId: string;
    foodName: string;
    category: string;
    reason: string;
    symptomFreedays: number;
    priority: number;
  }>;
  total: number;
  message?: string; // If no foods available
}
```

### POST /api/reintroductions

Creates a new reintroduction trial. Expects:

```typescript
{
  foodId: string;
  foodName: string;
  protocolId: string;
}
```

Returns:

```typescript
{
  success: boolean;
  reintroduction: ReintroductionTrial;
  instructions: string;
}
```

## Validation

The component performs client-side validation:

1. **Food Selection**: Ensures a food is selected before submission
2. **Loading State**: Prevents submission while data is loading

The API performs server-side validation:

1. **Active Reintroduction**: Prevents starting a new reintroduction if one is already active
2. **Recent Test**: Prevents testing the same food within 14 days
3. **Protocol Validation**: Ensures the protocol exists and belongs to the user

## Error Handling

The component handles various error scenarios:

- **No Eliminated Foods**: Shows a message if no foods are available for reintroduction
- **API Errors**: Displays user-friendly error messages from the API
- **Network Errors**: Catches and displays network-related errors
- **Validation Errors**: Shows specific validation failure messages

## Reintroduction Protocol

The modal displays the following 7-day protocol:

### Testing Phase (Days 1-3)
- Eat the selected food once daily for 3 consecutive days
- Log each time you eat this food
- Monitor for any symptoms

### Observation Phase (Days 4-7)
- Avoid the food completely
- Continue monitoring symptoms
- Log any symptoms you experience

### Important Notes
- If severe symptoms occur, stop immediately and mark as failed
- The system automatically analyzes results on day 7
- Only one active reintroduction is allowed at a time

## Styling

The component uses Tailwind CSS classes and follows the application's design system:

- **Colors**: Indigo for primary actions, red for errors, green for success
- **Spacing**: Consistent padding and margins using Tailwind's spacing scale
- **Typography**: Uses the application's font stack with appropriate sizes
- **Borders**: Rounded corners (rounded-xl, rounded-2xl) for modern appearance
- **Shadows**: Subtle shadows for depth (shadow-xl on modal)

## Accessibility

The component includes accessibility features:

- **ARIA Labels**: Close button has `aria-label="Close modal"`
- **Keyboard Navigation**: Modal can be closed with Escape key (browser default)
- **Focus Management**: Form inputs are properly labeled
- **Required Fields**: Marked with asterisk and `required` attribute
- **Error Messages**: Associated with form fields for screen readers
- **Disabled States**: Buttons are properly disabled during submission

## Related Components

- `ReintroductionCard`: Displays active reintroduction progress
- `ReintroductionHistory`: Shows past reintroduction trials
- `ReintroductionDetail`: Displays detailed results of a completed trial
- `ReintroductionRecommendations`: Shows recommended foods for reintroduction

## Requirements Satisfied

This component satisfies the following requirements from the spec:

- **5.1**: Provides "Start Reintroduction" interface
- **5.2**: Requires user to select food from eliminated foods list
- **5.4**: Validates no active reintroduction exists (via API)
- **5.5**: Enforces maximum 1 active reintroduction at a time (via API)
- **5.6**: Displays instructions for 7-day protocol (3 days testing + 4 days observation)

## Testing

To test this component:

1. **Happy Path**: Select a food and submit successfully
2. **No Foods Available**: Test when user has no eliminated foods
3. **Active Reintroduction**: Test when user already has an active reintroduction
4. **Recent Test**: Test when food was tested within 14 days
5. **Network Error**: Test with network disconnected
6. **Cancel**: Test closing modal without submitting
7. **Loading State**: Test with slow network to see loading indicators

## Future Enhancements

Potential improvements for future iterations:

- Add food search/filter for long lists of eliminated foods
- Show nutritional information for selected food
- Display historical test results for the selected food
- Add confirmation dialog for foods with previous failed tests
- Support bulk selection for testing multiple foods sequentially
- Add calendar integration to schedule reintroduction start date
