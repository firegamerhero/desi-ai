import { 
  users, 
  chatHistory, 
  chatMessages, 
  memoryItems, 
  fileUploads, 
  generatedImages,
  generatedGames,
  generatedMusic,
  type User, 
  type InsertUser, 
  type ChatHistory, 
  type InsertChatHistory, 
  type ChatMessage, 
  type InsertChatMessage, 
  type MemoryItem, 
  type InsertMemoryItem, 
  type FileUpload, 
  type InsertFileUpload, 
  type GeneratedImage, 
  type InsertGeneratedImage,
  type GeneratedGame,
  type InsertGeneratedGame,
  type GeneratedMusic,
  type InsertGeneratedMusic
} from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByFirebaseId(firebaseId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, fields: Partial<User>): Promise<User>;
  
  // Chat operations
  getChatHistory(id: number): Promise<ChatHistory | undefined>;
  getChatHistoryByUserId(userId: number): Promise<ChatHistory[]>;
  createChatHistory(chat: InsertChatHistory): Promise<ChatHistory>;
  
  // Message operations
  getChatMessage(id: number): Promise<ChatMessage | undefined>;
  getChatMessagesByChatId(chatId: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  
  // Memory operations (premium feature)
  getMemoryItem(id: number): Promise<MemoryItem | undefined>;
  getMemoryItemsByUserId(userId: number): Promise<MemoryItem[]>;
  createMemoryItem(item: InsertMemoryItem): Promise<MemoryItem>;
  deleteMemoryItem(id: number): Promise<boolean>;
  
  // File upload operations (premium feature)
  getFileUpload(id: number): Promise<FileUpload | undefined>;
  getFileUploadsByUserId(userId: number): Promise<FileUpload[]>;
  createFileUpload(file: InsertFileUpload): Promise<FileUpload>;
  deleteFileUpload(id: number): Promise<boolean>;
  
  // Generated image operations
  getGeneratedImage(id: number): Promise<GeneratedImage | undefined>;
  getGeneratedImagesByUserId(userId: number): Promise<GeneratedImage[]>;
  createGeneratedImage(image: InsertGeneratedImage): Promise<GeneratedImage>;
  
  // Generated game operations
  getGeneratedGame(id: number): Promise<GeneratedGame | undefined>;
  getGeneratedGamesByUserId(userId: number): Promise<GeneratedGame[]>;
  createGeneratedGame(game: InsertGeneratedGame): Promise<GeneratedGame>;
  
  // Generated music operations
  getGeneratedMusic(id: number): Promise<GeneratedMusic | undefined>;
  getGeneratedMusicByUserId(userId: number): Promise<GeneratedMusic[]>;
  createGeneratedMusic(music: InsertGeneratedMusic): Promise<GeneratedMusic>;
}

