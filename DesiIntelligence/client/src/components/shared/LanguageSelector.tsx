import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { apiRequest } from "@/lib/queryClient";

const LanguageSelector = () => {
  const { user, updateUserPreference } = useAuth();
  const { toast } = useToast();
  const [selectedLanguage, setSelectedLanguage] = useState(
    user?.preferredLanguage || "english"
  );

  const languages = [
    { value: "english", label: "English" },
    { value: "hindi", label: "हिंदी (Hindi)" },
    { value: "hinglish", label: "Hinglish" }
  ];

  const handleLanguageChange = async (language: string) => {
    try {
      setSelectedLanguage(language);

      if (user) {
        await updateUserPreference({ preferredLanguage: language });

        // Update language on server
        await apiRequest("PATCH", "/api/user/preferences", { 
          preferredLanguage: language 
        });
      }

      toast({
        title: "Language Changed",
        description: `Your preferred language is now ${language.charAt(0).toUpperCase() + language.slice(1)}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update language preference",
        variant: "destructive",
      });
    }
  };

  const getLanguageLabel = (value: string) => {
    const language = languages.find((lang) => lang.value === value);
    return language ? language.label : "English";
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center space-x-1 px-3 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-dark-400 transition-colors focus:ring-2 focus:ring-primary focus:outline-none" aria-haspopup="listbox" aria-expanded={selectedLanguage}>
        <span>{getLanguageLabel(selectedLanguage)}</span>
        <ChevronDown className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.value}
            onClick={() => handleLanguageChange(language.value)}
            role="option"
            aria-selected={selectedLanguage === language.value}
            className={
              selectedLanguage === language.value 
                ? "bg-gray-100 dark:bg-dark-400" 
                : ""
            }
          >
            {language.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSelector;