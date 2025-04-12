import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import ThemeToggle from "@/components/shared/ThemeToggle";
import { 
  Settings, 
  Plus, 
  LogOut, 
  MessageCircle,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface SidebarProps {
  isMobile?: boolean;
  onClose?: () => void;
}

const Sidebar = ({ isMobile, onClose }: SidebarProps) => {
  const [location] = useLocation();
  const { chatHistory, setCurrentChat, createNewChat } = useChat();
  const { user, signOut } = useAuth();
  const [showFullHistory, setShowFullHistory] = useState(false);

  // Limit displayed chat history
  const displayedHistory = showFullHistory 
    ? chatHistory 
    : chatHistory.slice(0, 5);

  const handleNewChat = async () => {
    await createNewChat();
    if (isMobile && onClose) onClose();
  };

  const handleChatSelect = (chatId: number) => {
    setCurrentChat(chatId);
    if (isMobile && onClose) onClose();
  };

  const userInitials = user?.displayName 
    ? user.displayName.substring(0, 2).toUpperCase() 
    : "U";

  // Calculate days remaining in premium trial
  const daysRemaining = user?.premiumExpiresAt 
    ? Math.max(0, Math.ceil((new Date(user.premiumExpiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const isPremium = user?.isPremium;
  const isTrialActive = isPremium && daysRemaining > 0;

  return (
    <aside className={`flex flex-col w-64 bg-white dark:bg-dark-500 border-r border-gray-200 dark:border-dark-400 transition-all duration-300 ease-in-out z-20 overflow-hidden ${isMobile ? 'h-full' : 'h-screen'}`}>
      {/* Logo and App Name */}
      <div className="flex items-center h-16 px-4 border-b border-gray-200 dark:border-dark-400 relative overflow-hidden">
        <div className="absolute inset-0 indian-pattern opacity-5"></div>
        <div className="flex items-center space-x-2 relative z-10">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center diwali-glow relative overflow-hidden">
            <div className="absolute inset-0 paisley-accent opacity-20"></div>
            <span className="text-white font-brand text-xl">D</span>
          </div>
          <h1 className="font-brand text-2xl bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">Desi AI</h1>
        </div>
        {isMobile && onClose && (
          <button 
            className="ml-auto p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-dark-400 transition-colors relative z-10"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>

      {/* New Chat Button */}
      <div className="p-4">
        <Button 
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white relative overflow-hidden group"
          onClick={handleNewChat}
        >
          <span className="absolute inset-0 w-full h-full indian-pattern opacity-0 group-hover:opacity-10 transition-opacity"></span>
          <span className="relative z-10 flex items-center">
            <Plus className="h-5 w-5 mr-1" />
            <span>New Chat</span>
          </span>
        </Button>
      </div>

      {/* Conversation History */}
      <div className="flex-1 overflow-y-auto">
        <h2 className="text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold px-4 pt-4 pb-2 flex items-center">
          <span className="bg-primary-100 dark:bg-primary-900/30 w-1.5 h-1.5 rounded-full mr-1.5"></span>
          Recent Conversations
        </h2>
        {chatHistory.length === 0 ? (
          <div className="px-4 py-3 rounded-md mx-2 bg-gray-50 dark:bg-dark-400/20 border border-gray-100 dark:border-dark-500">
            <p className="text-gray-500 dark:text-gray-400 text-sm text-center">
              No conversations yet
            </p>
            <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-1">
              Start a new chat to begin
            </p>
          </div>
        ) : (
          <ul className="space-y-1 px-2">
            {displayedHistory.map((chat) => (
              <li key={chat.id}>
                <button 
                  className={`flex items-center py-2 px-4 hover:bg-gray-50 dark:hover:bg-dark-400/50 transition-colors rounded-md w-full text-left relative overflow-hidden group ${
                    location === `/chat/${chat.id}` ? 'bg-gray-50 dark:bg-dark-400/50 border-l-2 border-primary-500' : ''
                  }`}
                  onClick={() => handleChatSelect(chat.id)}
                >
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary-500 to-accent-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <MessageCircle className="h-5 w-5 text-primary-400 dark:text-primary-500 flex-shrink-0" />
                  <span className="ml-3 truncate">{chat.title}</span>
                </button>
              </li>
            ))}
            {chatHistory.length > 5 && (
              <li className="px-2 py-1 mt-1">
                <button 
                  className="text-xs text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 flex items-center justify-center w-full rounded-md py-1 hover:bg-gray-50 dark:hover:bg-dark-400/30 transition-colors"
                  onClick={() => setShowFullHistory(!showFullHistory)}
                >
                  {showFullHistory ? 'Show less chats' : 'Show more chats'} 
                  <ChevronDown className={`h-3 w-3 ml-1 transition-transform ${showFullHistory ? 'rotate-180' : ''}`} />
                </button>
              </li>
            )}
          </ul>
        )}
      </div>

      {/* Account & Settings */}
      <div className="border-t border-gray-200 dark:border-dark-400 p-4 space-y-3">
        {/* Premium Status */}
        {isPremium ? (
          <div className="relative overflow-hidden rounded-lg mb-4">
            <div className="absolute inset-0 rangoli-bg opacity-5"></div>
            <div className="flex items-center justify-between bg-gradient-to-r from-accent-400 to-accent-600 text-gray-900 p-3 relative z-10">
              <div className="flex items-center">
                <span className="w-8 h-8 flex-shrink-0 rounded-full bg-white/20 flex items-center justify-center mr-2">
                  <span className="text-xs font-brand">✦</span>
                </span>
                <div>
                  <p className="text-sm font-medium">
                    {isTrialActive ? 'Free Trial Access' : 'Premium Account'}
                  </p>
                  {isTrialActive && (
                    <p className="text-xs">{daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining</p>
                  )}
                </div>
              </div>
              {!isTrialActive && (
                <div className="text-xs font-medium bg-white/30 backdrop-blur-sm px-3 py-1 rounded-full diwali-glow">
                  Active
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-lg mb-4 group">
            <div className="absolute inset-0 paisley-accent opacity-5 group-hover:opacity-10 transition-opacity"></div>
            <Button 
              className="w-full bg-gradient-to-r from-accent-400 to-accent-600 text-gray-900 hover:from-accent-500 hover:to-accent-700 relative z-10 py-3"
            >
              <div className="flex items-center">
                <span className="text-lg mr-1.5">✨</span>
                <span className="font-medium">Upgrade to Premium</span>
              </div>
            </Button>
          </div>
        )}

        {/* Settings Link */}
        <Link href="/settings">
          <a className="flex items-center py-2 px-3 hover:bg-gray-100 dark:hover:bg-dark-400 rounded-md transition-colors">
            <Settings className="h-5 w-5 text-gray-500" />
            <span className="ml-3">Settings</span>
          </a>
        </Link>

        {/* Theme Toggle */}
        <div className="flex items-center justify-between py-2 px-3">
          <span className="text-sm">Dark Mode</span>
          <ThemeToggle />
        </div>

        <Separator className="my-2" />

        {/* User Profile */}
        <div className="flex items-center pt-1 p-2 bg-gray-50 dark:bg-dark-400/20 rounded-lg mt-1 relative overflow-hidden">
          <div className="absolute inset-0 indian-pattern opacity-5"></div>
          <Avatar className="w-9 h-9 border-2 border-primary-100 dark:border-primary-900 diwali-glow">
            <AvatarFallback className="bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 text-primary-700 dark:text-primary-300 font-medium">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="ml-3 relative z-10">
            <p className="text-sm font-medium">{user?.displayName}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
          </div>
          <button 
            className="ml-auto p-1.5 rounded-md hover:bg-white dark:hover:bg-dark-400 transition-colors relative z-10" 
            aria-label="Sign out"
            onClick={signOut}
          >
            <LogOut className="h-5 w-5 text-primary-500" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;