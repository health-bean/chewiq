# Component Library

## Overview

The Health Platform includes 19 React components:
- **6 Shared Components** - Reusable across all applications
- **13 App Components** - Application-specific components

## Shared Components

### Alert

**File:** `frontend/shared/components/ui/Alert.jsx`  
**Type:** unknown  
**Description:** Displays notification and alert messages with customizable variants and dismissal options

**Props:**
```javascript
{ Info, CheckCircle2, AlertCircle, X }
{ 
  variant = 'info', 
  title, 
  children, 
  dismissible = false, 
  onDismiss,
  className = ''
}
```

**Usage:**
```jsx
import { Alert } from '@/shared/components/ui';

<Alert variant="success" title="Success!">
  Operation completed successfully
</Alert>
```

### Button

**File:** `frontend/shared/components/ui/Button.jsx`  
**Type:** unknown  
**Description:** Interactive button component with loading states, variants, and icon support

**Props:**
```javascript
{ Loader2 }
{ 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  loading = false, 
  icon: Icon, 
  children, 
  className = '',
  ...props 
}
```

**Usage:**
```jsx
import { Button } from '@/shared/components/ui';

<Button variant="primary" loading={isLoading}>
  Save Changes
</Button>
```

### Card

**File:** `frontend/shared/components/ui/Card.jsx`  
**Type:** unknown  
**Description:** Container component with optional title, subtitle, icon, and content sections

**Props:**
```javascript
{ 
  title, 
  subtitle, 
  icon: Icon, 
  variant = 'default',
  children, 
  className = '' 
}
{
  const variants = {
    default: 'bg-white border-gray-200',
    primary: 'bg-blue-50 border-blue-200',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-orange-50 border-orange-200',
    purple: 'bg-purple-50 border-purple-200',
    indigo: 'bg-indigo-50 border-indigo-200',
    pink: 'bg-pink-50 border-pink-200',
    teal: 'bg-teal-50 border-teal-200'
  }
```

**Usage:**
```jsx
import { Card } from '@/shared/components/ui';

<Card title="Card Title" variant="primary">
  Card content goes here
</Card>
```

### Input

**File:** `frontend/shared/components/ui/Input.jsx`  
**Type:** unknown  
**Description:** Form input component with focus colors, validation, and styling options

**Props:**
```javascript
{ 
  type = 'text',
  placeholder = '',
  value,
  onChange,
  disabled = false,
  className = '',
  focusColor = 'blue', // blue, green, purple, orange, etc.
  ...props 
}
{
  const focusColors = {
    blue: 'focus:ring-blue-500 focus:border-transparent',
    green: 'focus:ring-green-500 focus:border-transparent',
    purple: 'focus:ring-purple-500 focus:border-transparent',
    orange: 'focus:ring-orange-500 focus:border-transparent',
    indigo: 'focus:ring-indigo-500 focus:border-transparent',
    teal: 'focus:ring-teal-500 focus:border-transparent',
    pink: 'focus:ring-pink-500 focus:border-transparent'
  }
```

**Usage:**
```jsx
import { Input } from 'frontend/shared/components/ui/Input';

<Input />
```

### Select

**File:** `frontend/shared/components/ui/Select.jsx`  
**Type:** unknown  
**Description:** Dropdown selection component with customizable styling and focus colors

**Props:**
```javascript
{ 
  value,
  onChange,
  disabled = false,
  className = '',
  focusColor = 'blue', // blue, green, purple, orange, etc.
  children,
  ...props 
}
{
  const focusColors = {
    blue: 'focus:ring-blue-500 focus:border-transparent',
    green: 'focus:ring-green-500 focus:border-transparent',
    purple: 'focus:ring-purple-500 focus:border-transparent',
    orange: 'focus:ring-orange-500 focus:border-transparent',
    indigo: 'focus:ring-indigo-500 focus:border-transparent',
    teal: 'focus:ring-teal-500 focus:border-transparent',
    pink: 'focus:ring-pink-500 focus:border-transparent'
  }
```

**Usage:**
```jsx
import { Select } from 'frontend/shared/components/ui/Select';

<Select />
```

### Textarea

**File:** `frontend/shared/components/ui/Textarea.jsx`  
**Type:** unknown  
**Description:** Multi-line text input with configurable rows and styling options

**Props:**
```javascript
{ 
  placeholder = '',
  value,
  onChange,
  disabled = false,
  rows = 3,
  className = '',
  focusColor = 'blue', // blue, green, purple, orange, etc.
  ...props 
}
{
  const focusColors = {
    blue: 'focus:ring-blue-500 focus:border-transparent',
    green: 'focus:ring-green-500 focus:border-transparent',
    purple: 'focus:ring-purple-500 focus:border-transparent',
    orange: 'focus:ring-orange-500 focus:border-transparent',
    indigo: 'focus:ring-indigo-500 focus:border-transparent',
    teal: 'focus:ring-teal-500 focus:border-transparent',
    pink: 'focus:ring-pink-500 focus:border-transparent'
  }
```

