import { storage } from './server/storage';
import { log } from './server/vite';

// Test the database functionality
async function testDatabase() {
  try {
    log('🧪 Starting database test...');
    
    // 1. Create a test user
    const testUser = await storage.createUser({
      username: 'testuser' + Date.now(),
      password: 'password123',
      email: `test${Date.now()}@example.com`,
      firebaseId: `firebase${Date.now()}`,
      displayName: 'Test User',
      botName: 'Test Bot',
      preferredLanguage: 'english'
    });
    
    log(`✅ User created: ${testUser.username} (ID: ${testUser.id})`);
    
    // 2. Create a chat history for the user
    const chatHistory = await storage.createChatHistory({
      userId: testUser.id,
      title: 'Test Conversation'
    });
    
    log(`✅ Chat history created: ${chatHistory.title} (ID: ${chatHistory.id})`);
    
    // 3. Add some messages to the chat
    const userMessage = await storage.createChatMessage({
      chatId: chatHistory.id,
      content: 'Hello, Desi AI!',
      role: 'user'
    });
    
    log(`✅ User message created: ${userMessage.content}`);
    
    const assistantMessage = await storage.createChatMessage({
      chatId: chatHistory.id,
      content: 'Namaste! How can I assist you today?',
      role: 'assistant'
    });
    
    log(`✅ Assistant message created: ${assistantMessage.content}`);
    
    // 4. Retrieve the messages to verify they were saved
    const messages = await storage.getChatMessagesByChatId(chatHistory.id);
    
    log(`✅ Retrieved ${messages.length} messages from chat ID ${chatHistory.id}`);
    messages.forEach((msg, index) => {
      log(`  Message ${index + 1}: ${msg.role} - ${msg.content}`);
    });
    
    // 5. Retrieve the chat history for the user
    const userChats = await storage.getChatHistoryByUserId(testUser.id);
    
    log(`✅ Retrieved ${userChats.length} chats for user ID ${testUser.id}`);
    userChats.forEach((chat, index) => {
      log(`  Chat ${index + 1}: ${chat.title} (created: ${chat.createdAt})`);
    });
    
    // 6. Test premium features (memory items)
    const memoryItem = await storage.createMemoryItem({
      userId: testUser.id,
      content: 'Test memory item for premium features'
    });
    
    log(`✅ Memory item created: ${memoryItem.content} (ID: ${memoryItem.id})`);
    
    const memoryItems = await storage.getMemoryItemsByUserId(testUser.id);
    
    log(`✅ Retrieved ${memoryItems.length} memory items for user ID ${testUser.id}`);
    
    // 7. Test user update
    const updatedUser = await storage.updateUser(testUser.id, {
      isPremium: true,
      imageGenerationCount: 5
    });
    
    log(`✅ User updated: isPremium = ${updatedUser.isPremium}, imageGenerationCount = ${updatedUser.imageGenerationCount}`);
    
    // Final test status
    log('🎉 All database tests completed successfully!');
    return true;
  } catch (error) {
    log(`❌ Test failed: ${error}`);
    return false;
  }
}

// Run the test
testDatabase().then(success => {
  if (success) {
    console.log('Database test completed successfully!');
  } else {
    console.error('Database test failed!');
  }
}).catch(err => {
  console.error('Error running database test:', err);
});