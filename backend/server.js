require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('./prismaClient');
const axios = require('axios');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

const app = express();
const port = 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({ storage: multer.memoryStorage() });
app.use(cors());
app.use(express.json());

// JWT Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// === AUTH ROUTES ===
app.post('/api/register', async (req, res) => {
  try {
    const { email, username, password } = req.body;
    if (!email || !username || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.create({ data: { email, username, password: hashedPassword } });
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Email or username already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({ message: 'Login successful', userId: user.id, username: user.username, token });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

// === GAME ROUTES ===
app.get('/api/games', async (req, res) => {
  try {
    const searchQuery = req.query.search || '';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const response = await axios.get('https://www.giantbomb.com/api/search', {
      params: {
        api_key: process.env.GIANTBOMB_API_KEY,
        format: 'json',
        query: searchQuery,
        resources: 'game',
        limit,
        offset
      }
    });
    res.json({ ...response.data, pagination: { page, limit, offset, total: response.data.number_of_total_results || 0 } });
  } catch (error) {
    console.error("GAME SEARCH ERROR:", error);
    res.status(500).json({ message: 'Failed to fetch game data' });
  }
});

app.get('/api/game/:id', async (req, res) => {
  try {
    const response = await axios.get(`https://www.giantbomb.com/api/game/${req.params.id}`, {
      params: { api_key: process.env.GIANTBOMB_API_KEY, format: 'json' }
    });
    res.json(response.data);
  } catch (error) {
    console.error("GET GAME ERROR:", error);
    res.status(500).json({ message: 'Failed to fetch game details' });
  }
});

app.get('/api/game/:apiId/reviews', async (req, res) => {
  try {
    const game = await prisma.game.findUnique({
      where: { apiId: String(req.params.apiId) },
      include: {
        users: {
          where: { reviewText: { not: null } },
          include: { user: { select: { id: true, username: true } } },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    res.json(game ? game.users : []);
  } catch (error) {
    console.error("GET REVIEWS ERROR:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

// === USER LIBRARY ROUTES ===
app.get('/api/user/:userId/games', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { sortBy, filterBy } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const whereClause = { userId };
    if (filterBy && filterBy !== 'all') whereClause.status = filterBy;

    const orderByClause = sortBy === 'rating' ? { rating: 'desc' } : { createdAt: 'desc' };
    const total = await prisma.userGame.count({ where: whereClause });

    const userGames = await prisma.userGame.findMany({
      where: whereClause,
      orderBy: orderByClause,
      skip,
      take: limit,
      include: { game: true, favoritedArt: true }
    });

    res.json({ games: userGames, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error("GET USER GAMES ERROR:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/user/games', authenticateToken, async (req, res) => {
  const { gameApiId, gameName, gameImageUrl, status } = req.body;
  const userId = req.user.userId;
  try {
    // Ensure apiId is a string
    const apiIdStr = String(gameApiId);
    const game = await prisma.game.upsert({
      where: { apiId: apiIdStr },
      update: {},
      create: { apiId: apiIdStr, name: gameName, imageUrl: gameImageUrl }
    });
    await prisma.userGame.create({ data: { userId, gameId: game.id, status } });
    res.status(201).json({ message: 'Game saved successfully' });
  } catch (error) {
    if (error.code === 'P2002') return res.status(409).json({ message: 'Game already saved.' });
    console.error("SAVE GAME ERROR:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/user/games', authenticateToken, async (req, res) => {
  const { gameId, status, rating, reviewText } = req.body;
  const userId = req.user.userId;
  try {
    await prisma.userGame.update({
      where: { userId_gameId: { userId, gameId: parseInt(gameId) } },
      data: { status, rating: rating ? parseInt(rating) : null, reviewText }
    });
    res.status(200).json({ message: 'Game updated successfully' });
  } catch (error) {
    console.error("UPDATE GAME ERROR:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/user/games/:gameId', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const gameId = parseInt(req.params.gameId);
  try {
    await prisma.userGame.delete({ where: { userId_gameId: { userId, gameId } } });
    res.status(200).json({ message: 'Game removed from library' });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ message: 'Game not found' });
    console.error("DELETE GAME ERROR:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

// === CUSTOM ART ROUTES ===

// Get popular drawings (for non-logged in users)
app.get('/api/drawings/popular', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 12;
    const userId = req.query.userId ? parseInt(req.query.userId) : null;
    const drawings = await prisma.customArt.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { username: true } },
        game: { select: { name: true, apiId: true } },
        _count: { select: { likes: true } },
        likes: userId ? { where: { userId }, select: { userId: true } } : false
      }
    });
    const result = drawings.map(d => ({
      ...d,
      likes: d._count.likes,
      isLiked: userId ? d.likes?.length > 0 : false,
      _count: undefined
    }));
    res.json(result);
  } catch (error) {
    console.error("GET POPULAR DRAWINGS ERROR:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get drawings from users the current user follows
app.get('/api/drawings/following', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const limit = parseInt(req.query.limit) || 12;

    // Get list of users the current user follows
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true }
    });
    const followingIds = following.map(f => f.followingId);

    // Get drawings from followed users
    const drawings = await prisma.customArt.findMany({
      where: { authorId: { in: followingIds } },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { username: true } },
        game: { select: { name: true, apiId: true } },
        _count: { select: { likes: true } },
        likes: { where: { userId }, select: { userId: true } }
      }
    });
    const result = drawings.map(d => ({
      ...d,
      likes: d._count.likes,
      isLiked: d.likes?.length > 0,
      _count: undefined
    }));
    res.json(result);
  } catch (error) {
    console.error("GET FOLLOWING DRAWINGS ERROR:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/game/:apiId/art', async (req, res) => {
  try {
    const userId = req.query.userId ? parseInt(req.query.userId) : null;
    const game = await prisma.game.findUnique({
      where: { apiId: req.params.apiId },
      include: {
        customArt: {
          include: {
            author: { select: { username: true } },
            _count: { select: { likes: true } },
            likes: userId ? { where: { userId }, select: { userId: true } } : false
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    const result = game ? game.customArt.map(d => ({
      ...d,
      likes: d._count.likes,
      isLiked: userId ? d.likes?.length > 0 : false,
      _count: undefined
    })) : [];
    res.json(result);
  } catch (error) {
    console.error("GET ART ERROR:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder: 'v-art' }, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

app.post('/api/art', authenticateToken, upload.single('artFile'), async (req, res) => {
  const { gameApiId } = req.body;
  const userId = req.user.userId;
  if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
  try {
    const game = await prisma.game.findUnique({ where: { apiId: gameApiId } });
    if (!game) return res.status(404).json({ message: 'Game must be in database first.' });
    const uploadResult = await uploadToCloudinary(req.file.buffer);
    const newArt = await prisma.customArt.create({
      data: { imageUrl: uploadResult.secure_url, gameId: game.id, authorId: userId }
    });
    res.status(201).json(newArt);
  } catch (error) {
    console.error("ART UPLOAD ERROR:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/user/games/upload-art', authenticateToken, upload.single('artFile'), async (req, res) => {
  const { gameId } = req.body;
  const userId = req.user.userId;
  if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
  try {
    const game = await prisma.game.findUnique({ where: { id: parseInt(gameId) } });
    if (!game) return res.status(404).json({ message: 'Game not found.' });
    const uploadResult = await uploadToCloudinary(req.file.buffer);
    const newArt = await prisma.customArt.create({
      data: { imageUrl: uploadResult.secure_url, gameId: game.id, authorId: userId }
    });
    res.status(201).json(newArt);
  } catch (error) {
    console.error("ART UPLOAD ERROR:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/user/games/favorite-art', authenticateToken, async (req, res) => {
  const { gameId, artId } = req.body;
  const userId = req.user.userId;
  try {
    await prisma.userGame.update({
      where: { userId_gameId: { userId, gameId: parseInt(gameId) } },
      data: { favoritedArtId: artId ? parseInt(artId) : null }
    });
    res.status(200).json({ message: 'Favorite art updated.' });
  } catch (error) {
    console.error("FAVORITE ART ERROR:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/art/:artId', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const artId = parseInt(req.params.artId);
  try {
    const art = await prisma.customArt.findUnique({ where: { id: artId } });
    if (!art) return res.status(404).json({ message: 'Art not found' });
    if (art.authorId !== userId) return res.status(403).json({ message: 'You can only delete your own art' });
    await prisma.userGame.updateMany({ where: { favoritedArtId: artId }, data: { favoritedArtId: null } });
    await prisma.artLike.deleteMany({ where: { artId } });
    await prisma.customArt.delete({ where: { id: artId } });
    res.status(200).json({ message: 'Art deleted successfully' });
  } catch (error) {
    console.error("DELETE ART ERROR:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single drawing details
app.get('/api/art/:artId', async (req, res) => {
  try {
    const artId = parseInt(req.params.artId);
    const userId = req.query.userId ? parseInt(req.query.userId) : null;
    const drawing = await prisma.customArt.findUnique({
      where: { id: artId },
      include: {
        author: { select: { id: true, username: true } },
        game: { select: { id: true, name: true, apiId: true } },
        _count: { select: { likes: true } },
        likes: userId ? { where: { userId }, select: { userId: true } } : false
      }
    });
    if (!drawing) return res.status(404).json({ message: 'Drawing not found' });
    res.json({
      ...drawing,
      likes: drawing._count.likes,
      isLiked: userId ? drawing.likes?.length > 0 : false,
      _count: undefined
    });
  } catch (error) {
    console.error("GET DRAWING ERROR:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Like a drawing
app.post('/api/art/:artId/like', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const artId = parseInt(req.params.artId);
  try {
    const art = await prisma.customArt.findUnique({ where: { id: artId } });
    if (!art) return res.status(404).json({ message: 'Art not found' });

    const existing = await prisma.artLike.findUnique({
      where: { userId_artId: { userId, artId } }
    });
    if (existing) return res.status(409).json({ message: 'Already liked' });

    await prisma.artLike.create({ data: { userId, artId } });
    const likeCount = await prisma.artLike.count({ where: { artId } });
    res.status(201).json({ message: 'Liked', likes: likeCount });
  } catch (error) {
    console.error("LIKE ART ERROR:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Unlike a drawing
app.delete('/api/art/:artId/like', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const artId = parseInt(req.params.artId);
  try {
    await prisma.artLike.delete({
      where: { userId_artId: { userId, artId } }
    });
    const likeCount = await prisma.artLike.count({ where: { artId } });
    res.status(200).json({ message: 'Unliked', likes: likeCount });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ message: 'Not liked' });
    console.error("UNLIKE ART ERROR:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

// === USER & SOCIAL ROUTES ===
app.get('/api/users/search', async (req, res) => {
  const { query, currentUserId } = req.query;
  if (!query) return res.json([]);
  try {
    const users = await prisma.user.findMany({
      where: { username: { contains: query }, id: { not: parseInt(currentUserId) || 0 } },
      select: { id: true, username: true },
      take: 10
    });
    res.json(users);
  } catch (error) {
    console.error("USER SEARCH ERROR:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/users/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const { currentUserId } = req.query;

    const profile = await prisma.user.findUnique({
      where: { username },
      include: {
        _count: { select: { followers: true, following: true } },
        games: { orderBy: { createdAt: 'desc' }, include: { game: true, favoritedArt: true } },
        followers: { select: { follower: { select: { username: true } } } },
        following: { select: { following: { select: { username: true } } } }
      }
    });

    if (!profile) return res.status(404).json({ message: 'User not found' });

    let isFollowing = false;
    if (currentUserId && parseInt(currentUserId) !== profile.id) {
      const followStatus = await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: parseInt(currentUserId), followingId: profile.id } }
      });
      isFollowing = !!followStatus;
    }

    const { password, ...publicProfile } = profile;
    res.json({ ...publicProfile, isFollowing });
  } catch (error) {
    console.error("GET PROFILE ERROR:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/users/follow', authenticateToken, async (req, res) => {
  const { followingUsername } = req.body;
  const followerId = req.user.userId;
  try {
    const userToFollow = await prisma.user.findUnique({ where: { username: followingUsername } });
    if (!userToFollow) return res.status(404).json({ message: 'User not found.' });
    if (followerId === userToFollow.id) return res.status(400).json({ message: "Cannot follow yourself." });

    const existing = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId: userToFollow.id } }
    });
    if (existing) return res.status(409).json({ message: "Already following." });

    await prisma.follow.create({ data: { followerId, followingId: userToFollow.id } });
    res.status(201).json({ message: `Now following ${followingUsername}.` });
  } catch (error) {
    console.error("FOLLOW ERROR:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/users/unfollow', authenticateToken, async (req, res) => {
  const { followingUsername } = req.body;
  const followerId = req.user.userId;
  try {
    const userToUnfollow = await prisma.user.findUnique({ where: { username: followingUsername } });
    if (!userToUnfollow) return res.status(404).json({ message: 'User not found.' });
    await prisma.follow.delete({
      where: { followerId_followingId: { followerId, followingId: userToUnfollow.id } }
    });
    res.status(200).json({ message: `Unfollowed ${followingUsername}.` });
  } catch (error) {
    console.error("UNFOLLOW ERROR:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

// === MESSAGING ROUTES ===
app.get('/api/conversations', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  try {
    const conversations = await prisma.conversation.findMany({
      where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
      include: {
        user1: { select: { id: true, username: true } },
        user2: { select: { id: true, username: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(conversations);
  } catch (error) {
    console.error("GET CONVERSATIONS ERROR:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/conversations', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const { recipientId } = req.body;
  try {
    const otherUser = await prisma.user.findUnique({ where: { id: parseInt(recipientId) } });
    if (!otherUser) return res.status(404).json({ message: 'User not found' });
    if (otherUser.id === userId) return res.status(400).json({ message: 'Cannot message yourself' });

    let conversation = await prisma.conversation.findFirst({
      where: { OR: [{ user1Id: userId, user2Id: otherUser.id }, { user1Id: otherUser.id, user2Id: userId }] },
      include: { user1: { select: { id: true, username: true } }, user2: { select: { id: true, username: true } }, messages: { orderBy: { createdAt: 'asc' } } }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { user1Id: userId, user2Id: otherUser.id },
        include: { user1: { select: { id: true, username: true } }, user2: { select: { id: true, username: true } }, messages: true }
      });
    }
    res.json(conversation);
  } catch (error) {
    console.error("CREATE CONVERSATION ERROR:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/conversations/:conversationId/messages', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const conversationId = parseInt(req.params.conversationId);
  try {
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, OR: [{ user1Id: userId }, { user2Id: userId }] }
    });
    if (!conversation) return res.status(403).json({ message: 'Access denied' });

    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: { sender: { select: { id: true, username: true } } },
      orderBy: { createdAt: 'asc' }
    });
    res.json(messages);
  } catch (error) {
    console.error("GET MESSAGES ERROR:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/conversations/:conversationId/messages', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const conversationId = parseInt(req.params.conversationId);
  const { content, imageUrl } = req.body;
  if (!content && !imageUrl) return res.status(400).json({ message: 'Message required' });

  try {
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, OR: [{ user1Id: userId }, { user2Id: userId }] }
    });
    if (!conversation) return res.status(403).json({ message: 'Access denied' });

    const message = await prisma.message.create({
      data: { content, imageUrl, senderId: userId, conversationId },
      include: { sender: { select: { id: true, username: true } } }
    });
    res.status(201).json(message);
  } catch (error) {
    console.error("SEND MESSAGE ERROR:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
