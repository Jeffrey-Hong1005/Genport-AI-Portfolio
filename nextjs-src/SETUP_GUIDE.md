# GENPORT Next.js Setup Guide

A complete Next.js 15 project for GENPORT - AI-powered portfolio recommendation service.

## Project Structure

```
nextjs-src/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (app)/                    # Protected app routes
│   │   │   ├── dashboard/
│   │   │   ├── sentiment/
│   │   │   ├── builder/
│   │   │   ├── portfolio/
│   │   │   └── layout.js
│   │   ├── api/                      # API Routes
│   │   │   ├── claude/               # Claude API integration
│   │   │   └── sentiment/            # News sentiment analysis
│   │   ├── page.js                   # Landing page
│   │   ├── layout.js                 # Root layout
│   │   └── globals.css               # Global styles
│   ├── lib/
│   │   ├── firebase.js               # Firebase initialization
│   │   └── auth-context.js           # Auth context & hooks
│   └── components/
│       └── LoginModal.js             # Auth modal component
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── jsconfig.json
├── next.config.js
└── .env.local.example
```

## Installation

1. **Copy files to your Next.js project:**

```bash
# Copy entire src directory
cp -r src/* your-nextjs-project/src/

# Copy config files
cp package.json your-nextjs-project/
cp tailwind.config.js your-nextjs-project/
cp postcss.config.js your-nextjs-project/
cp jsconfig.json your-nextjs-project/
cp next.config.js your-nextjs-project/
cp .env.local.example your-nextjs-project/
```

2. **Install dependencies:**

```bash
cd your-nextjs-project
npm install
# or
yarn install
# or
pnpm install
```

## Environment Variables Setup

1. **Create `.env.local` file:**

```bash
cp .env.local.example .env.local
```

2. **Set required environment variables:**

```env
# Anthropic API Key (Required)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Naver News API (Optional - for real news data)
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret

# Firebase config is hardcoded in src/lib/firebase.js
# Update the firebaseConfig object if needed
```

### Getting API Keys

#### Anthropic API Key
1. Visit https://console.anthropic.com/
2. Create an account or sign in
3. Go to API keys section
4. Create a new API key
5. Copy and paste into `.env.local`

#### Naver News API (Optional)
1. Visit https://developers.naver.com/
2. Create a developer account
3. Register an application
4. Get Client ID and Client Secret
5. The app will fall back to Claude-generated news if this is not set

## Running the Project

```bash
# Development server
npm run dev

# Production build
npm run build
npm start

# Linting
npm run lint
```

The application will be available at `http://localhost:3000`

## Key Features

### 1. Authentication
- Email/Password login
- Google OAuth
- Firebase Auth integration
- User profile management in Firestore

### 2. Dashboard
- Portfolio statistics
- Recent activity
- Quick actions
- Portfolio management

### 3. Sentiment Analysis
- Search for stocks/themes
- Claude AI sentiment analysis
- News article analysis
- Sentiment scoring (positive/neutral/negative)

### 4. Portfolio Builder
- 4-step guided process
- Theme selection (6 categories)
- Natural language condition input
- AI-powered portfolio generation
- Allocation visualization

### 5. Portfolio Management
- Save portfolios to Firestore
- View portfolio details
- Delete portfolios
- Portfolio analytics

## Tech Stack

- **Frontend:** Next.js 15, React 19, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** Firebase Firestore
- **Authentication:** Firebase Auth
- **AI:** Anthropic Claude API
- **News:** Naver News API (optional fallback to Claude)

## File Descriptions

### Core Files

**src/lib/firebase.js**
- Firebase app initialization
- Auth and Firestore setup
- Google Auth provider

**src/lib/auth-context.js**
- React Context for authentication
- useAuth hook
- User profile management
- Auth state handling

**src/components/LoginModal.js**
- Email/password login form
- Google login button
- Sign-up toggle
- Error handling

### Pages

**src/app/page.js** - Landing page
- Hero section
- How it works
- Features section
- Call-to-action buttons

**src/app/(app)/layout.js** - App layout
- Protected routes (redirects to / if not logged in)
- Sidebar navigation
- Top navbar with user info
- Logout button

**src/app/(app)/dashboard/page.js** - Dashboard
- Portfolio statistics
- Recent portfolios
- Quick action buttons

**src/app/(app)/sentiment/page.js** - Sentiment analysis
- Search bar for stocks/themes
- News article display
- Sentiment badges
- Score display

**src/app/(app)/builder/page.js** - Portfolio builder
- 4-step wizard interface
- Theme selection grid
- Natural language input
- Portfolio preview
- Save functionality

