import { useEffect, useRef, useState } from "react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { PlusCircle, Image, Code, Book, Cpu } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface WelcomeButtonProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}

const WelcomeButton = ({ icon, title, description, onClick }: WelcomeButtonProps) => (
  <button 
    className="bg-white dark:bg-dark-500 hover:bg-gray-50 dark:hover:bg-dark-400 transition-colors p-4 rounded-lg text-left border border-gray-200 dark:border-dark-300 relative overflow-hidden group"
    onClick={onClick}
  >
    <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 paisley-accent"></div>
    <div className="absolute h-full w-1 bg-gradient-to-b from-primary-500 to-accent-500 left-0 top-0"></div>
    <div className="pl-2">
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-full bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400">
          {icon}
        </div>
        <p className="font-medium">{title}</p>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 ml-1">{description}</p>
    </div>
  </button>
);

const ChatContainer = () => {
  const { 
    messages, 
    sendMessage, 
    isLoading, 
    currentChat,
    generateImage,
    askFollowUp,
    provideMessageFeedback
  } = useChat();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [showPremiumAd, setShowPremiumAd] = useState(true);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (message: string, files?: File[]) => {
    await sendMessage(message, files);
  };

  const handleSuggestedPrompt = async (prompt: string) => {
    await sendMessage(prompt);
  };

  const handleImageGeneration = async (prompt: string) => {
    try {
      // Check image generation limits
      const freeLimit = 6;
      const premiumLimit = 20;
      const currentLimit = user?.isPremium ? premiumLimit : freeLimit;
      const currentCount = user?.imageGenerationCount || 0;

      if (currentCount >= currentLimit) {
        toast({
          title: user?.isPremium ? "Image Limit Reached" : "Free Tier Limit",
          description: user?.isPremium 
            ? "You've reached your daily limit of 20 image generations." 
            : "You've reached your free tier limit of 6 image generations. Upgrade to premium for 20 daily generations.",
          variant: "default"
        });
        return;
      }

      await generateImage(prompt);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate image. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleExplainFurther = (messageIndex: number) => {
    const message = messages[messageIndex];
    if (message.role === 'assistant') {
      askFollowUp(message.content, "Please explain this further in simpler terms.");
    }
  };

  const handleFeedback = (messageIndex: number, type: 'positive' | 'negative') => {
    const message = messages[messageIndex];
    if (message.role === 'assistant') {
      provideMessageFeedback(message.content, type);

      if (type === 'negative') {
        askFollowUp(message.content, "I didn't understand this answer. Could you please recheck and explain differently?");
      }
    }
  };

  // Show welcome screen if no messages
  if (messages.length === 0) {
    return (
      <>
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 relative bg-gray-50 dark:bg-dark-600">
          <div className="max-w-2xl mx-auto">
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <div className="w-24 h-24 rounded-full mb-4 relative overflow-hidden rangoli-bg">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-accent-500 opacity-20 indian-pattern"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="tricolor-gradient w-16 h-16 rounded-full flex items-center justify-center">
                    <span className="text-3xl font-brand text-white drop-shadow-md">Desi</span>
                  </div>
                </div>
              </div>
              <h1 className="text-3xl font-brand mb-2 bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                Namaste! Welcome to Desi AI
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-lg">
                Your personal AI assistant with an Indian touch. I can help you with questions, generate images, write code, and more - in English, Hindi, or Hinglish!
              </p>
              <div className="w-full max-w-md h-1 mb-6 relative">
                <div className="absolute inset-0 tricolor-gradient rounded-full"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-xl">
                <WelcomeButton 
                  icon={<Book className="h-5 w-5 text-primary-500" />}
                  title="Explain Bollywood movies"
                  description="Top movies, directors, and stars"
                  onClick={() => handleSuggestedPrompt("Explain Bollywood movies, including top movies, directors, and stars")}
                />
                <WelcomeButton 
                  icon={<Cpu className="h-5 w-5 text-primary-500" />}
                  title="Hindi poetry suggestions"
                  description="Famous poems and poets"
                  onClick={() => handleSuggestedPrompt("Give me some Hindi poetry suggestions from famous poets")}
                />
                <WelcomeButton 
                  icon={<PlusCircle className="h-5 w-5 text-primary-500" />}
                  title="Generate Indian recipes"
                  description="Classic and fusion dishes"
                  onClick={() => handleSuggestedPrompt("Create some Indian recipe ideas including both classic and fusion dishes")}
                />
                <WelcomeButton 
                  icon={<Image className="h-5 w-5 text-primary-500" />}
                  title="Indian festival information"
                  description="Traditions and celebrations"
                  onClick={() => handleSuggestedPrompt("Tell me about Indian festivals, their traditions and celebrations")}
                />
              </div>
            </div>
          </div>
        </div>
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </>
    );
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 relative bg-gray-50 dark:bg-dark-600" id="chat-messages">
        <div className="max-w-2xl mx-auto flex flex-col space-y-4">
          {messages.slice(-50).map((message, index) => (
            <ChatMessage
              key={index}
              content={message.content}
              role={message.role}
              timestamp={message.timestamp || new Date().toISOString()}
              imageUrl={message.imageUrl}
              isImageGeneration={message.isImageGeneration}
              imageCount={message.imageCount}
              maxImages={user?.isPremium ? 20 : 6}
              onFeedback={message.role === 'assistant' ? (type) => handleFeedback(index, type) : undefined}
              onExplainFurther={message.role === 'assistant' ? () => handleExplainFurther(index) : undefined}
            />
          ))}
        </div>

        {/* Show premium ad for free users */}
        {!user?.isPremium && showPremiumAd && (
          <div className="max-w-2xl mx-auto bg-white dark:bg-dark-500 rounded-lg border border-accent-300 dark:border-dark-400 p-5 mt-6 relative overflow-hidden">
            {/* Decorative rangoli corner */}
            <div className="absolute -top-12 -right-12 w-24 h-24 rangoli-bg opacity-20 rounded-full"></div>
            <div className="absolute -bottom-10 -left-10 w-20 h-20 rangoli-bg opacity-10 rounded-full"></div>

            <div className="flex items-start relative z-10">
              <div className="hidden sm:block">
                <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-accent-500 diwali-glow rounded-full flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 indian-pattern opacity-20"></div>
                  <span className="text-white font-brand text-xl">VIP</span>
                </div>
              </div>
              <div className="sm:ml-5 flex-1">
                <div className="flex items-center">
                  <div className="sm:hidden mr-3 w-10 h-10 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-brand text-sm">VIP</span>
                  </div>
                  <h3 className="font-brand text-xl bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                    Premium Experience
                  </h3>
                  <button 
                    className="ml-auto text-gray-500 hover:text-gray-700 dark:hover:text-gray-300" 
                    onClick={() => setShowPremiumAd(false)}
                    aria-label="Close premium ad"
                  >
                    ×
                  </button>
                </div>

                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Unlock exclusive features designed for a truly Indian experience:
                </p>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-start p-2 rounded-md bg-primary-50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-800/20">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-500 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">Faster Responses</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Ad-free experience with priority processing</p>
                    </div>
                  </div>

                  <div className="flex items-start p-2 rounded-md bg-accent-50 dark:bg-accent-900/10 border border-accent-100 dark:border-accent-800/20">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-accent-500 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">20 Image Generations</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Triple the free limit for creative visuals</p>
                    </div>
                  </div>

                  <div className="flex items-start p-2 rounded-md bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/20">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">Triple Checked Answers</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Enhanced accuracy for important inquiries</p>
                    </div>
                  </div>

                  <div className="flex items-start p-2 rounded-md bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/20">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">Memory Feature</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Store up to 60 personalized items</p>
                    </div>
                  </div>

                  <div className="flex items-start p-2 rounded-md bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/20 sm:col-span-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">Document Processing</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Upload PDFs, documents, and images (up to 10 per chat)</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                  <button className="bg-gradient-to-r from-primary-500 to-primary-600 text-white py-2.5 px-5 rounded-md transition-colors font-medium relative overflow-hidden group">
                    <span className="absolute inset-0 w-full h-full indian-pattern opacity-0 group-hover:opacity-10 transition-opacity"></span>
                    <span className="relative z-10 flex items-center justify-center">
                      <span className="text-lg mr-1.5">✨</span>
                      <span>Upgrade Now</span>
                    </span>
                  </button>
                  <button className="bg-white dark:bg-dark-500 border border-primary-500 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 py-2.5 px-5 rounded-md transition-colors font-medium">
                    <span>Try 2-Day Free Trial</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
      <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
    </>
  );
};

export default ChatContainer;