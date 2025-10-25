# Claude Code Assistant - TacticoAI Project Context

## 🎯 Project Overview
**TacticoAI** is an AI-powered SaaS platform that helps college, semi-pro, and high school soccer and basketball coaches analyze their games automatically. The system uses Computer Vision to extract player/ball tracking data, analyzes tactical patterns with LLM reasoning, and provides interactive voice-enabled "AI Coach" for follow-up tactical Q&A.

## 🚀 Current Status (Figma Make System)
- **Frontend**: 100% complete with React + TypeScript + Tailwind CSS + shadcn/ui
- **Mock Data**: Fully implemented with typed fixtures and fake services
- **Backend**: Ready for integration (FastAPI + Supabase + Letta AI + Vapi)
- **AI Pipeline**: Planned (YOLO + ByteTrack + OpenCV for computer vision)
- **Demo Ready**: Full mock data implementation for hackathon presentation
- **Offline Capable**: All code compiles and runs without network connectivity

## 🛠️ Full Stack Tech Stack

### **Frontend (Implemented - Figma Make System)**
- **React 18.3.1** with TypeScript
- **Vite 6.3.5** for fast development and building
- **Tailwind CSS 4.1.3** with custom design tokens
- **shadcn/ui** component library (40+ components)
- **Radix UI** primitives for accessibility
- **Lucide React** for consistent iconography
- **React Router** for client-side navigation
- **React Context** for global UI state (theme, session, demo flags)
- **Custom theme system** with university/sport switching
- **Mock data services** with typed fixtures and fake API calls
- **Offline-first** development with no network dependencies

### **Backend (Ready for Integration)**
- **FastAPI** (Python) for API endpoints
- **Supabase** for authentication, database, and file storage
- **PostgreSQL** database with real-time subscriptions
- **Letta AI** (Sonnet 4.5) for LLM tactical analysis
- **Vapi** for voice-based conversational AI
- **OpenCV + YOLOv8 + ByteTrack** for computer vision pipeline

### **Deployment**
- **Vercel** for frontend hosting
- **Railway/Render** for backend API and worker processes
- **Supabase** for database and storage

## 🧠 AI & Data Flow
```
Upload Video → Supabase Storage → CV Worker (YOLO+OpenCV)
↓
Events & Metrics JSON -> Store in Supabase
↓
Letta (LLM RAG) → AI Summary + Tactical Insights
↓
Frontend Visualization + Voice Coach (Vapi)
```

## 📊 Data Structures

### **Match Analysis JSON**
```typescript
interface Analysis {
  matchId: string;
  summary: string;
  formation: { team: string; opponent: string; confidence: number };
  metrics: {
    possessionPct: number;
    pressIndex: number;
    widthM: number;
    compactness: number;
    shots: number
  };
  events: {
    id: string; minute: number; type: 'line_break'|'shot'|'turnover'|'press_trigger';
    player?: number; zone?: string
  }[];
  playerStats: {
    playerId: string; jersey: number; xfactor?: string; involvements?: number
  }[];
}
```

### **API Endpoints (Planned)**
- `POST /api/matches` - Upload video and create analysis job
- `GET /api/jobs/:id` - Check job status (queued/running/completed/failed)
- `GET /api/analyses/:matchId` - Get tactical analysis results
- `GET /api/matches/:id` - Get match details and video URL
- `GET /api/players` - Team roster management
- `GET /api/team/:id/form` - Team performance metrics

## 🎨 Theme System
Dynamic theming based on university + sport selection:
- **Universities**: UOP (Orange/Black), UC California (Blue/Gold)
- **Sports**: Football (Green), Basketball (Orange)
- **CSS Variables**: `--color-primary`, `--color-secondary`, `--color-accent`
- **Responsive**: Mobile-first design with desktop optimization

## 🔧 Development Patterns (Figma Make System)

### **Frontend Components**
- **TypeScript first** with strict typing
- **JSDoc comments** with BACKEND_HOOK annotations
- **Mock data** in `/src/mocks` folder with typed fixtures
- **shadcn/ui** components with Tailwind CSS
- **Accessibility** with ARIA labels and keyboard navigation
- **Data-testids** for testing
- **React Context** for global state management
- **Offline-first** development with no network calls
- **Demo-ready** interactions with fake job queues and status updates

### **Backend Integration Points**
- **Authentication**: Supabase Auth with session management
- **File Upload**: Supabase Storage with progress tracking
- **Job Queue**: PostgreSQL jobs table with status polling
- **AI Pipeline**: Async worker with CV processing
- **Real-time**: Supabase real-time subscriptions for job updates

## 🐛 Common Issues & Solutions

### **Frontend-Backend Integration**
- **CORS issues**: Ensure FastAPI CORS middleware is configured
- **Authentication**: Check Supabase session tokens in requests
- **File uploads**: Verify Supabase storage bucket permissions
- **Real-time updates**: Ensure WebSocket connections are stable

### **Data Flow Issues**
- **Job status**: Implement proper polling with exponential backoff
- **Error handling**: Wrap all API calls in try-catch with user feedback
- **Type safety**: Ensure TypeScript types match API responses
- **State management**: Use Zustand for global state, React Query for server state

### **Performance Optimization**
- **Video processing**: Use YOLO tiny model for faster inference
- **Caching**: Implement proper cache invalidation for analysis results
- **Bundle size**: Tree-shake unused components and libraries
- **Image optimization**: Use WebP format for thumbnails

## 🧪 Testing Strategy
- **Unit tests**: Pure utility functions and hooks
- **Integration tests**: API endpoint testing with mock data
- **E2E tests**: Full user flow from upload to analysis
- **Performance tests**: Video processing pipeline benchmarks

## 🎯 Claude's Primary Goals (Figma Make System)
1. **Generate production-quality frontend code** following Figma Make patterns
2. **Ensure offline functionality** with mock data and fake services
3. **Maintain strict TypeScript typing** across all components
4. **Implement proper BACKEND_HOOK annotations** for future integration
5. **Create accessible, testable components** with data-testids
6. **Build demo-ready interactions** with fake job queues and status updates
7. **Implement dynamic theming** based on university/sport selection
8. **Ensure mobile-responsive design** with proper UX patterns

## 🚨 Critical Success Factors (Figma Make System)
- **Offline functionality**: All code must compile and run without network connectivity
- **Mock data accuracy**: Typed fixtures must match expected backend data structures
- **Demo interactions**: Fake job queues must simulate realistic status updates
- **Theme system**: Dynamic theming must work instantly on university/sport selection
- **Accessibility**: ARIA labels, keyboard navigation, and focus management
- **Mobile responsiveness**: All pages must work on 320px+ screens
- **Type safety**: Strict TypeScript typing with no `any` types
- **Backend handoff**: Clear BACKEND_HOOK annotations for future integration

## 🔍 Debugging Checklist (Figma Make System)
When debugging issues, always check:
1. **Offline functionality**: Code compiles and runs without network connectivity
2. **Mock data types**: Typed fixtures match expected backend data structures
3. **Component props**: All TypeScript interfaces are properly defined
4. **Theme system**: Dynamic theming updates instantly on selection changes
5. **Accessibility**: ARIA labels and keyboard navigation work correctly
6. **Mobile responsiveness**: All pages work on 320px+ screens
7. **Demo interactions**: Fake job queues simulate realistic status updates
8. **BACKEND_HOOK annotations**: Clear comments for future integration points

Remember: The frontend is complete with mock data following Figma Make patterns. Focus on offline functionality, type safety, accessibility, and demo-ready interactions.
