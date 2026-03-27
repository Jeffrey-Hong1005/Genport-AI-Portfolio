# GENPORT - AI-Powered Portfolio Recommendation Service

A modern, AI-powered investment portfolio recommendation platform built with Next.js 15, Firebase, and Anthropic Claude API.

![GENPORT](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?logo=react)
![Tailwind](https://img.shields.io/badge/Tailwind-3-blue?logo=tailwindcss)
![Firebase](https://img.shields.io/badge/Firebase-10-orange?logo=firebase)

## Features

### 🎯 Smart Portfolio Generation
- AI-powered portfolio builder using natural language input
- 6 investment themes: AI Semiconductor, Green Energy, Healthcare, Global Consumer, Finance, Real Estate
- Customizable allocation strategies
- Expected return estimation

### 📊 Sentiment Analysis Dashboard
- Real-time news sentiment analysis for stocks and themes
- Integration with Naver News API
- AI-powered sentiment classification (positive/neutral/negative)
- Confidence scoring

### 🔐 Secure Authentication
- Email/Password authentication
- Google OAuth integration
- Firebase Auth with Firestore profiles
- Secure session management

### 💼 Portfolio Management
- Save and manage multiple portfolios
- View detailed allocation information
- Track portfolio creation history
- Easy portfolio deletion

### 🎨 Modern UI/UX
- Dark theme with indigo/purple accents
- Fully responsive design
- Smooth animations and transitions
- Clean, intuitive interface

## Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn/pnpm
- Anthropic API key
- (Optional) Naver News API credentials

### Installation

```bash
# 1. Clone or copy the project
cp -r nextjs-src your-project-folder
cd your-project-folder

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.local.example .env.local
# Edit .env.local and add your API keys

# 4. Run development server
npm run dev
```

Visit `http://localhost:3000` to see the application.

## Environment Variables

```env
# Required
ANTHROPIC_API_KEY=your_anthropic_api_key

# Optional (for real news data)
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret
```

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed instructions.

## Project Structure

```
src/
├── app/
│   ├── (app)/                 # Protected routes
│   │   ├── dashboard/         # User dashboard
│   │   ├── sentiment/         # News sentiment analysis
│   │   ├── builder/           # Portfolio builder
│   │   ├── portfolio/         # Portfolio management
│   │   └── layout.js          # App layout with nav
│   ├── api/
│   │   ├── claude/            # Portfolio generation API
│   │   └── sentiment/         # Sentiment analysis API
│   ├── page.js                # Landing page
│   ├── layout.js              # Root layout
│   └── globals.css            # Global styles
├── lib/
│   ├── firebase.js            # Firebase config
│   └── auth-context.js        # Auth context & hooks
└── components/
    └── LoginModal.js          # Login/signup modal
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, Tailwind CSS |
| Backend | Next.js API Routes |
| Database | Firebase Firestore |
| Auth | Firebase Auth |
| AI | Anthropic Claude API |
| News | Naver News API |

## Key Pages

### Landing Page (`/`)
- Hero section with Korean copy
- How it works (3-step process)
- Features overview
- Call-to-action buttons

### Dashboard (`/dashboard`)
- Portfolio statistics
- Recent portfolios list
- Quick action buttons
- Portfolio creation shortcut

### Portfolio Builder (`/builder`)
- Step 1: Theme selection
- Step 2: Natural language condition input
- Step 3: AI-generated portfolio preview
- Step 4: Save to Firestore

### Sentiment Analysis (`/sentiment`)
- Search for stocks or themes
- Real-time sentiment analysis
- News article cards with scores
- Sentiment badges (positive/neutral/negative)

### Portfolio Management (`/portfolio`)
- View all saved portfolios
- Portfolio cards with metrics
- Delete functionality
- Link to detailed view

## Authentication Flow

```
Landing Page
    ↓
Click Dashboard/Start
    ↓
LoginModal (if not authenticated)
    ↓
Email/Password or Google OAuth
    ↓
Create user profile in Firestore
    ↓
Redirect to Dashboard
```

## API Routes

### `POST /api/claude`
Generates AI portfolio based on theme and conditions.

**Request:**
```json
{
  "theme": "ai-semiconductor",
  "condition": "ESG 높고 PER 낮은 기업",
  "action": "generate-portfolio"
}
```

**Response:**
```json
{
  "portfolio": {
    "stocks": ["STOCK1", "STOCK2", ...],
    "allocation": [{"stock": "STOCK1", "percentage": 25}, ...],
    "expectedReturn": 12.5,
    "description": "..."
  }
}
```

### `POST /api/sentiment`
Analyzes sentiment of news articles for a given query.

**Request:**
```json
{
  "query": "삼성전자"
}
```

**Response:**
```json
{
  "query": "삼성전자",
  "news": [
    {
      "title": "...",
      "description": "...",
      "link": "https://...",
      "pubDate": "2026-03-24",
      "source": "Naver",
      "sentiment": "positive",
      "score": 0.85
    }
  ]
}
```

## Styling

Uses Tailwind CSS with custom dark theme:

- **Primary Background:** `#0a0e1a`
- **Secondary:** `#111827`, `#1f2937`
- **Accent:** `#6366f1` (indigo), `#8b5cf6` (purple)
- **Text:** `#f3f4f6` (primary), `#d1d5db` (secondary)

Custom utilities in `globals.css`:
- `.btn-primary` - Primary button style
- `.btn-secondary` - Secondary button style
- `.card` - Card component style
- `.input-base` - Input field style
- `.badge-accent` - Accent badge

## Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Create optimized build
npm start        # Start production server
npm run lint     # Run ESLint
```

## Database Schema

### users collection
```javascript
{
  uid: string,
  email: string,
  displayName: string,
  photoURL: string,
  createdAt: Timestamp,
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
  stocks: string[],
  expectedReturn: number,
  allocation: Array<{ stock: string, percentage: number }>,
  description: string,
  createdAt: Timestamp
}
```

## Security

- Firebase Security Rules configured for user isolation
- Environment variables for sensitive API keys
- No sensitive data in client-side code
- HTTPS enforced in production
- CORS headers properly configured

## Performance

- Next.js Image optimization
- CSS minification via Tailwind
- JavaScript minification via SWC
- Font optimization (system fonts)
- Responsive images

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Other Platforms
- AWS (Amplify, ECS, Lambda)
- Google Cloud (Cloud Run, App Engine)
- Netlify
- Railway

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed deployment instructions.

## Common Issues

### "Firebase not initialized"
- Check Firebase config in `src/lib/firebase.js`
- Ensure project ID matches

### "Claude API error"
- Verify `ANTHROPIC_API_KEY` is set
- Check API key has credits
- Validate request payload

### "Portfolio not saving"
- Check Firestore security rules
- Ensure user is authenticated
- Verify database exists

## Troubleshooting

See [SETUP_GUIDE.md](./SETUP_GUIDE.md#troubleshooting) for detailed troubleshooting guide.

## Contributing

Feel free to fork, modify, and improve this project!

## License

MIT License - Use freely for personal and commercial projects.

## Support

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Anthropic Claude API](https://docs.anthropic.com/)

## Changelog

### v0.1.0 - Initial Release
- Complete Next.js 15 project structure
- Firebase Auth integration
- Claude API portfolio generation
- Sentiment analysis system
- Full portfolio management
- Responsive dark theme

---

Made with ❤️ for smarter investing.
