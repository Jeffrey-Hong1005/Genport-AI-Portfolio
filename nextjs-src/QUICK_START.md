# GENPORT - Quick Start (5 Minutes)

## Installation (2 minutes)

```bash
# 1. Copy files to your Next.js project
cp -r . /path/to/your/nextjs/project

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.local.example .env.local
```

## Configuration (3 minutes)

### 1. Add Anthropic API Key

Get your key from https://console.anthropic.com/

Edit `.env.local`:
```env
ANTHROPIC_API_KEY=sk-ant-v7-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 2. (Optional) Add Naver News API

For real news instead of AI-generated:
```env
NAVER_CLIENT_ID=your_id
NAVER_CLIENT_SECRET=your_secret
```

If you skip this, the app will auto-generate news using Claude.

### 3. Start the server

```bash
npm run dev
```

Visit `http://localhost:3000`

## First Test

1. **Landing Page** - You should see the GENPORT hero section
2. **Click "지금 시작하기"** - Login modal appears
3. **Sign up** with email/password or Google
4. **Dashboard** - Portfolio statistics (empty at first)
5. **Go to Builder** - Create a portfolio
   - Select a theme (e.g., "AI반도체")
   - Enter condition in Korean (e.g., "배당금 높은 대형주")
   - Click "AI 포트폴리오 생성"
   - Review portfolio and click "저장"
6. **View in Portfolio** - Your created portfolio appears

## File Structure Quick Reference

```
Key files to understand:

src/lib/firebase.js              → Firebase setup
src/lib/auth-context.js          → Login/logout logic
src/components/LoginModal.js     → Login form
src/app/page.js                  → Landing page
src/app/(app)/layout.js          → App navigation
src/app/(app)/builder/page.js    → Portfolio builder
src/app/api/claude/route.js      → AI backend
src/app/api/sentiment/route.js   → News analysis
```

## Troubleshooting

### "Cannot find module" errors
```bash
npm install
```

### "Firebase error"
- Check if `.env.local` exists
- Verify Firebase config in `src/lib/firebase.js`

### "Claude API error"
- Check `ANTHROPIC_API_KEY` is set in `.env.local`
- Ensure API key has credits

### "Page shows loading forever"
- Check browser console (F12) for errors
- Check terminal for server errors

## What's Included

✅ Complete Next.js 15 project
✅ Firebase Auth (email + Google)
✅ Firestore database integration
✅ Claude API for portfolio generation
✅ News sentiment analysis
✅ Dark theme UI with Tailwind
✅ Full portfolio management
✅ Responsive design
✅ Production-ready code

## Next Steps

1. **Customize the UI** - Edit `src/app/globals.css` for colors
2. **Add more themes** - Edit `THEMES` in `src/app/(app)/builder/page.js`
3. **Modify prompts** - Edit AI instructions in `src/app/api/claude/route.js`
4. **Deploy** - See SETUP_GUIDE.md for deployment instructions
5. **Add features** - Database schema is flexible, add more fields as needed

## Key Commands

```bash
npm run dev      # Development server (http://localhost:3000)
npm run build    # Production build
npm start        # Start production server
npm run lint     # Check code quality
```

## Chrome DevTools Tips

- **F12** - Open developer tools
- **Console** - See JavaScript errors
- **Network** - See API calls and responses
- **Application > Storage** - See Firebase data

## Firebase Console

Visit https://console.firebase.google.com/
- View Firestore data in real-time
- Check authentication logs
- Set up security rules

## Deployment (Choose One)

### Vercel (Easiest)
```bash
npm install -g vercel
vercel
# Follow prompts, set env variables, done!
```

### Docker
```bash
docker build -t genport .
docker run -p 3000:3000 -e ANTHROPIC_API_KEY=xxx genport
```

### Manual
```bash
npm run build
npm start
```

## Documentation

- **Full setup**: See `SETUP_GUIDE.md`
- **Features**: See `README.md`
- **API details**: See route files in `src/app/api/`

## Getting Help

1. Check the SETUP_GUIDE.md troubleshooting section
2. Look at browser console errors (F12)
3. Check terminal for server errors
4. Read code comments in the files
5. Check Next.js docs: https://nextjs.org/docs

## Common Customizations

### Change Colors
Edit `src/app/globals.css`:
```css
--color-accent-indigo: #your-color;
--color-accent-purple: #your-color;
```

### Add New Theme
Edit `src/app/(app)/builder/page.js`:
```javascript
const THEMES = [
  { id: 'new-theme', label: '새로운 주제', icon: '🎨' },
  // ... rest
];
```

### Modify AI Prompt
Edit `src/app/api/claude/route.js` - change the `prompt` variable

### Change Firebase Project
Edit `src/lib/firebase.js` - update `firebaseConfig`

---

That's it! You now have a working AI portfolio recommendation app. Happy coding!
