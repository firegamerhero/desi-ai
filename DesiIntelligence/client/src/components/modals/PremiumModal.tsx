import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle, Lock, Image, Book, Zap, Shield } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PremiumModal = ({ isOpen, onClose }: PremiumModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { upgradeToPremium, startPremiumTrial } = useAuth();
  const { toast } = useToast();

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      await upgradeToPremium();
      toast({
        title: "Success",
        description: "You have successfully upgraded to premium",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upgrade to premium",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartTrial = async () => {
    setIsLoading(true);
    try {
      await startPremiumTrial();
      toast({
        title: "Success",
        description: "Your 2-day free trial has started",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start trial",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-accent-400 to-accent-600 h-2"></div>
        </div>
        
        <DialogHeader className="pt-6">
          <DialogTitle className="text-2xl font-heading font-semibold">Premium Features</DialogTitle>
        </DialogHeader>
        
        <p className="text-gray-600 dark:text-gray-400 mb-4">Experience Desi AI's full capabilities with premium membership:</p>
        
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-dark-400 p-3 rounded-lg flex items-start">
            <div className="bg-accent-500 text-white p-2 rounded-full mr-3">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium">Memory Feature</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Store up to 60 important details like your preferences and personal information</p>
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-dark-400 p-3 rounded-lg flex items-start">
            <div className="bg-accent-500 text-white p-2 rounded-full mr-3">
              <Book className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium">Document Analysis</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Upload and analyze PDFs, docs, and images (up to 10 per session)</p>
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-dark-400 p-3 rounded-lg flex items-start">
            <div className="bg-accent-500 text-white p-2 rounded-full mr-3">
              <Image className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium">Enhanced Image Generation</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Generate up to 20 custom images each day</p>
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-dark-400 p-3 rounded-lg flex items-start">
            <div className="bg-accent-500 text-white p-2 rounded-full mr-3">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium">Ad-Free Experience</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Enjoy a clean interface with no advertisements</p>
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-dark-400 p-3 rounded-lg flex items-start">
            <div className="bg-accent-500 text-white p-2 rounded-full mr-3">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium">Triple Answer Check</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Automatic triple verification for most accurate responses</p>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex flex-col sm:flex-row sm:space-x-3 space-y-3 sm:space-y-0">
          <Button 
            className="flex-1 bg-accent-500 hover:bg-accent-600 text-white"
            onClick={handleStartTrial}
            disabled={isLoading}
          >
            Start 2-Day Free Trial
          </Button>
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={handleUpgrade}
            disabled={isLoading}
          >
            Upgrade Now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PremiumModal;
