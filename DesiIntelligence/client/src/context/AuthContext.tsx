import { 
  createContext, 
  useState, 
  useEffect, 
  ReactNode 
} from "react";
import { 
  User as FirebaseUser,
  UserCredential
} from "firebase/auth";
import { 
  auth, 
  loginWithEmail,
  registerWithEmail,
  signOut as firebaseSignOut,
  listenToAuthChanges
} from "@/lib/firebase";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: number;
  firebaseId: string;
  email: string;
  displayName: string;
  botName: string;
  isPremium: boolean;
  premiumExpiresAt?: string;
  imageGenerationCount: number;
  preferredLanguage: string;
  isOwner: boolean;
  paypalEmail?: string;
  animationsEnabled: boolean;
  darkMode: boolean;
  remindersList: Array<{id: string; title: string; datetime: string}>;
  notes: Array<{id: string; content: string; createdAt: string}>;
}

interface AuthContextProps {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<UserCredential>;
  register: (email: string, password: string, displayName: string, botName: string) => Promise<void>;
  signOut: () => Promise<void>;
  upgradeToPremium: () => Promise<void>;
  startPremiumTrial: () => Promise<void>;
  updateUserPreference: (preferences: Partial<User>) => Promise<void>;
}

export const AuthContext = createContext<AuthContextProps | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = listenToAuthChanges(async (firebaseUser) => {
      setIsLoading(true);
      
      try {
        if (firebaseUser) {
          // User is logged in, fetch user data from our backend
          const token = await firebaseUser.getIdToken();
          const response = await fetch("/api/auth/me", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            credentials: "include",
          });
          
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else {
            // User exists in Firebase but not in our database, create a new user
            try {
              const createResponse = await fetch("/api/auth/register", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  email: firebaseUser.email,
                  displayName: firebaseUser.displayName || "User",
                  botName: "Desi AI",
                }),
                credentials: "include",
              });
              
              if (createResponse.ok) {
                const newUserData = await createResponse.json();
                setUser(newUserData);
              } else {
                await firebaseSignOut();
                setUser(null);
              }
            } catch (error) {
              console.error("Error creating user:", error);
              await firebaseSignOut();
              setUser(null);
            }
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Auth state change error:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    });
    
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const result = await loginWithEmail(email, password);
      if (result.user.email === 'firegamerhero5@gmail.com') {
        const token = await result.user.getIdToken();
        await fetch("/api/auth/make-owner", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ isOwner: true }),
          credentials: "include",
        });
      }
      return result;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const updatePaypalEmail = async (newPaypalEmail: string) => {
    if (!user?.isOwner) return;
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch("/api/settings/paypal-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ paypalEmail: newPaypalEmail }),
        credentials: "include",
      });
      
      if (response.ok) {
        setUser(prev => prev ? { ...prev, paypalEmail: newPaypalEmail } : null);
      }
    } catch (error) {
      console.error("PayPal email update error:", error);
      throw error;
    }
  };

  const register = async (email: string, password: string, displayName: string, botName: string) => {
    try {
      const result = await registerWithEmail(email, password, displayName);
      const token = await result.user.getIdToken();
      
      // Register the user in our backend
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email,
          displayName,
          botName,
        }),
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to register user");
      }
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut();
      setUser(null);
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out",
      });
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    }
  };

  const upgradeToPremium = async () => {
    try {
      const response = await apiRequest("POST", "/api/subscription/upgrade", undefined);
      
      if (response.ok) {
        const updatedUser = await response.json();
        setUser({ ...user, ...updatedUser });
      } else {
        throw new Error("Failed to upgrade to premium");
      }
    } catch (error) {
      console.error("Upgrade error:", error);
      throw error;
    }
  };

  const startPremiumTrial = async () => {
    try {
      const response = await apiRequest("POST", "/api/subscription/trial", undefined);
      
      if (response.ok) {
        const updatedUser = await response.json();
        setUser({ ...user, ...updatedUser });
      } else {
        throw new Error("Failed to start premium trial");
      }
    } catch (error) {
      console.error("Trial start error:", error);
      throw error;
    }
  };

  const updateUserPreference = async (preferences: Partial<User>) => {
    if (!user) return;
    
    try {
      // Update local state immediately for responsive UI
      setUser({ ...user, ...preferences });
      
      // Check for and apply any available fixes
      const response = await fetch('/api/auto-fix/check', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`
        }
      });
      
      if (response.ok) {
        const fixes = await response.json();
        if (fixes.available) {
          // Apply fixes automatically
          await fetch('/api/auto-fix/apply', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`
            }
          });
          
          // Refresh the page to apply fixes
          window.location.reload();
        }
      }
    } catch (error) {
      console.error("Update preference error:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        signOut,
        upgradeToPremium,
        startPremiumTrial,
        updateUserPreference,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