**src/app/(app)/portfolio/page.js** - Portfolio list
- All saved portfolios
- Portfolio cards with metrics
- Delete functionality
- Link to detail page

**src/app/(app)/portfolio/[id]/page.js** - Portfolio detail
- Full portfolio information
- Allocation charts
- Stock listing
- Delete option

### API Routes

**src/app/api/claude/route.js**
- Portfolio generation
- Uses Anthropic Claude API
- Validates generated JSON
- Returns structured portfolio data

**src/app/api/sentiment/route.js**
- News sentiment analysis
- Optional Naver News API integration
- Falls back to Claude-generated news
- Returns articles with sentiment scores

## Styling

The project uses:
- **Tailwind CSS** for utility styles
- **Custom CSS variables** in globals.css
- **Dark theme** with indigo/purple accents
- **Responsive design** for mobile/tablet/desktop

Color palette:
- Primary background: `#0a0e1a`
- Secondary: `#111827`, `#1f2937`
- Accent: `#6366f1` (indigo), `#8b5cf6` (purple)
- Text: `#f3f4f6` (primary), `#d1d5db` (secondary)

## Authentication Flow

1. User visits the site
2. Can view landing page without authentication
3. Click "Dashboard" or "시작하기" → LoginModal appears
4. Login with email/password or Google
5. Redirected to dashboard on success
6. User profile created in Firestore users collection
7. Navigation to protected routes is restricted to authenticated users

## Database Schema (Firestore)

### users collection
```javascript
{
  uid: string,
  email: string,
  displayName: string,
  photoURL: string,
  createdAt: timestamp,
  portfolioCount: number
}
```

### portfolios collection
```javascript
{
  userId: string,
  theme: string,
  themeName: string,
  condition: string,
  stocks: [string],
  expectedReturn: number,
  allocation: [
    { stock: string, percentage: number }
  ],
  description: string,
  createdAt: timestamp
}
```

## Configuration

### Firebase Config
Located in `src/lib/firebase.js`. Update if using a different Firebase project:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "YOUR_DOMAIN",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_BUCKET",
  messagingSenderId: "YOUR_ID",
  appId: "YOUR_APP_ID"
};
```

### Themes
Modify available portfolio themes in:
- `src/app/(app)/builder/page.js` - THEMES constant
- `src/app/api/claude/route.js` - THEMES mapping

## Common Issues

### Firebase Auth Error
- Ensure environment is added to Firebase Console
- Check API key is correct
- Verify Firestore database rules allow read/write

### Claude API Error
- Verify ANTHROPIC_API_KEY is set
- Check API key has credits
- Ensure request payload is valid

### Sentiment Analysis Not Working
- If Naver API fails, check credentials
- App falls back to Claude-generated news automatically
- Check ANTHROPIC_API_KEY if Claude generation fails

## Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

Set environment variables in Vercel dashboard:
- `ANTHROPIC_API_KEY`
- `NAVER_CLIENT_ID` (optional)
- `NAVER_CLIENT_SECRET` (optional)

### Other Platforms
Ensure environment variables are set before deployment.

## Security Notes

1. **API Keys:** Never commit `.env.local` to version control
2. **Firestore Rules:** Configure proper security rules for production
3. **Firebase Auth:** Enable only needed auth providers
4. **API Rate Limiting:** Consider adding rate limiting for API routes
5. **CORS:** Configure CORS headers if needed

## Performance Optimization

- Next.js Image optimization enabled
- CSS minification via Tailwind
- JavaScript minification via SWC
- Font optimization with system fonts
- Responsive images with srcset

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## Development Tips

1. Use `npm run dev` for hot reload during development
2. Check browser console for client-side errors
3. Check terminal for server-side errors
4. Use React DevTools for debugging components
5. Firebase Console for database inspection

## Troubleshooting

**Page shows login modal on every navigation:**
- Check Firebase Auth is properly initialized
- Verify onAuthStateChanged is firing
- Check browser console for errors

**Portfolio not saving:**
- Check Firestore database rules
- Verify user is authenticated
- Check browser network tab for API errors

**Claude API returns errors:**
- Verify API key is valid and has credits
- Check request payload format
- Look at API response in network tab

## Support

For issues with:
- **Next.js:** https://nextjs.org/docs
- **Firebase:** https://firebase.google.com/docs
- **Tailwind:** https://tailwindcss.com/docs
- **Claude API:** https://docs.anthropic.com/

## License

MIT License - Feel free to use this project as a template.
