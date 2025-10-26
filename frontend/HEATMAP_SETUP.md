# Player Heatmap Feature Setup

## Overview
This feature adds an interactive player heatmap visualization to the MyTeam page. Users can click on a player card to view their movement heatmap across analyzed matches.

## What Was Implemented

### 1. Supabase Client (`frontend/lib/supabase.ts`)
- Initializes Supabase client with environment variables
- Requires: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

### 2. Type Definitions (`frontend/types/heatmap.ts`)
- `TrackedPosition` - matches database structure
- `HeatmapData` - processed position data
- `MatchOption` - for match selector dropdown
- `PlayerPosition` - individual player coordinates

### 3. Custom Hook (`frontend/hooks/usePlayerHeatmap.ts`)
- `usePlayerHeatmap()` - fetches and processes player tracking data from Supabase
- `useAnalyzedMatches()` - fetches analyzed matches for a team
- Handles loading, error states, and data normalization

### 4. Heatmap Visualization (`frontend/components/PlayerHeatmap.tsx`)
- Canvas-based rendering with soccer field background
- Gradient density visualization (blue → green → yellow → red)
- Draws field markings (penalty boxes, center circle, goals)
- Position dots showing ball possession
- Responsive canvas sizing

### 5. Heatmap Modal (`frontend/components/PlayerHeatmapModal.tsx`)
- Dialog component for displaying heatmap
- Match selector dropdown
- Shows player info, loading states, and error messages
- Displays processed heatmap data

### 6. MyTeam Integration (`frontend/components/MyTeam.tsx`)
- Added state for selected player and modal visibility
- Made player cards clickable
- Added "View Heatmap" button to each player card
- Imports and renders PlayerHeatmapModal

## Required Environment Variables

You need to create a `.env` file in the `frontend/` directory with:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### How to Get These Values

1. **From Supabase Dashboard:**
   - Go to your Supabase project dashboard
   - Navigate to Settings → API
   - Copy the "URL" for `VITE_SUPABASE_URL`
   - Copy the "anon public" key for `VITE_SUPABASE_ANON_KEY`

2. **From Backend .env:**
   - The `SUPABASE_URL` is the same value as in backend
   - The anon key is different from service role key
   - Anon key has public read permissions (which matches our RLS policies)

## Usage

1. Navigate to MyTeam page
2. Click on any player card to open heatmap modal
3. Select which match to view from the dropdown
4. View interactive heatmap visualization
5. Color intensity shows movement frequency
6. Blue dots = normal movement, Orange dots = ball possession

## Technical Details

### Data Flow
```
User clicks player → Modal opens → Fetch analyzed matches → 
User selects match → Fetch tracked_positions data → 
Process coordinates → Render heatmap on canvas
```

### Database Query
```typescript
// Gets player positions for specific match and tracker
const { data } = await supabase
  .from('tracked_positions')
  .select('x_transformed, y_transformed, has_ball, speed')
  .eq('match_id', matchId)
  .eq('tracker_id', trackerId)
  .eq('object_type', 'player')
  .not('x_transformed', 'is', null)
  .not('y_transformed', 'is', null)
  .order('frame_number', { ascending: true });
```

### Canvas Heatmap Algorithm
1. Creates 30x30 density grid
2. Assigns weights to grid cells based on position frequency
3. Normalizes density values (0-1 range)
4. Applies color gradient based on density
5. Draws field markings on top layer

## Known Limitations

1. **Tracker ID Mapping:** Currently uses a random placeholder value. In production, you'll need to properly map `tracker_id` from match analysis data to actual player records.

2. **Coordinate System:** The heatmap assumes `x_transformed` and `y_transformed` are in meters (standard 105m x 68m field). Ensure your ML analysis outputs data in this format.

3. **Data Availability:** Only works with matches that have `status='analyzed'` and contain tracking data in the `tracked_positions` table.

## Troubleshooting

### "Missing Supabase environment variables" error
- Create `.env` file in `frontend/` directory
- Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Restart dev server

### No matches shown in dropdown
- Ensure matches have `status='analyzed'`
- Check that matches are associated with the correct team

### Heatmap shows "No tracking data available"
- Verify `tracked_positions` table has data for the selected match
- Check that `tracker_id` is properly mapped to the player
- Ensure `x_transformed` and `y_transformed` are not null

### Canvas not rendering
- Check browser console for errors
- Verify canvas element is properly mounted
- Ensure data.positions array is not empty

## Next Steps

1. Add proper tracker_id mapping from player records
2. Add more detailed match filtering options
3. Add heatmap export functionality
4. Add animation/timeline scrubber for temporal visualization
5. Add comparison mode (multiple players side-by-side)

