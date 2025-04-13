import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  firebaseId: text("firebase_id").notNull().unique(),
  isPremium: boolean("is_premium").default(false).notNull(),
  premiumExpiresAt: timestamp("premium_expires_at"),
  displayName: text("display_name"),
  botName: text("bot_name").default("Desi AI"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  imageGenerationCount: integer("image_generation_count").default(0).notNull(),
  lastImageGenerationReset: timestamp("last_image_generation_reset"),
  preferredLanguage: text("preferred_language").default("english").notNull(),
  isOwner: boolean("is_owner").default(false).notNull(),
  paypalEmail: text("paypal_email"),
});

// Chat History schema
export const chatHistory = pgTable("chat_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Chat Messages schema
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").notNull().references(() => chatHistory.id),
  content: text("content").notNull(),
  role: text("role").notNull(), // 'user' or 'assistant'
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Memory Items schema (for premium users)
export const memoryItems = pgTable("memory_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// File Uploads schema (for premium users)
export const fileUploads = pgTable("file_uploads", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  filename: text("filename").notNull(),
  fileType: text("file_type").notNull(),
  filePath: text("file_path").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Generated Images schema
export const generatedImages = pgTable("generated_images", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  prompt: text("prompt").notNull(),
  imageUrl: text("image_url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Generated Games schema
export const generatedGames = pgTable("generated_games", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  prompt: text("prompt").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  gameCode: text("game_code").notNull(),
  gameUrl: text("game_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Generated Music schema
export const generatedMusic = pgTable("generated_music", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  prompt: text("prompt").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  musicUrl: text("music_url").notNull(),
  duration: integer("duration"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  firebaseId: true,
  displayName: true,
  botName: true,
  preferredLanguage: true,
});

export const insertChatHistorySchema = createInsertSchema(chatHistory).pick({
  userId: true,
  title: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  chatId: true,
  content: true,
  role: true,
});

export const insertMemoryItemSchema = createInsertSchema(memoryItems).pick({
  userId: true,
  content: true,
});

export const insertFileUploadSchema = createInsertSchema(fileUploads).pick({
  userId: true,
  filename: true,
  fileType: true,
  filePath: true,
});

export const insertGeneratedImageSchema = createInsertSchema(generatedImages).pick({
  userId: true,
  prompt: true,
  imageUrl: true,
});

export const insertGeneratedGameSchema = createInsertSchema(generatedGames).pick({
  userId: true,
  prompt: true,
  title: true,
  description: true,
  gameCode: true,
  gameUrl: true,
  thumbnailUrl: true,
});

export const insertGeneratedMusicSchema = createInsertSchema(generatedMusic).pick({
  userId: true,
  prompt: true,
  title: true,
  description: true, 
  musicUrl: true,
  duration: true,
});

// Zod schemas for requests
export const createChatMessageSchema = z.object({
  content: z.string().min(1),
  chatId: z.number().optional(),
});

export const generateImageSchema = z.object({
  prompt: z.string().min(1),
});

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().min(1),
  botName: z.string().min(1),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const memoryItemSchema = z.object({
  content: z.string().min(1),
});

export const uploadFileSchema = z.object({
  file: z.any(),
});

export const generateGameSchema = z.object({
  prompt: z.string().min(1),
});

export const generateMusicSchema = z.object({
  prompt: z.string().min(1),
  duration: z.number().min(5).max(180).optional(),
  genre: z.string().optional(),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type ChatHistory = typeof chatHistory.$inferSelect;
export type InsertChatHistory = z.infer<typeof insertChatHistorySchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type MemoryItem = typeof memoryItems.$inferSelect;
export type InsertMemoryItem = z.infer<typeof insertMemoryItemSchema>;
export type FileUpload = typeof fileUploads.$inferSelect;
export type InsertFileUpload = z.infer<typeof insertFileUploadSchema>;
export type GeneratedImage = typeof generatedImages.$inferSelect;
export type InsertGeneratedImage = z.infer<typeof insertGeneratedImageSchema>;
export type GeneratedGame = typeof generatedGames.$inferSelect;
export type InsertGeneratedGame = z.infer<typeof insertGeneratedGameSchema>;
export type GeneratedMusic = typeof generatedMusic.$inferSelect;
export type InsertGeneratedMusic = z.infer<typeof insertGeneratedMusicSchema>;
