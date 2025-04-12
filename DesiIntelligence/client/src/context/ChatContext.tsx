import { createContext, useState, ReactNode, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { 
  sendChatMessage,
  generateImage as generateImageApi,
  createNewChat as createNewChatApi,
  getChatHistory as getChatHistoryApi,
  getChatMessages as getChatMessagesApi,
} from "@/lib/openai";
import { useToast } from "@/hooks/use-toast";

export interface Message {
  content: string;
  role: 'user' | 'assistant';
  timestamp?: string;
  imageUrl?: string;
  isImageGeneration?: boolean;
  imageCount?: number;
}

export interface Chat {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
}

interface ChatContextProps {
  messages: Message[];
  chatHistory: Chat[];
  currentChat: number | null;
  isLoading: boolean;
  sendMessage: (content: string, files?: File[]) => Promise<void>;
  generateImage: (prompt: string) => Promise<void>;
  askFollowUp: (originalMessage: string, followUpMessage: string) => Promise<void>;
  provideMessageFeedback: (message: string, feedbackType: 'positive' | 'negative') => Promise<void>;
  createNewChat: () => Promise<void>;
  setCurrentChat: (chatId: number) => void;
}

export const ChatContext = createContext<ChatContextProps | null>(null);

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider = ({ children }: ChatProviderProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatHistory, setChatHistory] = useState<Chat[]>([]);
  const [currentChat, setCurrentChatState] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [socket, setSocket] = useState<WebSocket | null>(null);

  // Load chat history when user changes
  useEffect(() => {
    if (user) {
      fetchChatHistory();
    } else {
      setChatHistory([]);
      setCurrentChatState(null);
      setMessages([]);
      if (socket) {
        socket.close();
        setSocket(null);
      }
    }
  }, [user]);

  // Load messages when current chat changes
  useEffect(() => {
    if (currentChat) {
      fetchChatMessages(currentChat);
    } else {
      setMessages([]);
    }
  }, [currentChat]);

  useEffect(() => {
    if (!user) return;

    const ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`);

    ws.onclose = () => {
      const reconnect = () => {
        if (user) {
          try {
            const newWs = new WebSocket(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`);
            newWs.onopen = () => setSocket(newWs);
            newWs.onerror = () => setTimeout(reconnect, 3000);
          } catch (error) {
            setTimeout(reconnect, 3000);
          }
        }
      };
      reconnect();
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [user]);

  const fetchChatHistory = async () => {
    try {
      const history = await getChatHistoryApi();
      setChatHistory(history);

      if (history.length > 0 && !currentChat) {
        setCurrentChatState(history[0].id);
      }
    } catch (error) {
      console.error("Error fetching chat history:", error);
      toast({
        title: "Error",
        description: "Failed to load chat history",
        variant: "destructive",
      });
    }
  };

  const fetchChatMessages = async (chatId: number) => {
    setIsLoading(true);
    try {
      const messages = await getChatMessagesApi(chatId);
      setMessages(messages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      toast({
        title: "Error",
        description: "Failed to load chat messages",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createNewChat = async () => {
    setIsLoading(true);
    try {
      const newChat = await createNewChatApi();
      setChatHistory([newChat, ...chatHistory]);
      setCurrentChatState(newChat.id);
      setMessages([]);
    } catch (error) {
      console.error("Error creating new chat:", error);
      toast({
        title: "Error",
        description: "Failed to create new chat",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const setCurrentChat = (chatId: number) => {
    setCurrentChatState(chatId);
  };

  const sendMessage = async (content: string, files?: File[]) => {
    if (!content.trim() && (!files || files.length === 0)) return;

    // Add user message to the chat
    const userMessage: Message = {
      content,
      role: 'user',
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Send files if any
      let fileUrls = [];
      if (files && files.length > 0) {
        // Handle file uploads
        const formData = new FormData();
        for (const file of files) {
          formData.append('files', file);
        }

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('File upload failed');
        }

        const data = await response.json();
        fileUrls = data.urls;
      }

      // Determine if this is for a new chat or existing chat
      let chatId = currentChat;
      if (!chatId) {
        const newChat = await createNewChatApi();
        setChatHistory([newChat, ...chatHistory]);
        chatId = newChat.id;
        setCurrentChatState(chatId);
      }

      // Send message to API with files if any
      const requestBody = {
        content,
        chatId,
        fileUrls,
        isPremium: user?.isPremium || false,
      };

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Message sending failed');
      }

      const data = await response.json();

      // Add assistant's response to the chat
      const assistantMessage: Message = {
        content: data.text,
        role: 'assistant',
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Refresh chat history to get updated titles
      fetchChatHistory();
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });

      // Add error message
      const errorMessage: Message = {
        content: "Sorry, I couldn't process your request. Please try again.",
        role: 'assistant',
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateImage = async (prompt: string) => {
    // First add user message
    const userMessage: Message = {
      content: `Generate an image: ${prompt}`,
      role: 'user',
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await generateImageApi(prompt);

      // Add assistant's response with the image
      const assistantMessage: Message = {
        content: `Here's the image based on your prompt: "${prompt}"`,
        role: 'assistant',
        timestamp: new Date().toISOString(),
        imageUrl: response.imageUrl,
        isImageGeneration: true,
        imageCount: response.imageCount,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error generating image:", error);
      toast({
        title: "Error",
        description: "Failed to generate image",
        variant: "destructive",
      });

      // Add error message
      const errorMessage: Message = {
        content: "Sorry, I couldn't generate that image. Please try again with a different prompt.",
        role: 'assistant',
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const askFollowUp = async (originalMessage: string, followUpMessage: string) => {
    const userMessage: Message = {
      content: followUpMessage,
      role: 'user',
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Send to API with context of the original message
      const response = await fetch('/api/chat/followup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalMessage,
          followUpMessage,
          chatId: currentChat,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Follow-up request failed');
      }

      const data = await response.json();

      // Add assistant's response
      const assistantMessage: Message = {
        content: data.text,
        role: 'assistant',
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending follow-up:", error);
      toast({
        title: "Error",
        description: "Failed to get a response",
        variant: "destructive",
      });

      // Add error message
      const errorMessage: Message = {
        content: "Sorry, I couldn't provide further explanation at this time.",
        role: 'assistant',
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const provideMessageFeedback = async (message: string, feedbackType: 'positive' | 'negative') => {
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          feedbackType,
          chatId: currentChat,
        }),
        credentials: 'include',
      });

      // No need to update UI for feedback
    } catch (error) {
      console.error("Error providing feedback:", error);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        chatHistory,
        currentChat,
        isLoading,
        sendMessage,
        generateImage,
        askFollowUp,
        provideMessageFeedback,
        createNewChat,
        setCurrentChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};