import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return results.length > 0 ? results[0] : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return results.length > 0 ? results[0] : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return results.length > 0 ? results[0] : undefined;
  }

  async getUserByFirebaseId(firebaseId: string): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.firebaseId, firebaseId)).limit(1);
    return results.length > 0 ? results[0] : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const results = await db.insert(users).values({
      ...insertUser,
      isPremium: false,
      imageGenerationCount: 0
    }).returning();
    
    return results[0];
  }

  async updateUser(id: number, fields: Partial<User>): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    const results = await db.update(users)
      .set({
        ...fields,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    
    return results[0];
  }

  // Chat operations
  async getChatHistory(id: number): Promise<ChatHistory | undefined> {
    const results = await db.select().from(chatHistory).where(eq(chatHistory.id, id)).limit(1);
    return results.length > 0 ? results[0] : undefined;
  }

  async getChatHistoryByUserId(userId: number): Promise<ChatHistory[]> {
    return await db.select()
      .from(chatHistory)
      .where(eq(chatHistory.userId, userId))
      .orderBy(desc(chatHistory.updatedAt));
  }

  async createChatHistory(insertChat: InsertChatHistory): Promise<ChatHistory> {
    const results = await db.insert(chatHistory)
      .values(insertChat)
      .returning();
    
    return results[0];
  }

  // Message operations
  async getChatMessage(id: number): Promise<ChatMessage | undefined> {
    const results = await db.select().from(chatMessages).where(eq(chatMessages.id, id)).limit(1);
    return results.length > 0 ? results[0] : undefined;
  }

  async getChatMessagesByChatId(chatId: number): Promise<ChatMessage[]> {
    const messages = await db.select()
      .from(chatMessages)
      .where(eq(chatMessages.chatId, chatId))
      .orderBy(chatMessages.timestamp);
      
    return messages;
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    // First, create the message
    const messageResults = await db.insert(chatMessages)
      .values(insertMessage)
      .returning();
    
    // Then, update the chat's updatedAt timestamp
    await db.update(chatHistory)
      .set({ updatedAt: new Date() })
      .where(eq(chatHistory.id, insertMessage.chatId));
    
    return messageResults[0];
  }

  // Memory operations (premium feature)
  async getMemoryItem(id: number): Promise<MemoryItem | undefined> {
    const results = await db.select().from(memoryItems).where(eq(memoryItems.id, id)).limit(1);
    return results.length > 0 ? results[0] : undefined;
  }

  async getMemoryItemsByUserId(userId: number): Promise<MemoryItem[]> {
    return await db.select()
      .from(memoryItems)
      .where(eq(memoryItems.userId, userId))
      .orderBy(desc(memoryItems.createdAt));
  }

  async createMemoryItem(insertItem: InsertMemoryItem): Promise<MemoryItem> {
    const results = await db.insert(memoryItems)
      .values(insertItem)
      .returning();
    
    return results[0];
  }

  async deleteMemoryItem(id: number): Promise<boolean> {
    const result = await db.delete(memoryItems).where(eq(memoryItems.id, id)).returning();
    return result.length > 0;
  }

  // File upload operations (premium feature)
  async getFileUpload(id: number): Promise<FileUpload | undefined> {
    const results = await db.select().from(fileUploads).where(eq(fileUploads.id, id)).limit(1);
    return results.length > 0 ? results[0] : undefined;
  }

  async getFileUploadsByUserId(userId: number): Promise<FileUpload[]> {
    return await db.select()
      .from(fileUploads)
      .where(eq(fileUploads.userId, userId))
      .orderBy(desc(fileUploads.createdAt));
  }

  async createFileUpload(insertFile: InsertFileUpload): Promise<FileUpload> {
    const results = await db.insert(fileUploads)
      .values(insertFile)
      .returning();
    
    return results[0];
  }

  async deleteFileUpload(id: number): Promise<boolean> {
    const result = await db.delete(fileUploads).where(eq(fileUploads.id, id)).returning();
    return result.length > 0;
  }

  // Generated image operations
  async getGeneratedImage(id: number): Promise<GeneratedImage | undefined> {
    const results = await db.select().from(generatedImages).where(eq(generatedImages.id, id)).limit(1);
    return results.length > 0 ? results[0] : undefined;
  }

  async getGeneratedImagesByUserId(userId: number): Promise<GeneratedImage[]> {
    return await db.select()
      .from(generatedImages)
      .where(eq(generatedImages.userId, userId))
      .orderBy(desc(generatedImages.createdAt));
  }

  async createGeneratedImage(insertImage: InsertGeneratedImage): Promise<GeneratedImage> {
    const results = await db.insert(generatedImages)
      .values(insertImage)
      .returning();
    
    return results[0];
  }
  
  // Generated game operations
  async getGeneratedGame(id: number): Promise<GeneratedGame | undefined> {
    const results = await db.select().from(generatedGames).where(eq(generatedGames.id, id)).limit(1);
    return results.length > 0 ? results[0] : undefined;
  }

  async getGeneratedGamesByUserId(userId: number): Promise<GeneratedGame[]> {
    return await db.select()
      .from(generatedGames)
      .where(eq(generatedGames.userId, userId))
      .orderBy(desc(generatedGames.createdAt));
  }

  async createGeneratedGame(insertGame: InsertGeneratedGame): Promise<GeneratedGame> {
    const results = await db.insert(generatedGames)
      .values(insertGame)
      .returning();
    
    return results[0];
  }
  
  // Generated music operations
  async getGeneratedMusic(id: number): Promise<GeneratedMusic | undefined> {
    const results = await db.select().from(generatedMusic).where(eq(generatedMusic.id, id)).limit(1);
    return results.length > 0 ? results[0] : undefined;
  }

  async getGeneratedMusicByUserId(userId: number): Promise<GeneratedMusic[]> {
    return await db.select()
      .from(generatedMusic)
      .where(eq(generatedMusic.userId, userId))
      .orderBy(desc(generatedMusic.createdAt));
  }

  async createGeneratedMusic(insertMusic: InsertGeneratedMusic): Promise<GeneratedMusic> {
    const results = await db.insert(generatedMusic)
      .values(insertMusic)
      .returning();
    
    return results[0];
  }
}

export const storage = new DatabaseStorage();
