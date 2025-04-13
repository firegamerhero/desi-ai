import { apiRequest } from "./queryClient";

// Client-side OpenAI API calls

export const sendChatMessage = async (message: string, chatId?: number) => {
  const response = await apiRequest(
    "POST", 
    "/api/chat", 
    { content: message, chatId }
  );
  return response.json();
};

export const generateImage = async (prompt: string) => {
  const response = await apiRequest(
    "POST", 
    "/api/image/generate", 
    { prompt }
  );
  return response.json();
};

export const checkCode = async (code: string, language: string) => {
  const response = await apiRequest(
    "POST", 
    "/api/code/check", 
    { code, language }
  );
  return response.json();
};

export const addMemoryItem = async (content: string) => {
  const response = await apiRequest(
    "POST", 
    "/api/memory", 
    { content }
  );
  return response.json();
};

export const getMemoryItems = async () => {
  const response = await apiRequest("GET", "/api/memory", undefined);
  return response.json();
};

export const createNewChat = async () => {
  const response = await apiRequest("POST", "/api/chat/new", undefined);
  return response.json();
};

export const getChatHistory = async () => {
  const response = await apiRequest("GET", "/api/chat/history", undefined);
  return response.json();
};

export const getChatMessages = async (chatId: number) => {
  const response = await apiRequest("GET", `/api/chat/${chatId}`, undefined);
  return response.json();
};