**Usage:**
```jsx
import { Textarea } from 'frontend/shared/components/ui/Textarea';

<Textarea />
```


## Application Components

### Alert

**File:** `frontend/shared/components/ui/Alert.jsx`  
**Type:** unknown  
**Description:** Displays notification and alert messages with customizable variants and dismissal options

### Button

**File:** `frontend/shared/components/ui/Button.jsx`  
**Type:** unknown  
**Description:** Interactive button component with loading states, variants, and icon support

### Card

**File:** `frontend/shared/components/ui/Card.jsx`  
**Type:** unknown  
**Description:** Container component with optional title, subtitle, icon, and content sections

### Input

**File:** `frontend/shared/components/ui/Input.jsx`  
**Type:** unknown  
**Description:** Form input component with focus colors, validation, and styling options

### Select

**File:** `frontend/shared/components/ui/Select.jsx`  
**Type:** unknown  
**Description:** Dropdown selection component with customizable styling and focus colors

### Textarea

**File:** `frontend/shared/components/ui/Textarea.jsx`  
**Type:** unknown  
**Description:** Multi-line text input with configurable rows and styling options

### App

**File:** `frontend/web-app/src/App.jsx`  
**Type:** functional-hooks  
**Description:** Import shared components and hooks

### SetupWizard

**File:** `frontend/web-app/src/features/setup/SetupWizard.jsx`  
**Type:** unknown  
**Description:** Import step components

### DetoxStep

**File:** `frontend/web-app/src/features/setup/steps/DetoxStep.jsx`  
**Type:** unknown  
**Description:** DetoxStep component for the application

### FoodsStep

**File:** `frontend/web-app/src/features/setup/steps/FoodsStep.jsx`  
**Type:** unknown  
**Description:** FoodsStep component for the application

### SupplementsStep

**File:** `frontend/web-app/src/features/setup/steps/SupplementsStep.jsx`  
**Type:** unknown  
**Description:** SupplementsStep component for the application

### SymptomsStep

**File:** `frontend/web-app/src/features/setup/steps/SymptomsStep.jsx`  
**Type:** unknown  
**Description:** SymptomsStep component for the application

### useSetupWizard

**File:** `frontend/web-app/src/features/setup/useSetupWizard.js`  
**Type:** functional-hooks  
**Description:** useSetupWizard component for the application


## Custom Hooks

### useDetoxTypes

**File:** `frontend/shared/hooks/useDetoxTypes.js`  
**Returns:** `{ detoxTypes, loading }`  
**Description:** Custom React hook: useDetoxTypes

**Usage:**
```jsx
const result = useDetoxTypes();
```

### useExposureTypes

**File:** `frontend/shared/hooks/useExposureTypes.js`  
**Returns:** `{ exposureTypes, loading }`  
**Description:** Custom React hook: useExposureTypes

**Usage:**
```jsx
const result = useExposureTypes();
```

### useProtocols

**File:** `frontend/shared/hooks/useProtocols.js`  
**Returns:** `{ protocols, loading, error }`  
**Description:** Custom React hook: useProtocols

**Usage:**
```jsx
const result = useProtocols();
```

### useUserPreferences

**File:** `frontend/shared/hooks/useUserPreferences.js`  
**Returns:** `{ 
    preferences, 
    updatePreferences, 
    loading,
    error,
    isReady: preferences !== null 
  }`  
**Description:** Custom React hook: useUserPreferences

**Usage:**
```jsx
const result = useUserPreferences();
```

### useSetupWizard

**File:** `frontend/web-app/src/features/setup/useSetupWizard.js`  
**Returns:** `{
    currentStep,
    setupData,
    steps,
    maxSteps,
    handleNext,
    handleBack,
    updateSetupData,
    isFirst: currentStep === 0,
    isLast: currentStep === maxSteps - 1
  }`  
**Description:** Custom React hook: useSetupWizard

**Usage:**
```jsx
const result = useSetupWizard();
```

### useReflectionData

**File:** `frontend/web-app/src/hooks/useReflectionData.js`  
**Returns:** `{
    reflectionData,
    updateReflectionData,
    saveReflectionData,
    loading,
    hasUnsavedChanges
  }`  
**Description:** Custom React hook: useReflectionData

**Usage:**
```jsx
const result = useReflectionData();
```


---

*Component documentation is automatically generated from code analysis.*
