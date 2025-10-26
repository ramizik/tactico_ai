# Reka AI Plugin Components

This directory contains reusable Reka AI components that can be integrated anywhere in the application.

## Components

### `RekaVideoAnalysisButton`

A button component that opens the Reka AI video analysis modal. This is the easiest way to add Reka AI functionality to any page.

**Props:**
- `label` (optional): Text to display on the button. Defaults to "Try Reka AI"
- `className` (optional): Additional CSS classes for custom styling

**Usage:**

```tsx
import { RekaVideoAnalysisButton } from '../plugins';

// Simple usage
<RekaVideoAnalysisButton />

// With custom label
<RekaVideoAnalysisButton label="Analyze with AI" />

// With custom styling
<RekaVideoAnalysisButton 
  label="Run Analysis" 
  className="my-custom-class" 
/>
```

### `RekaVideoAnalysis`

The main modal component for video analysis. You can use this directly if you need more control over the UI.

**Props:**
- `onClose`: Callback function when the modal is closed

**Usage:**

```tsx
import { RekaVideoAnalysis } from '../plugins';

const [isOpen, setIsOpen] = useState(false);

return (
  <>
    <button onClick={() => setIsOpen(true)}>Open Reka AI</button>
    {isOpen && <RekaVideoAnalysis onClose={() => setIsOpen(false)} />}
  </>
);
```

## Features

- **Self-contained**: All state management is handled internally
- **Theme-aware**: Automatically uses your app's theme
- **Customizable**: Easy to customize appearance and behavior
- **Reusable**: Can be added to any component in your app

## Example Integration

```tsx
// Dashboard.tsx
import { RekaVideoAnalysisButton } from '../plugins';

export const Dashboard = () => {
  return (
    <div>
      <h1>Dashboard</h1>
      <RekaVideoAnalysisButton />
      {/* ... rest of your dashboard */}
    </div>
  );
};
```

```tsx
// MyTeam.tsx
import { RekaVideoAnalysisButton } from '../plugins';

export const MyTeam = () => {
  return (
    <div>
      <h1>My Team</h1>
      <div className="actions">
        <RekaVideoAnalysisButton label="Analyze Video" />
      </div>
      {/* ... rest of your team page */}
    </div>
  );
};
```

## Backend API

The plugin communicates with the following backend endpoints:

- `POST /api/reka/upload-demo` - Uploads video to Reka AI
- `POST /api/reka/analyze-demo` - Analyzes uploaded video

Make sure your backend is running with the Reka AI integration enabled.

