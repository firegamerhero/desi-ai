import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Chat from "@/pages/Chat";
import Settings from "@/pages/Settings";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import LoginModal from "@/components/modals/LoginModal";
import SignupModal from "@/components/modals/SignupModal";
import PremiumModal from "@/components/modals/PremiumModal";
import { AuthProvider } from "./context/AuthContext";
import { ChatProvider } from "./context/ChatContext";

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location, setLocation] = useLocation();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && location !== "/login") {
      setLocation("/login");
    }
  }, [isAuthenticated, isLoading, location, setLocation]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-white to-gray-50 dark:from-dark-600 dark:to-dark-700">
        <div className="w-32 h-32 relative mb-4 will-change-transform">
          <img 
            src="/generated-icon.png"
            alt="Desi AI Logo"
            className="w-full h-full object-contain animate-pulse"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-accent-500 opacity-20 rounded-full animate-ping"></div>
        </div>
        <div className="w-16 h-16 border-4 border-primary-500 border-dashed rounded-full animate-spin will-change-transform"></div>
        <p className="mt-4 text-lg font-brand bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent select-none">
          Loading Desi AI...
        </p>
      </div>
    );
  }

  return (
    <div className="font-sans bg-gray-50 dark:bg-dark-600 text-gray-900 dark:text-gray-100 transition-colors duration-200 min-h-screen">
      <Switch>
        <Route path="/" component={Chat} />
        <Route path="/settings" component={Settings} />
        <Route path="/login">
          {isAuthenticated ? () => {
            setLocation("/");
            return null;
          } : () => <LoginModal isOpen={true} />}
        </Route>
        <Route component={NotFound} />
      </Switch>
      <Toaster />
      
      {!isAuthenticated && showLoginModal && (
        <LoginModal 
          isOpen={showLoginModal} 
          onClose={() => setShowLoginModal(false)}
          onSignupClick={() => {
            setShowLoginModal(false);
            setShowSignupModal(true);
          }}
        />
      )}
      
      {!isAuthenticated && showSignupModal && (
        <SignupModal 
          isOpen={showSignupModal} 
          onClose={() => setShowSignupModal(false)}
          onLoginClick={() => {
            setShowSignupModal(false);
            setShowLoginModal(true);
          }}
        />
      )}
      
      {isAuthenticated && showPremiumModal && (
        <PremiumModal 
          isOpen={showPremiumModal} 
          onClose={() => setShowPremiumModal(false)} 
        />
      )}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ChatProvider>
          <AppRoutes />
        </ChatProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
