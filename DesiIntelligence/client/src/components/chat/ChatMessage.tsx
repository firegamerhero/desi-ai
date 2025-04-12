import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThumbsUp, ThumbsDown, CornerDownRight, Sparkles, Lightbulb } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export interface MessageProps {
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  imageUrl?: string;
  isImageGeneration?: boolean;
  imageCount?: number;
  maxImages?: number;
  onFeedback?: (type: 'positive' | 'negative') => void;
  onExplainFurther?: () => void;
  isLoading?: boolean; // Added loading state
}

import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { typewriterAnimation } from "@/lib/animations";

const ChatMessage = ({
  content,
  role,
  timestamp,
  imageUrl,
  isImageGeneration,
  imageCount,
  maxImages,
  onFeedback,
  onExplainFurther,
  isLoading = false // Added default value for isLoading
}: MessageProps) => {
  const { user } = useAuth();
  const displayName = user?.displayName || 'User';
  const botName = user?.botName || 'Desi AI';
  const userInitials = displayName.substring(0, 2).toUpperCase();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-16">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  if (role === 'user') {
    return (
      <div className="flex items-start justify-end space-y-2">
        <div className="message-bubble-user message-user bg-primary-500 text-white px-4 py-2 max-w-md rounded-tl-lg rounded-tr-lg rounded-bl-lg relative space-y-2">
          <p className="whitespace-pre-wrap">{content}</p>
        </div>
        <Avatar className="w-8 h-8 bg-primary-100 ml-2 flex-shrink-0 border-2 border-primary-300"/>
      </div>
    );
  }

  return (
    <motion.div 
      className="flex items-start space-y-2"
      variants={typewriterAnimation(content, user?.animationsEnabled)}
      initial="hidden"
      animate="visible"
    >
      <div className="relative">
        <Avatar className="w-8 h-8 bg-gradient-to-r from-primary-500 to-accent-500 mr-2 flex-shrink-0 diwali-glow"/>
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-accent-400 to-accent-600 rounded-full animate-pulse"></div>
      </div>
      <div className="message-bubble-bot message-assistant bg-white dark:bg-dark-500 border border-gray-200 dark:border-dark-400 px-4 py-3 max-w-md rounded-tl-lg rounded-tr-lg rounded-br-lg relative space-y-2">
        {/* Optional small decorative element in corner */}
        <div className="absolute -top-1 -left-1 w-2 h-2 bg-accent-500 rounded-full opacity-80"></div>

        <div className="whitespace-pre-wrap">
          {content.split('\n').map((line, i) => (
            <p key={i} className={i > 0 ? 'mt-2' : ''}>
              {line}
            </p>
          ))}
        </div>
        {user?.isPremium && (
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            ✓ Triple-verified response
          </div>
        )}

        {imageUrl && (
          <div className="mt-3">
            <div className="rounded-lg overflow-hidden mb-2 border border-accent-300">
              <img 
                src={imageUrl} 
                alt="AI generated image" 
                className="w-full object-cover"
              />
            </div>
            {isImageGeneration && (
              <div className="flex items-center justify-between text-xs mt-1">
                <p className="text-gray-500 dark:text-gray-400">
                  Image {imageCount}/{maxImages}
                </p>
                {user?.isPremium ? (
                  <span className="bg-accent-500/20 text-accent-700 px-2 py-0.5 rounded-full text-xs flex items-center">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Premium
                  </span>
                ) : (
                  <span className="text-gray-500 dark:text-gray-400">
                    Free tier
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {onFeedback && (
          <div className="mt-3 flex flex-wrap gap-2 items-center text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-dark-400">
            <span>Did this answer help you?</span>
            <div className="flex ml-auto">
              <button 
                className="p-1.5 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400 rounded-md transition-colors"
                onClick={() => onFeedback('positive')}
                aria-label="Thumbs up"
              >
                <ThumbsUp className="h-4 w-4" />
              </button>
              <button 
                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-md transition-colors ml-1"
                onClick={() => onFeedback('negative')}
                aria-label="Thumbs down"
              >
                <ThumbsDown className="h-4 w-4" />
              </button>
              {onExplainFurther && (
                <button 
                  className="p-1.5 ml-1 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 rounded-md transition-colors flex items-center"
                  onClick={onExplainFurther}
                >
                  <Lightbulb className="h-4 w-4" />
                </button>
              )}
            </div>
            {onExplainFurther && (
              <button 
                className="w-full text-left text-secondary-500 hover:text-secondary-600 dark:hover:text-secondary-400 flex items-center text-xs"
                onClick={onExplainFurther}
              >
                <CornerDownRight className="h-3 w-3 mr-1 flex-shrink-0" />
                <span>Can you explain this further in simpler terms?</span>
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ChatMessage;