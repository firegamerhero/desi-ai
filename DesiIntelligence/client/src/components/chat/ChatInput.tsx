import { useState, useRef, useEffect } from "react";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Paperclip, Mic, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ChatInputProps {
  onSendMessage: (message: string, files?: File[]) => Promise<void>;
  isLoading: boolean;
}

const ChatInput = ({ onSendMessage, isLoading }: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "48px";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() && files.length === 0) return;

    try {
      await onSendMessage(message, files.length > 0 ? files : undefined);
      setMessage("");
      setFiles([]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const selectedFiles = Array.from(e.target.files);
    
    // Check if premium features are required
    if (!user?.isPremium && selectedFiles.length > 0) {
      toast({
        title: "Premium Feature",
        description: "File uploads are only available for premium users.",
        variant: "default",
      });
      return;
    }

    // Check file limits for premium users
    if (user?.isPremium && selectedFiles.length > 10) {
      toast({
        title: "Limit Exceeded",
        description: "Premium users can upload up to 10 files per session.",
        variant: "default",
      });
      return;
    }

    setFiles(selectedFiles);
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="bg-white dark:bg-dark-500 border-t border-gray-200 dark:border-dark-400 p-4">
      <div className="max-w-2xl mx-auto relative">
        <form 
          onSubmit={handleSubmit}
          className="relative bg-gray-100 dark:bg-dark-400 rounded-lg overflow-hidden"
        >
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Desi AI..."
            className="w-full bg-transparent border-0 p-4 pr-16 pb-3 max-h-36 h-12 resize-none focus:ring-0 focus:outline-none dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900"
            disabled={isLoading}
          />
          
          {files.length > 0 && (
            <div className="px-4 pb-2 flex flex-wrap gap-2">
              {files.map((file, index) => (
                <div 
                  key={index} 
                  className="bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 px-2 py-1 rounded text-xs flex items-center"
                >
                  {file.name}
                  <button 
                    type="button" 
                    className="ml-1 hover:text-primary-900" 
                    onClick={() => setFiles(files.filter((_, i) => i !== index))}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div className="absolute bottom-1 right-2 flex items-center space-x-1">
            <input 
              type="file" 
              className="hidden" 
              multiple 
              ref={fileInputRef} 
              onChange={handleFileChange} 
            />
            
            <button 
              type="button" 
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              onClick={handleFileClick}
              aria-label="Attach files"
            >
              <Paperclip className="h-5 w-5" />
            </button>
            
            <button 
              type="button" 
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              aria-label="Voice input"
            >
              <Mic className="h-5 w-5" />
            </button>
            
            <button 
              type="submit" 
              className="bg-primary-500 hover:bg-primary-600 text-white p-2 rounded-md transition-colors"
              aria-label="Send message"
              disabled={isLoading || (!message.trim() && files.length === 0)}
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </form>
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
          Desi AI can make mistakes. Consider checking important information.
        </p>
      </div>
    </div>
  );
};

export default ChatInput;
