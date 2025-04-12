import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import ChatContainer from "@/components/chat/ChatContainer";
import LanguageSelector from "@/components/shared/LanguageSelector";
import { Bell, Menu } from "lucide-react";
import { useMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";

const Chat = () => {
  const { isMobile } = useMobile();
  const [showSidebar, setShowSidebar] = useState(false);
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  
  if (!user) {
    setLocation("/login");
    return null;
  }

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - Hidden on mobile by default */}
      {isMobile ? (
        showSidebar && (
          <div className="fixed inset-0 z-50">
            <div 
              className="absolute inset-0 bg-black bg-opacity-50"
              onClick={toggleSidebar}
            />
            <Sidebar isMobile={true} onClose={toggleSidebar} />
          </div>
        )
      ) : (
        <Sidebar />
      )}

      {/* Mobile Menu Button */}
      {isMobile && (
        <div className="md:hidden absolute top-4 left-4 z-20">
          <Button 
            variant="outline"
            size="icon"
            className="p-2 rounded-md bg-white dark:bg-dark-500 shadow-md"
            onClick={toggleSidebar}
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Chat Header */}
        <header className="h-16 bg-white dark:bg-dark-500 border-b border-gray-200 dark:border-dark-400 flex items-center px-4 md:px-6">
          {isMobile && (
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center md:hidden">
              <span className="text-white font-bold text-lg">D</span>
            </div>
          )}
          <h1 className="ml-2 md:ml-0 font-heading font-semibold text-xl">
            {user?.botName || "Desi AI"}
          </h1>
          
          <div className="ml-auto flex items-center space-x-4">
            {/* Language Selector */}
            <LanguageSelector />
            
            {/* Notifications */}
            <button className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-dark-400 transition-colors relative">
              <Bell className="h-6 w-6" />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-primary-500"></span>
            </button>
          </div>
        </header>
        
        {/* Chat Content */}
        <ChatContainer />
      </main>
    </div>
  );
};

export default Chat;
