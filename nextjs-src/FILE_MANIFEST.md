# GENPORT Next.js Project - Complete File Manifest

## Project Created: 2026-03-24
## Total Files: 21 files

---

## Configuration Files (6)

### Root Level
1. **package.json** (290 bytes)
   - Dependencies: react, react-dom, next, firebase, tailwindcss, autoprefixer, postcss, @anthropic-ai/sdk
   - Scripts: dev, build, start, lint

2. **tailwind.config.js** (785 bytes)
   - Dark theme configuration
   - Custom animations: blob, slideInLeft, slideInRight, fadeIn
   - Extended colors and keyframes

3. **postcss.config.js** (63 bytes)
   - Tailwind CSS and Autoprefixer setup

4. **jsconfig.json** (104 bytes)
   - Path alias configuration (@/*)
   - Base URL setup

5. **next.config.js** (1,023 bytes)
   - React strict mode enabled
   - SWC minification
   - Security headers configuration

6. **.gitignore** (498 bytes)
   - Node modules, build files, environment files ignored

---

## Documentation Files (4)

1. **README.md** (8,743 bytes)
   - Project overview
   - Feature list
   - Quick start guide
   - Tech stack
   - API documentation
   - Database schema
   - Deployment instructions

2. **SETUP_GUIDE.md** (12,847 bytes)
   - Detailed installation instructions
   - Environment variables setup
   - File descriptions
   - Database schema
   - Configuration guide
   - Troubleshooting
   - Development tips
   - Security notes

3. **QUICK_START.md** (4,891 bytes)
   - 5-minute quick start
   - Installation steps
   - Configuration
   - First test walkthrough
   - Troubleshooting
   - Common customizations

4. **FILE_MANIFEST.md** (This file)
   - Complete file listing
   - File descriptions
   - Feature mapping

---

## Library Files (2)

### src/lib/

1. **firebase.js** (580 bytes)
   - Firebase app initialization
   - Auth setup with GoogleAuthProvider
   - Firestore database initialization
   - Exports: auth, db, googleProvider

2. **auth-context.js** (2,127 bytes)
   - React Context API implementation
   - AuthProvider component
   - useAuth hook
   - onAuthStateChanged listener
   - User profile management
   - logout and updateUserProfile functions

---

## Component Files (1)

### src/components/

1. **LoginModal.js** (4,235 bytes)
   - Email/password login form
   - Google OAuth login button
   - Sign-up toggle
   - Error handling
   - Loading states

---

## Page Files (8)

### src/app/ (Root App)

1. **page.js** (7,892 bytes)
   - Landing page with hero section
   - Korean copy: "당신만의 포트폴리오를 AI가 설계합니다"
   - How it works (3 steps)
   - Features section (4 features)
   - Call-to-action buttons
   - Navigation bar
   - Footer

2. **layout.js** (531 bytes)
   - Root layout component
   - AuthProvider wrapper
   - Global CSS import
   - Metadata setup

3. **globals.css** (4,118 bytes)
   - Tailwind directives
   - CSS variables for dark theme
   - Color palette
   - Custom utility classes
   - Animation definitions
   - Button and card styles
   - Input field styles
   - Badge styles

### src/app/(app)/ (Protected App Routes)

4. **layout.js** (6,234 bytes)
   - Protected layout with auth check
   - Sidebar navigation (4 items)
   - Top navbar with user info
   - Avatar display
   - Logout button
   - Sidebar toggle

5. **dashboard/page.js** (4,856 bytes)
   - Portfolio statistics cards (3)
   - Quick action buttons (2)
   - Recent portfolios list
   - Loading states
   - Firestore integration

6. **sentiment/page.js** (4,127 bytes)
   - Search bar for stocks/themes
   - News results display
   - Sentiment badges (positive/neutral/negative)
   - Confidence scores
   - Tips section

7. **builder/page.js** (8,923 bytes)
   - 4-step portfolio builder
   - Step 1: Theme selection (6 themes)
   - Step 2: Natural language condition input
   - Step 3: AI portfolio preview
   - Step 4: Save to Firestore
   - Progress indicator
   - Example conditions tips

8. **portfolio/page.js** (5,891 bytes)
   - Portfolio list grid
   - Portfolio cards with metrics
   - Delete functionality
   - Link to detail view
   - Create new portfolio button

9. **portfolio/[id]/page.js** (8,456 bytes)
   - Portfolio detail view
   - Key metrics display
   - Allocation visualization
   - Stock listing
   - Description and condition
   - Delete option
   - Navigation

---

## API Route Files (2)

### src/app/api/

1. **claude/route.js** (2,789 bytes)
   - Portfolio generation endpoint
   - Claude API integration
   - Theme mapping (6 themes)
   - JSON parsing and validation
   - Returns: stocks, allocation, expectedReturn, description

2. **sentiment/route.js** (4,123 bytes)
   - Sentiment analysis endpoint
   - Naver News API integration
   - Fallback to Claude-generated news
   - Sentiment classification (positive/neutral/negative)
   - Confidence scoring
   - Caches news data

---

## Environment & Configuration

1. **.env.local.example** (138 bytes)
   - ANTHROPIC_API_KEY placeholder
   - NAVER_CLIENT_ID placeholder
   - NAVER_CLIENT_SECRET placeholder

---

## File Statistics

- **Total Files**: 21
- **JavaScript/JSX Files**: 14
- **Configuration Files**: 6
- **Documentation Files**: 4
- **CSS Files**: 1
- **JSON Files**: 2
- **Markdown Files**: 4

---

## Technology Stack

| Component | Technology |
|-----------|-----------|
| Framework | Next.js 15 |
| Runtime | Node.js 18+ |
| UI Library | React 19 |
| Styling | Tailwind CSS 3 |
| Database | Firebase Firestore 10 |
| Authentication | Firebase Auth 10 |
| AI | Anthropic Claude API |
| News Data | Naver News API (optional) |

---

## Database Collections

### users
- uid (string)
- email (string)
- displayName (string)
- photoURL (string)
- createdAt (timestamp)
- portfolioCount (number)

### portfolios
- userId (string)
- theme (string)
- themeName (string)
- condition (string)
- stocks (array)
- expectedReturn (number)
- allocation (array of objects)
- description (string)
- createdAt (timestamp)

---

## Available Routes

### Public Routes
- `/` - Landing page
- `/api/claude` - Portfolio generation API
- `/api/sentiment` - Sentiment analysis API

### Protected Routes (Require Login)
- `/dashboard` - User dashboard
- `/sentiment` - Sentiment analysis page
- `/builder` - Portfolio builder
- `/portfolio` - Portfolio list
- `/portfolio/[id]` - Portfolio detail

---

## Key Features by File

| Feature | Primary File |
|---------|------------|
| Authentication | auth-context.js, LoginModal.js |
| Portfolio Generation | api/claude/route.js, (app)/builder/page.js |
| Sentiment Analysis | api/sentiment/route.js, (app)/sentiment/page.js |
| Portfolio Management | (app)/portfolio/page.js, (app)/portfolio/[id]/page.js |
| Dashboard | (app)/dashboard/page.js |
| Styling | globals.css, tailwind.config.js |
| Navigation | (app)/layout.js |

---

## Installation Instructions

1. Copy all files to your Next.js project
2. Run `npm install`
3. Create `.env.local` from `.env.local.example`
4. Add your API keys
5. Run `npm run dev`

See SETUP_GUIDE.md for detailed instructions.

---

## Notes

- All code follows Next.js 15 App Router conventions
- "use client" directive used for interactive components
- Dark theme applied throughout
- Korean UI text throughout
- Firebase config embedded in firebase.js
- Production-ready code with error handling
- Responsive design for all screen sizes
- Security best practices implemented
- No sensitive data in version control

---

Generated: 2026-03-24
Project Name: GENPORT
Version: 0.1.0
