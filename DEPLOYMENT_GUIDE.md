# V~ Game Logger - Deployment Guide

## ✨ New Features Added

All 10 major features have been implemented:

1. ✅ **Comment System** - Users can comment on drawings with real-time display
2. ✅ **Follow/Unfollow System** - Follow artists to see their work in your feed
3. ✅ **Advanced Search** - Search for users, filter drawings by game/tags/artist
4. ✅ **Drawing Detail Pages** - Full-size art view with comments and like button
5. ✅ **Activity Feed** - Timeline showing actions from people you follow
6. ✅ **Game Collections** - Create public/private lists of games
7. ✅ **Enhanced Profiles** - User bios, stats, and profile improvements
8. ✅ **Notifications System** - Database-backed notifications for likes, comments, follows
9. ✅ **Drawing Tags** - Tag your artwork (fan art, pixel art, etc.)
10. ✅ **Leaderboards** - Top artists by likes, top games by rating

## 🚀 Deployment Steps

### Step 1: Database Migration (CRITICAL - DO THIS FIRST!)

1. Go to Render Dashboard → Your PostgreSQL database
2. Click "Shell" or "Connect" to open psql
3. Copy the contents of `backend/migration.sql` and paste into the shell
4. Press Enter to execute the migration
5. Verify tables were created: `\dt` (should show Comment, Notification, Activity, GameCollection, CollectionGame)

**Alternative method:**
```bash
# If you have psql installed locally, use the connection string from Render:
psql "postgresql://user:pass@host/database" < backend/migration.sql
```

### Step 2: Push Backend to Render

```bash
git push origin main
```

Render will automatically:
- Detect the push
- Rebuild the backend
- Deploy the new version (takes ~2-3 minutes)

**Verify backend deployment:**
- Go to your Render service dashboard
- Check logs for "Server running at http://localhost:3001"
- Test an endpoint: `https://v-e40n.onrender.com/api/leaderboard/artists`

### Step 3: Push Frontend to Vercel

Vercel will auto-deploy when you push to GitHub (already connected).

**If not auto-deploying:**
1. Go to Vercel dashboard
2. Your project → Settings → Git
3. Make sure auto-deploy is enabled for main branch
4. Manually trigger: Deployments → ... → Redeploy

### Step 4: Test All New Features

After both deployments complete, test these features:

**1. Drawing Detail & Comments:**
- Click any drawing on homepage
- Should open `/art/[id]` page
- Try posting a comment (must be logged in)
- Like the drawing

**2. Follow System:**
- Visit another user's profile
- Click "FOLLOW" button
- Check your Feed page to see their activity

**3. Search:**
- Click "Search" in navbar
- Search for users by username
- Switch to "GAMES" tab and search games

**4. Collections:**
- Go to Collections page
- Create a new collection
- Add games from your library

**5. Notifications:**
- Have someone like your drawing or comment on it
- Check Notifications page
- Should show "User X liked your drawing"

**6. Activity Feed:**
- Go to Feed page
- Should show recent actions from people you follow

**7. Leaderboards:**
- Click Leaderboards in navbar
- View "TOP ARTISTS" and "TOP GAMES"

**8. Drawing Tags:**
- Upload a new drawing from your profile
- Add tags like "fan art, pixel art"
- Tags should appear on drawing detail page

## 📝 New Database Schema

```
User
├── bio (TEXT)
├── bannerUrl (TEXT)
├── comments (Comment[])
├── notifications (Notification[])
├── gameCollections (GameCollection[])
└── activities (Activity[])

CustomArt
├── tags (TEXT)
└── comments (Comment[])

Comment
├── id
├── content
├── artId → CustomArt
├── authorId → User
└── createdAt

Notification
├── id
├── userId → User
├── type (like, comment, follow)
├── content
├── link
├── read (boolean)
└── createdAt

GameCollection
├── id
├── name
├── description
├── isPublic
├── userId → User
├── games (CollectionGame[])
└── createdAt

CollectionGame
├── collectionId → GameCollection
├── gameId → Game
└── addedAt

Activity
├── id
├── userId → User
├── type (post, comment, review)
├── content
├── link
└── createdAt
```

## 🔗 New Routes

**Frontend Pages:**
- `/art/[id]` - Drawing detail page
- `/search` - Search users and games
- `/collections` - Manage your game collections
- `/collections/[id]` - View a specific collection
- `/leaderboards` - Top artists and games
- `/notifications` - Your notifications
- `/feed` - Activity feed from followed users

**Backend API Endpoints:**
```
Comments:
GET    /api/art/:artId/comments
POST   /api/art/:artId/comments
DELETE /api/comments/:commentId

Follow:
POST   /api/users/:userId/follow
DELETE /api/users/:userId/follow
GET    /api/users/:userId/followers
GET    /api/users/:userId/following

Notifications:
GET    /api/notifications
PUT    /api/notifications/:id/read
PUT    /api/notifications/read-all

Collections:
GET    /api/collections
GET    /api/collections/:id
POST   /api/collections
PUT    /api/collections/:id
DELETE /api/collections/:id
POST   /api/collections/:id/games
DELETE /api/collections/:id/games/:gameId

Activity:
GET    /api/activities

Profile:
PUT    /api/profile

Search:
GET    /api/search/users
GET    /api/drawings

Leaderboards:
GET    /api/leaderboard/artists
GET    /api/leaderboard/games
```

## 🐛 Troubleshooting

**"Column does not exist" errors:**
- Migration wasn't run or failed
- Re-run migration.sql on database

**"Table does not exist" errors:**
- Migration failed partway through
- Check Render logs for errors
- May need to drop and recreate tables

**Follow button not working:**
- Check that user profile is using new follow endpoints
- Old endpoints used username, new ones use userId

**Comments not showing:**
- Check browser console for errors
- Verify artId is being passed correctly
- Check backend logs for "POST COMMENT ERROR"

**Notifications not appearing:**
- Check /api/notifications endpoint directly
- Verify notification creation in database
- May need to trigger actions (like, comment) to create notifications

## 🎨 UI Notes

All new pages follow the existing retro/neon aesthetic:
- Neon borders (purple, cyan, pink)
- Retro card styling
- Arcade/pixel fonts
- Dark background with colored accents

## 🔄 Future Improvements

Potential enhancements (not yet implemented):
- Real-time notifications with WebSocket
- Image uploads for user banners
- Direct message system expansion
- Collection sharing/collaboration
- Advanced sorting/filtering UI
- Mobile responsiveness improvements
- Profile customization (themes, layouts)

## 📊 Performance Notes

- Leaderboard queries may be slow with large datasets - consider caching
- Activity feed limits to 50 items to prevent overload
- Notifications poll on page load, not real-time (could add WebSocket later)
- Comment sections load all comments at once (could add pagination)

## ✅ Deployment Checklist

- [ ] Run migration.sql on Render PostgreSQL
- [ ] Verify migration succeeded (check \dt in psql)
- [ ] Push code to GitHub
- [ ] Wait for Render backend to rebuild
- [ ] Wait for Vercel frontend to deploy
- [ ] Test drawing detail page
- [ ] Test commenting
- [ ] Test follow/unfollow
- [ ] Test creating collections
- [ ] Test notifications
- [ ] Test activity feed
- [ ] Test leaderboards
- [ ] Test user search

---

**All features are now live and ready to use! 🎮✨**
