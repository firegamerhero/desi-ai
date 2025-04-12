import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const signupSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  displayName: z.string().min(1, { message: "Display name is required" }),
  botName: z.string().min(1, { message: "Bot name is required" }),
});

type SignupFormData = z.infer<typeof signupSchema>;

interface SignupModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onLoginClick?: () => void;
}

const SignupModal = ({ isOpen, onClose, onLoginClick }: SignupModalProps) => {
  const { register } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      displayName: "",
      botName: "Desi AI",
    },
  });

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    try {
      await register(data.email, data.password, data.displayName, data.botName);
      toast({
        title: "Success",
        description: "Your account has been created successfully",
      });
      if (onClose) onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create account. Email might already be in use.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-accent-500 h-2"></div>
        </div>
        
        <DialogHeader className="pt-6">
          <DialogTitle className="text-2xl font-heading font-semibold">Join Desi AI</DialogTitle>
        </DialogHeader>
        
        <div className="flex border-b border-gray-200 dark:border-dark-400 mb-4">
          <button 
            className="py-2 px-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            onClick={onLoginClick}
          >
            Login
          </button>
          <button className="py-2 px-4 border-b-2 border-primary-500 text-primary-500 font-medium">
            Sign Up
          </button>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What should Desi AI call you?</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="botName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What would you like to call me?</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full bg-primary-500 hover:bg-primary-600" disabled={isLoading}>
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
        </Form>
        
        <div className="text-sm text-center mt-4 text-gray-500">
          By signing up, you agree to our{" "}
          <a href="#" className="text-primary-500 hover:underline">Terms of Service</a> and{" "}
          <a href="#" className="text-primary-500 hover:underline">Privacy Policy</a>.
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SignupModal;
