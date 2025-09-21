# Course Management Frontend

React frontend for the Course Management Platform built with Next.js, TypeScript, and Redux Toolkit.

## Features

- **Admin Authentication** - Login and protected routes
- **Course Search** - Advanced search with filters
- **Course Management** - View and manage courses
- **AI Recommendations** - AI-powered course suggestions
- **Responsive Design** - Mobile-friendly interface
- **State Management** - Redux Toolkit for global state

## Tech Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Redux Toolkit** - State management
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **React Hook Form** - Form handling

## Quick Start

### Prerequisites
- Node.js 18+
- Backend services running (ports 3001, 3002, 3003)

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment:**
```bash
cp .env.example .env.local
# Edit .env.local with your backend URLs
```

3. **Start development server:**
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Environment Variables

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3002
NEXT_PUBLIC_AUTH_API_URL=http://localhost:3001
NEXT_PUBLIC_AI_API_URL=http://localhost:3003
```

## Pages

- `/` - Home page with course search
- `/admin/login` - Admin login page
- `/admin/dashboard` - Admin dashboard (protected)
- `/admin/upload` - Course upload page (protected)
- `/admin/users` - User management (protected)
- `/courses/search` - Advanced course search
- `/courses/[id]` - Course details page
- `/course-match` - AI recommendations
- `/signup` - User registration

## Components

### Core Components
- `CourseCard` - Course display card
- `SearchBar` - Course search input
- `FilterPanel` - Search filters
- `ProtectedRoute` - Route protection wrapper
- `LoadingSpinner` - Loading states

### UI Components
- `Button` - Reusable button component
- `Input` - Form input component
- `Select` - Dropdown select component
- `Slider` - Range slider component
- `Dialog` - Modal dialog component
- `Toast` - Notification component

## State Management

### Redux Store
- **Auth Slice** - User authentication state
- **Course Slice** - Course data and search results
- **UI Slice** - UI state (modals, loading, etc.)

### State Structure
```typescript
interface RootState {
  auth: {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
  };
  courses: {
    courses: Course[];
    searchResults: Course[];
    filters: SearchFilters;
    isLoading: boolean;
  };
}
```

## API Integration

### Authentication
- Login/logout functionality
- JWT token management
- Protected route handling
- Role-based access control

### Course Management
- Fetch course listings
- Search courses with filters
- Course details display
- CSV upload for admins

### AI Recommendations
- Get personalized recommendations
- Display recommendation cards
- User preference handling

## Styling

### Tailwind CSS
- Utility-first CSS framework
- Responsive design
- Dark/light theme support
- Custom component styles

### Design System
- Consistent color palette
- Typography scale
- Spacing system
- Component variants

## Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript checks
```

### Code Structure
```
src/
├── app/                 # Next.js app directory
│   ├── admin/          # Admin pages
│   ├── courses/        # Course pages
│   └── page.tsx        # Home page
├── components/         # React components
│   ├── ui/            # UI components
│   └── forms/         # Form components
├── lib/               # Utilities and configurations
│   ├── store/         # Redux store
│   ├── api.ts         # API service
│   └── types.ts       # TypeScript types
└── hooks/             # Custom React hooks
```

## Testing

### Manual Testing
- Test all user flows
- Verify responsive design
- Check error handling
- Test authentication flows

### Browser Support
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Deployment

### Build for Production
```bash
npm run build
npm run start
```

### Environment Setup
- Set production API URLs
- Configure authentication
- Set up monitoring
- Enable error tracking


## Performance

### Optimization Features
- Code splitting with dynamic imports
- Image optimization
- Lazy loading for components
- Redux state persistence
- API response caching

### Bundle Analysis
```bash
npm run build
# Check .next/analyze for bundle size
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License