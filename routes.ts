import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import { 
  getChatCompletion, 
  generateImage,
  checkCodeValidity,
  refineChatResponse,
  generateGame,
  generateMusic
} from "./services/openai";
import { verifyFirebaseToken, uploadFileToStorage } from "./services/firebase";
import { z } from "zod";
import { 
  loginSchema, 
  signupSchema, 
  createChatMessageSchema, 
  generateImageSchema,
  generateGameSchema,
  generateMusicSchema,
  memoryItemSchema
} from "@shared/schema";

// Set up multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(__dirname, '../uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only certain file types
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, TXT, DOC, DOCX, JPG, and PNG files are allowed.') as any);
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Firebase token verification middleware
  const authenticateUser = async (req: any, res: any, next: any) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const token = authHeader.split('Bearer ')[1];
      const decodedToken = await verifyFirebaseToken(token);
      
      if (!decodedToken) {
        return res.status(401).json({ message: 'Invalid token' });
      }
      
      req.user = decodedToken;
      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      res.status(401).json({ message: 'Authentication failed' });
    }
  };

  // Check if user is premium
  const isPremiumUser = async (req: any, res: any, next: any) => {
    try {
      const user = await storage.getUserByFirebaseId(req.user.uid);
      
      if (!user || !user.isPremium) {
        return res.status(403).json({ message: 'Premium subscription required' });
      }
      
      next();
    } catch (error) {
      console.error('Premium check error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };

  // Authentication Routes
  app.post('/api/auth/register', authenticateUser, async (req, res) => {
    try {
      const { email, displayName, botName, preferredLanguage = 'english' } = req.body;
      const firebaseId = req.user.uid;
      
      // Check if user already exists
      const existingUser = await storage.getUserByFirebaseId(firebaseId);
      if (existingUser) {
        return res.status(200).json(existingUser);
      }
      
      // Create new user
      const newUser = await storage.createUser({
        username: displayName.toLowerCase().replace(/\s+/g, '_'),
        email,
        password: 'firebase_auth', // Not used with Firebase auth
        firebaseId,
        displayName,
        botName,
        preferredLanguage
      });
      
      res.status(201).json(newUser);
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Failed to register user' });
    }
  });

  app.get('/api/auth/me', authenticateUser, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseId(req.user.uid);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.status(200).json(user);
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Chat Routes
  app.post('/api/chat', authenticateUser, async (req, res) => {
    try {
      const { content, chatId, fileUrls } = req.body;
      const validatedData = createChatMessageSchema.parse({ content, chatId });
      
      const user = await storage.getUserByFirebaseId(req.user.uid);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      let currentChatId = validatedData.chatId;
      
      // Create a new chat if chatId is not provided
      if (!currentChatId) {
        const newChat = await storage.createChatHistory({
          userId: user.id,
          title: content.substring(0, 30) + (content.length > 30 ? '...' : '')
        });
        currentChatId = newChat.id;
      }
      
      // Save user message
      await storage.createChatMessage({
        chatId: currentChatId,
        content: validatedData.content,
        role: 'user'
      });
      
      // Get response from OpenAI
      const isPremium = user.isPremium;
      let response;
      
      if (isPremium) {
        // Premium users get triple-checked responses
        response = await getChatCompletion(content, user.preferredLanguage, fileUrls, true);
      } else {
        response = await getChatCompletion(content, user.preferredLanguage, fileUrls, false);
      }
      
      // Save assistant message
      await storage.createChatMessage({
        chatId: currentChatId,
        content: response.text,
        role: 'assistant'
      });
      
      res.status(200).json(response);
    } catch (error) {
      console.error('Chat error:', error);
      res.status(500).json({ message: 'Failed to process chat message' });
    }
  });

  app.post('/api/chat/followup', authenticateUser, async (req, res) => {
    try {
      const { originalMessage, followUpMessage, chatId } = req.body;
      
      if (!followUpMessage || !chatId) {
        return res.status(400).json({ message: 'Missing required parameters' });
      }
      
      const user = await storage.getUserByFirebaseId(req.user.uid);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Save follow-up message
      await storage.createChatMessage({
        chatId,
        content: followUpMessage,
        role: 'user'
      });
      
      // Get refined response from OpenAI
      const response = await refineChatResponse(originalMessage, followUpMessage, user.preferredLanguage);
      
      // Save assistant message
      await storage.createChatMessage({
        chatId,
        content: response.text,
        role: 'assistant'
      });
      
      res.status(200).json(response);
    } catch (error) {
      console.error('Follow-up error:', error);
      res.status(500).json({ message: 'Failed to process follow-up message' });
    }
  });

  app.post('/api/chat/new', authenticateUser, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseId(req.user.uid);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const newChat = await storage.createChatHistory({
        userId: user.id,
        title: 'New Conversation'
      });
      
      res.status(201).json(newChat);
    } catch (error) {
      console.error('New chat error:', error);
      res.status(500).json({ message: 'Failed to create new chat' });
    }
  });

  app.get('/api/chat/history', authenticateUser, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseId(req.user.uid);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const chatHistory = await storage.getChatHistoryByUserId(user.id);
      
      res.status(200).json(chatHistory);
    } catch (error) {
      console.error('Chat history error:', error);
      res.status(500).json({ message: 'Failed to get chat history' });
    }
  });

  app.get('/api/chat/:chatId', authenticateUser, async (req, res) => {
    try {
      const chatId = parseInt(req.params.chatId);
      
      if (isNaN(chatId)) {
        return res.status(400).json({ message: 'Invalid chat ID' });
      }
      
      const user = await storage.getUserByFirebaseId(req.user.uid);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Verify chat belongs to user
      const chat = await storage.getChatHistory(chatId);
      if (!chat || chat.userId !== user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const messages = await storage.getChatMessagesByChatId(chatId);
      
      res.status(200).json(messages);
    } catch (error) {
      console.error('Get messages error:', error);
      res.status(500).json({ message: 'Failed to get chat messages' });
    }
  });

  // Image Generation Routes
  app.post('/api/image/generate', authenticateUser, async (req, res) => {
    try {
      const { prompt } = req.body;
      const validatedData = generateImageSchema.parse({ prompt });
      
      const user = await storage.getUserByFirebaseId(req.user.uid);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Check image generation limits
      const freeLimit = 6;
      const premiumLimit = 20;
      const currentLimit = user.isPremium ? premiumLimit : freeLimit;
      
      // Check if we need to reset count based on day
      const now = new Date();
      const lastReset = user.lastImageGenerationReset ? new Date(user.lastImageGenerationReset) : null;
      
      let currentCount = user.imageGenerationCount || 0;
      
      if (!lastReset || now.getDate() !== lastReset.getDate()) {
        // Reset count for new day
        currentCount = 0;
        await storage.updateUser(user.id, {
          imageGenerationCount: 0,
          lastImageGenerationReset: now.toISOString()
        });
      }
      
      if (currentCount >= currentLimit) {
        return res.status(403).json({
          message: user.isPremium 
            ? "You've reached your daily limit of 20 image generations."
            : "You've reached your free tier limit of 6 image generations. Upgrade to premium for 20 daily generations."
        });
      }
      
      // Generate image
      const generatedImage = await generateImage(validatedData.prompt);
      
      // Save generated image record
      await storage.createGeneratedImage({
        userId: user.id,
        prompt: validatedData.prompt,
        imageUrl: generatedImage.url
      });
      
      // Update user's image generation count
      await storage.updateUser(user.id, {
        imageGenerationCount: currentCount + 1
      });
      
      res.status(200).json({
        imageUrl: generatedImage.url,
        imageCount: currentCount + 1,
        maxImages: currentLimit
      });
    } catch (error) {
      console.error('Image generation error:', error);
      res.status(500).json({ message: 'Failed to generate image' });
    }
  });

  // Code Checking Routes
  app.post('/api/code/check', authenticateUser, async (req, res) => {
    try {
      const { code, language } = req.body;
      
      if (!code || !language) {
        return res.status(400).json({ message: 'Code and language are required' });
      }
      
      const result = await checkCodeValidity(code, language);
      
      res.status(200).json(result);
    } catch (error) {
      console.error('Code check error:', error);
      res.status(500).json({ message: 'Failed to check code' });
    }
  });

  // Memory Routes (Premium Only)
  app.post('/api/memory', authenticateUser, isPremiumUser, async (req, res) => {
    try {
      const { content } = req.body;
      const validatedData = memoryItemSchema.parse({ content });
      
      const user = await storage.getUserByFirebaseId(req.user.uid);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Check memory item count limit (60)
      const memoryItems = await storage.getMemoryItemsByUserId(user.id);
      
      if (memoryItems.length >= 60) {
        return res.status(403).json({ message: 'Memory limit reached (60 items)' });
      }
      
      const newMemoryItem = await storage.createMemoryItem({
        userId: user.id,
        content: validatedData.content
      });
      
      res.status(201).json(newMemoryItem);
    } catch (error) {
      console.error('Memory creation error:', error);
      res.status(500).json({ message: 'Failed to create memory item' });
    }
  });

  app.get('/api/memory', authenticateUser, isPremiumUser, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseId(req.user.uid);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const memoryItems = await storage.getMemoryItemsByUserId(user.id);
      
      res.status(200).json(memoryItems);
    } catch (error) {
      console.error('Get memory items error:', error);
      res.status(500).json({ message: 'Failed to get memory items' });
    }
  });

  // File Upload Routes (Premium Only)
  app.post('/api/upload', authenticateUser, isPremiumUser, upload.array('files', 10), async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
      }
      
      const user = await storage.getUserByFirebaseId(req.user.uid);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const uploadedFiles = req.files as Express.Multer.File[];
      const fileUrls: string[] = [];
      
      for (const file of uploadedFiles) {
        // Upload to Firebase Storage
        const fileUrl = await uploadFileToStorage(file.path, file.originalname, user.id);
        
        // Save file record
        await storage.createFileUpload({
          userId: user.id,
          filename: file.originalname,
          fileType: file.mimetype,
          filePath: fileUrl
        });
        
        fileUrls.push(fileUrl);
        
        // Remove local file
        fs.unlinkSync(file.path);
      }
      
      res.status(200).json({ urls: fileUrls });
    } catch (error) {
      console.error('File upload error:', error);
      res.status(500).json({ message: 'Failed to upload files' });
    }
  });

  // User Preferences Routes
  app.patch('/api/user/preferences', authenticateUser, async (req, res) => {
    try {
      const { displayName, botName, preferredLanguage } = req.body;
      
      const user = await storage.getUserByFirebaseId(req.user.uid);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const updatedFields: any = {};
      
      if (displayName) updatedFields.displayName = displayName;
      if (botName) updatedFields.botName = botName;
      if (preferredLanguage) updatedFields.preferredLanguage = preferredLanguage;
      
      const updatedUser = await storage.updateUser(user.id, updatedFields);
      
      res.status(200).json(updatedUser);
    } catch (error) {
      console.error('Update preferences error:', error);
      res.status(500).json({ message: 'Failed to update preferences' });
    }
  });

  // Subscription Routes
  app.post('/api/subscription/upgrade', authenticateUser, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseId(req.user.uid);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // In a real app, we would handle payment processing here
      // For now, we just update the user's premium status
      
      const updatedUser = await storage.updateUser(user.id, {
        isPremium: true,
        premiumExpiresAt: null // No expiration for paid subscriptions
      });
      
      res.status(200).json(updatedUser);
    } catch (error) {
      console.error('Upgrade error:', error);
      res.status(500).json({ message: 'Failed to upgrade subscription' });
    }
  });

  app.post('/api/subscription/trial', authenticateUser, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseId(req.user.uid);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Set 2-day trial expiration
      const trialExpiryDate = new Date();
      trialExpiryDate.setDate(trialExpiryDate.getDate() + 2);
      
      const updatedUser = await storage.updateUser(user.id, {
        isPremium: true,
        premiumExpiresAt: trialExpiryDate.toISOString()
      });
      
      res.status(200).json(updatedUser);
    } catch (error) {
      console.error('Trial start error:', error);
      res.status(500).json({ message: 'Failed to start trial' });
    }
  });

  // Game Generation Routes
  app.post('/api/game/generate', authenticateUser, async (req, res) => {
    try {
      const { prompt } = req.body;
      const validatedData = generateGameSchema.parse({ prompt });
      
      const user = await storage.getUserByFirebaseId(req.user.uid);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Limit game generation to premium users only
      if (!user.isPremium) {
        return res.status(403).json({ message: 'Game generation is a premium feature. Please upgrade your account.' });
      }
      
      // Generate game
      const generatedGame = await generateGame(validatedData.prompt);
      
      // Save generated game record
      const savedGame = await storage.createGeneratedGame({
        userId: user.id,
        prompt: validatedData.prompt,
        title: generatedGame.title,
        description: generatedGame.description,
        gameCode: generatedGame.gameCode,
        gameUrl: generatedGame.gameUrl,
        thumbnailUrl: generatedGame.thumbnailUrl
      });
      
      res.status(200).json({
        ...generatedGame,
        id: savedGame.id
      });
    } catch (error) {
      console.error('Game generation error:', error);
      res.status(500).json({ message: 'Failed to generate game' });
    }
  });
  
  // Music Generation Routes
  app.post('/api/music/generate', authenticateUser, async (req, res) => {
    try {
      const { prompt, duration, genre } = req.body;
      const validatedData = generateMusicSchema.parse({ prompt, duration, genre });
      
      const user = await storage.getUserByFirebaseId(req.user.uid);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Limit music generation to premium users only
      if (!user.isPremium) {
        return res.status(403).json({ message: 'Music generation is a premium feature. Please upgrade your account.' });
      }
      
      // Generate music
      const generatedMusic = await generateMusic(
        validatedData.prompt, 
        validatedData.duration || 30,
        validatedData.genre
      );
      
      // Save generated music record
      const savedMusic = await storage.createGeneratedMusic({
        userId: user.id,
        prompt: validatedData.prompt,
        title: generatedMusic.title,
        description: generatedMusic.description,
        musicUrl: generatedMusic.musicUrl,
        duration: generatedMusic.duration
      });
      
      res.status(200).json({
        ...generatedMusic,
        id: savedMusic.id
      });
    } catch (error) {
      console.error('Music generation error:', error);
      res.status(500).json({ message: 'Failed to generate music' });
    }
  });
  
  // Get user's generated games
  app.get('/api/game/library', authenticateUser, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseId(req.user.uid);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const games = await storage.getGeneratedGamesByUserId(user.id);
      
      res.status(200).json(games);
    } catch (error) {
      console.error('Get games error:', error);
      res.status(500).json({ message: 'Failed to get games' });
    }
  });
  
  // Get user's generated music
  app.get('/api/music/library', authenticateUser, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseId(req.user.uid);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const music = await storage.getGeneratedMusicByUserId(user.id);
      
      res.status(200).json(music);
    } catch (error) {
      console.error('Get music error:', error);
      res.status(500).json({ message: 'Failed to get music' });
    }
  });
  
  // Serve single game page
  app.get('/api/game/:id', authenticateUser, async (req, res) => {
    try {
      const gameId = parseInt(req.params.id);
      
      if (isNaN(gameId)) {
        return res.status(400).json({ message: 'Invalid game ID' });
      }
      
      const user = await storage.getUserByFirebaseId(req.user.uid);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const game = await storage.getGeneratedGame(gameId);
      
      if (!game || game.userId !== user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      res.status(200).json(game);
    } catch (error) {
      console.error('Get game error:', error);
      res.status(500).json({ message: 'Failed to get game' });
    }
  });
  
  // Serve single music track
  app.get('/api/music/:id', authenticateUser, async (req, res) => {
    try {
      const musicId = parseInt(req.params.id);
      
      if (isNaN(musicId)) {
        return res.status(400).json({ message: 'Invalid music ID' });
      }
      
      const user = await storage.getUserByFirebaseId(req.user.uid);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const music = await storage.getGeneratedMusic(musicId);
      
      if (!music || music.userId !== user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      res.status(200).json(music);
    } catch (error) {
      console.error('Get music error:', error);
      res.status(500).json({ message: 'Failed to get music' });
    }
  });

  // Feedback Routes
  app.post('/api/feedback', authenticateUser, async (req, res) => {
    try {
      const { message, feedbackType, chatId } = req.body;
      
      if (!message || !feedbackType || !chatId) {
        return res.status(400).json({ message: 'Missing required parameters' });
      }
      
      const user = await storage.getUserByFirebaseId(req.user.uid);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // In a real app, we would store the feedback
      // For now, we just acknowledge it
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Feedback error:', error);
      res.status(500).json({ message: 'Failed to submit feedback' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
